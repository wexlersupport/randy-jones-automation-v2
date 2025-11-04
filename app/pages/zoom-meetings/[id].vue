<script setup lang="ts">
    import { ref } from 'vue'
    import { z } from 'zod'

    const { call } = useApi()
    const toast = useToast()
    const route = useRoute()
    const router = useRouter()
    const meetingId = route.params.id as string
    const personId = route.query.person_id as number | undefined
    const isLoading = ref(true)
    const isLoadingAi = ref(false)
    const isLoadingFollowUp = ref(false)
    const notes = ref<any[]>([])
    const { data }: any = await useFetch('/api/pipedrive/all_person')
    const contactList = ref<any[]>(data.value?.response || [])
    const selectedContact = ref<any>(null);
    const meetingTypeList = ref<any[]>([])
    const selectedMeetingType = ref<any>(null);
    const ai_summary = ref<any>(null);
    const meetingDetail = ref<any>(null);
    const nextMeeting = ref<any>(null);
    const nextScheduleMeeting = ref<any>(null);
    const ai_summary_html = ref<string>('');

    const { data: _data } = await useFetch('/api/postgre/dynamic_field', {
        query: {
            table: 'zoom_meetings',
            dynamic_field: 'meeting_uuid',
            value: meetingId
        }
    });
    const postgreMeeting = ref<any>(_data.value?.data[0] || null);
    const schema = z.object({
        meeting_host_id: z.string(),
        meeting_host_email: z.string().email(),
        meeting_uuid: z.string(),
        meeting_id: z.number(),
        meeting_topic: z.string(),
        meeting_start_time: z.string(),
        meeting_end_time: z.string(),
        summary_start_time: z.string(),
        summary_end_time: z.string(),
        summary_created_time: z.string(),
        summary_last_modified_time: z.string(),
        summary_title: z.string(),
        summary_overview: z.string(),
        summary_doc_url: z.string().url(),
        summary_content: z.string(),
        summary_details: z.array(z.object({
            label: z.string(),
            summary: z.string()
        })),
        next_steps: z.array(z.string()),
        ai_summary_overview: z.string().optional(),
        client_email: z.string().email().optional(),
        client_name: z.string().optional()
    })

    onMounted(async () => {
        meetingTypeList.value = leafProcess()
        selectedMeetingType.value = postgreMeeting.value ? postgreMeeting.value.signature_id : meetingTypeList.value[0].value;
        const _selectedContactId = postgreMeeting.value ? Number(postgreMeeting.value.person_id) : (personId ? Number(personId) : contactList.value[0].id);
        selectedContact.value = _selectedContactId && contactList.value.find(item => item.id === _selectedContactId) ? _selectedContactId : (personId ? Number(personId) : contactList.value[0].id);

        const { response: _notes } = await call('/api/pipedrive/all_notes', 'POST', {
            person_id: selectedContact.value, pinned_to_person_flag: 1,
        })
        if (_notes?.data?.length) {
            notes.value = _notes.data.filter((note: any) => note.content?.includes('************************************')) || []
        }

        const { response } = await call('/api/zoom/meeting_detail', 'POST', { meetingId })
        meetingDetail.value = response

        const { response: next_meeting } = await getNextMeeting(response.summary_overview)
        if (next_meeting?.choices?.length) {
            const _next_meeting = next_meeting?.choices[0]?.message?.content?.trim() || 'none';
            if (_next_meeting?.length < 7 || _next_meeting.toLowerCase().includes('none')) {
            } else {
                nextMeeting.value = _next_meeting;
            }
        }

        const nextMeetingDate = parseDateLocal(nextMeeting.value)
        nextScheduleMeeting.value = postgreMeeting.value ? postgreMeeting.value.next_meeting_date?.trim() : nextMeetingDate;
        form.value.meeting_host_email = response.meeting_host_email;
        // form.value.summary_title = response.summary_title;
        form.value.summary_overview = response.summary_overview;
        form.value.client_email = selectedContact.value ? contactList.value.find(item => item.id === selectedContact.value)?.primary_email || '' : '';
        form.value.client_name = selectedContact.value ? contactList.value.find(item => item.id === selectedContact.value)?.name || '' : '';
        const current_meeting_type = meetingTypeList.value.find(item => item.value === selectedMeetingType.value)?.label || 'Quick Call'
        form.value.summary_title = `Meeting Summary for ${form.value.client_name} - ${current_meeting_type}`;
        // ai_summary.value = postgreMeeting.value ? postgreMeeting.value.meeting_ai_summary : summary_overview
        if (postgreMeeting.value) {
            ai_summary.value = postgreMeeting.value?.meeting_ai_summary
        } else {
            const { data: summary_temp } = await getMeetingTemp()
            console.log("summary_temp:", summary_temp);

            if (summary_temp && summary_temp.length) {
                ai_summary.value = (summary_temp as any)?.[0]?.meeting_ai_summary ?? '';
            } else {
                const { response: summary_overview, data: gpt_data } = await generateSummary()
                ai_summary.value = summary_overview
                console.log("GPT data:", gpt_data);

                await createMeetingTemp(gpt_data)
            }
        }
        // if (ai_summary.value.length < 10) {
        //     const { response: summary_overview } = await generateSummary()
        //     ai_summary.value = postgreMeeting.value ? postgreMeeting.value.meeting_ai_summary : summary_overview
        // }
        await handleMeetingSummary()

        isLoading.value = false
    })

    const form = ref({
        meeting_host_id: '',
        meeting_host_email: '',
        meeting_uuid: '',
        meeting_id: 0,
        meeting_topic: '',
        meeting_start_time: '',
        meeting_end_time: '',
        summary_start_time: '',
        summary_end_time: '',
        summary_created_time: '',
        summary_last_modified_time: '',
        summary_title: '',
        summary_overview: '',
        summary_doc_url: '',
        summary_details: [],
        next_steps: [],
        summary_content: '',
        ai_summary_overview: '',
        client_email: '',
        client_name: '',
    })

    async function handleMeetingSummary() {
        isLoadingAi.value = true

        const current_meeting_type = meetingTypeList.value.find(item => item.value === selectedMeetingType.value)?.label || 'Quick Call'
        form.value.summary_title = `Meeting Summary for ${form.value.client_name} - ${current_meeting_type}`;
        let meeting_end_time: any = new Date(meetingDetail.value.meeting_end_time);
        const current_meeting_index = meetingTypeList.value.findIndex(item => item.value === selectedMeetingType.value);
        const next_meeting_type = meetingTypeList.value[current_meeting_index + 1]?.label || 'Intro';
        let next_meeting_date = ''
        if (nextScheduleMeeting.value) {
            next_meeting_date = new Date(nextScheduleMeeting.value).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
        }

        const current_meeting_date = meeting_end_time.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        let add_note_date = `${current_meeting_date} - ${current_meeting_type}  -  ${next_meeting_type} - ${next_meeting_date} \n`
        add_note_date += `************************************************************* \n\n`
        let content = ai_summary.value?.trim()
        if (content.length < 10) {
            const { response: summary_overview, data: gpt_data } = await generateSummary()
            content = summary_overview
            console.log("handleMeetingSummary GPT data:", gpt_data);

            await createMeetingTemp(gpt_data)
        }
        form.value.ai_summary_overview = postgreMeeting.value ? content : (add_note_date + content);

        isLoadingAi.value = false
    }

    async function onSubmit() {
        if (selectedContact.value === null) {
            toast.add({
                title: 'No Contact Selected',
                description: 'Please select a contact before adding the note.',
                color: 'warning'
            })
            return;
        }

        if (selectedMeetingType.value === null) {
            toast.add({
                title: 'No Meeting Type Selected',
                description: 'Please select a meeting type before adding the note.',
                color: 'warning'
            })
            return;
        }

        ai_summary_html.value = form.value.ai_summary_overview;
        form.value.ai_summary_overview = form.value.ai_summary_overview.replace(/\n/g, '<br>');
        if (notes.value.length) {
            const new_note = form.value.ai_summary_overview + "*** <br><br>" + notes.value[0].content
            const { response } = await updateNote({...notes.value[0], new_note})
        } else {
            const { response } = await addNote()
        }
        const response = await saveNewMeeting()

        toast.add({
            title: 'Note added successfully',
            description: 'AI-generated summary has been added successfully.',
            color: 'success'
        })

        setTimeout(() => {
            router.back()
        }, 1000)
    }

    async function saveNewMeeting() {
        const response = await handleApiResponse($fetch('/api/postgre', {
            query: { table: 'zoom_meetings' },
            method: 'POST',
            body: {
                note_id: notes.value.length ? notes.value[0].id : null,
                person_id: selectedContact.value,
                signature_id: selectedMeetingType.value,
                meeting_uuid: meetingDetail.value.meeting_uuid,
                meeting_ai_summary: ai_summary_html.value,
                next_meeting_date: nextScheduleMeeting.value,
                meeting_type: '',
             }
        }));

        return response
    }

    async function getMeetingDetail() {
        const response = await fetch('/api/zoom/meeting_detail', {
            method: 'POST',
            body: JSON.stringify({meetingId})
        })
        const res = await response.json()

        return res
    }

    async function generateSummary() {
        const response = await fetch('/api/openai/meeting_summary_gpt', {
            method: 'POST',
            body: JSON.stringify({
                filterObj: {
                    summary_overview: form.value.summary_overview
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function getNextMeeting(summary_overview: any = null) {
        const response = await fetch('/api/openrouterai/next_meeting', {
            method: 'POST',
            body: JSON.stringify({
                filterObj: {
                    summary_overview
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function updateNote(note: any) {
        const response = await fetch('/api/pipedrive/update_note', {
            method: 'PUT',
            body: JSON.stringify({
                new_note: note.new_note,
                id: note.id
            })
        })
        const res = await response.json()

        return res
    }

    async function addNote() {
        const response = await fetch('/api/pipedrive/add_note', {
            method: 'POST',
            body: JSON.stringify({
                ai_summary_overview: form.value.ai_summary_overview,
                person_id: selectedContact.value,
                org_id: 1
            })
        })
        const res = await response.json()

        return res
    }

    async function getNotes() {
        const res = await call('/api/pipedrive/all_notes', 'POST', {
            person_id: selectedContact.value,
            pinned_to_person_flag: 1,
        })

        return res
    }

    async function handleSelectContact(value: any) {
        const { response: _notes } = await getNotes()
        if (_notes?.data?.length) {
            notes.value = _notes.data.filter((note: any) => note.content?.includes('************************************')) || []
        } else {
            notes.value = []
        }

        form.value.client_email = selectedContact.value ? contactList.value.find(item => item.id === selectedContact.value)?.primary_email || '' : '';
        form.value.client_name = selectedContact.value ? contactList.value.find(item => item.id === selectedContact.value)?.name || '' : '';

        const current_meeting_type = meetingTypeList.value.find(item => item.value === selectedMeetingType.value)?.label || 'Quick Call'
        form.value.summary_title = `Meeting Summary for ${form.value.client_name} - ${current_meeting_type}`;
    }

    async function handleSelectMeetingType(value: any) {
        await handleMeetingSummary()
    }

    async function getMeetingTemp() {
        const res = await $fetch('/api/postgre/dynamic_two', {
            method: 'GET',
            query: {
                table: 'meeting_summary_temp',
                dynamic_field1: 'meeting_uuid',
                value1: meetingId || '',
                dynamic_field2: 'type',
                value2: 'summary',
                isDesc: true
            }
        })

        return res
    }

    async function createMeetingTemp(gpt_data: any = null) {
        const created_at = formatJsDateToDatetime(new Date())
        const createTemp = await handleApiResponse($fetch('/api/postgre', {
            query: { table: 'meeting_summary_temp' },
            method: 'POST',
            body: {
                meeting_uuid: meetingId,
                meeting_ai_summary: ai_summary.value,
                openid_id: gpt_data?.id,
                model: gpt_data?.model,
                input_tokens: gpt_data?.usage?.input_tokens,
                output_tokens: gpt_data?.usage?.output_tokens,
                total_tokens: gpt_data?.usage?.total_tokens,
                cached_tokens: gpt_data?.usage?.input_tokens_details?.cached_tokens,
                reasoning_tokens: gpt_data?.usage?.output_tokens_details?.reasoning_tokens,
                type: 'summary',
                created_at,
            }
        }));
        console.log("Created temp summary:", createTemp);

        return createTemp
    }

    watch (
    () => form.value.ai_summary_overview,
        async (newVal, oldVal) => {
            if (!newVal || newVal.length < 10) {
                setTimeout(async () => {
                    await handleMeetingSummary()
                }, 2000);
            }
        }
    )

    async function onFollowUp() {
        isLoadingFollowUp.value = true
        navigateTo('/for-follow-up/' + selectedContact.value)
    }
</script>

<template>
    <UDashboardPanel id="meeting-details" :ui="{ body: 'gap-2 sm:gap-2' }">
        <template #header>
            <UDashboardNavbar title="Meeting Summary Details">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UiAppButtonBack />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <UiAppLoading
                v-if="isLoading"
                class="w-full border rounded-md p-6 my-4 border-neutral-800"
            />
            <div v-if="!form.summary_overview && !isLoading" class="p-6">
                <div class="w-full border rounded-md p-6 my-4 border-neutral-800">
                    No summary overview available for this meeting.
                </div>
            </div>
            <div v-if="form.summary_overview && !isLoading" class="p-6 space-y-8">
                <UForm :state="form" :schema="schema" @submit="onSubmit" class="space-x-6 flex">
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Meeting Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-2">
                            <div class="w-full space-y-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Sender Email</label>
                                <!-- <UInput v-model="form.meeting_host_email" label="Meeting Host Email" disabled class="w-full" /> -->
                                 <USelect
                                    v-model="form.meeting_host_email"
                                    :items="[{ value: form.meeting_host_email, label: form.meeting_host_email }]"
                                    placeholder="Choose a contact"
                                    disabled
                                    class="w-full"
                                />
                            </div>
                            <div class="w-full space-y-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Contacts</label>
                                <UInput v-model="form.client_name" label="Meeting Client Name" disabled class="w-full" />
                            </div>
                            <div class="w-full space-y-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Meeting Title</label>
                                <UInput v-model="form.summary_title" label="Summary Title" disabled class="w-full" />
                            </div>
                            <div class="w-full space-y-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Meeting Overview</label>
                                <UTextarea v-model="form.summary_overview" label="Overview" disabled :rows="15" class="w-full" />
                            </div>
                        </div>
                    </UCard>

                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">AI Generated Summary Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-2">
                            <div class="w-full space-y-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Client Email:</label>
                                <USelect
                                    v-model="selectedContact"
                                    :items="contactList.map(item => ({ value: item.id, label: item.primary_email }))"
                                    placeholder="Choose a email"
                                    class="w-full"
                                    :disabled="postgreMeeting"
                                    @update:modelValue="handleSelectContact"
                                />
                            </div>
                            <div class="w-full space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Meeting Type:</label>
                                <USelect
                                    v-model="selectedMeetingType"
                                    :items="meetingTypeList"
                                    placeholder="Choose a meeting type"
                                    class="w-full"
                                    :disabled="postgreMeeting"
                                    @update:modelValue="handleSelectMeetingType"
                                />
                            </div>
                            <UiAppLoading
                                v-if="isLoadingAi"
                                class="w-full border rounded-md p-6 my-4 border-neutral-800"
                            />
                            <UTextarea :disabled="postgreMeeting" v-if="!isLoadingAi" v-model="form.ai_summary_overview" label="Overview" :rows="20" />
                            <span class="text-sm text-gray-500 italic">*Please review and edit the AI-generated summary before adding it as a note.</span>
                        </div>
                        <template #footer>
                            <div class="flex w-full justify-end gap-4">
                                <UButton v-if="!postgreMeeting" @click="onSubmit" icon="i-lucide-plus" size="lg" color="primary" variant="solid">Add AI Summary in Pipedrive Notes</UButton>
                                <UButton v-if="postgreMeeting" disabled icon="i-lucide-check" size="lg" color="info" variant="outline">Already added in Pipedrive Notes</UButton>
                                <UButton :loading="isLoadingFollowUp" @click="onFollowUp" icon="i-lucide-send" size="lg" color="info" variant="solid">Follow Up</UButton>
                            </div>
                        </template>
                    </UCard>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
