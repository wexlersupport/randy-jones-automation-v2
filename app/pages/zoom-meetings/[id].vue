<script setup lang="ts">
    const toast = useToast()
    const route = useRoute()
    const router = useRouter()
    const meetingId = route.params.id as string
    console.log('Meeting ID:', meetingId)
    const isLoading = ref(true)

    import { ref } from 'vue'
    import { z } from 'zod'

    /**
     * Zod schema (optional but good practice)
     * Useful for validation if needed.
     */
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
        summary_details: z.array(z.object({
            label: z.string(),
            summary: z.string()
        })),
        next_steps: z.array(z.string()),
        summary_content: z.string(),
        ai_summary_overview: z.string().optional()
    })

    onMounted(async () => {
        const { response } = await getMeetingDetail()
        console.log('Fetched data:', response)
        const nextMeetingDate = getRandomDayFromNext7()
        form.value.meeting_host_email = response.meeting_host_email;
        form.value.summary_title = response.summary_title;
        form.value.summary_overview = response.summary_overview + ` Next meeting date is ${nextMeetingDate}`;

        const { response: summary_overview } = await generateSummary()
        console.log('Generated Summary:', summary_overview)

        const today = new Date();
        const formatted = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        const { response: next_meeting } = await getNextMeeting(nextMeetingDate)
        console.log('Next Meeting:', next_meeting)
        let meeting_end_time: any = new Date(response.meeting_end_time);
        meeting_end_time = meeting_end_time.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
        let add_note_date = `${formatted} - Did QC Meeting last ${meeting_end_time} \n`
        add_note_date += `${formatted} - Set IM & ASM - ${next_meeting.choices[0].message.content} \n`;
        add_note_date += `************************************************************* \n\n`
        form.value.ai_summary_overview = add_note_date + summary_overview.choices[0].message.content;

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
        ai_summary_overview: ''
    })

    async function onSubmit() {
        console.log('Submitted Data:', form.value)

        const { response } = await addNote()
        console.log('Fetched data:', response)

        toast.add({
            title: 'Note added successfully',
            description: 'AI-generated summary has been added successfully.',
            color: 'success'
        })

        setTimeout(() => {
            router.back()
        }, 1000)
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
        const response = await fetch('/api/openrouterai/meeting_summary', {
            method: 'POST',
            body: JSON.stringify({
                filterObj: {
                    summary_overview: form.value.summary_overview,
                    next_steps: form.value.next_steps
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function getNextMeeting(nextMeetingDate: string) {
        
        const response = await fetch('/api/openrouterai/next_meeting', {
            method: 'POST',
            body: JSON.stringify({
                filterObj: {
                    summary_overview: form.value.summary_overview + ' Next meeting date is ' + nextMeetingDate
                }
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
                person_id: 1,
                org_id: 1
            })
        })
        const res = await response.json()

        return res
    }
</script>

<template>
    <UiAppLoading
        v-if="isLoading"
        class="w-full border rounded-md p-6 my-4 border-neutral-800"
    />
    <UDashboardPanel v-if="!isLoading" id="meeting-details" :ui="{ body: 'gap-2 sm:gap-2' }">
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
            <div v-if="!form.summary_overview" class="p-6">
                <div class="w-full border rounded-md p-6 my-4 border-neutral-800">
                    No summary overview available for this meeting.
                </div>                
            </div>
            <div v-else class="p-6 space-y-8">
                <UForm :state="form" :schema="schema" @submit="onSubmit" class="space-x-6 flex">
                    <!-- Summary Info -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Meeting Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-4">
                            <UInput v-model="form.meeting_host_email" label="Meeting Host Email" />
                            <UInput v-model="form.summary_title" label="Summary Title" />
                            <UTextarea v-model="form.summary_overview" label="Overview" :rows="15" />
                        </div>
                    </UCard>

                    <!-- Summary Details (Array) -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">AI Generated Summary Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-4">
                            <UTextarea v-model="form.ai_summary_overview" label="Overview" :rows="20" />
                            <span class="text-sm text-gray-500 italic">*Please review and edit the AI-generated summary before adding it as a note.</span>
                        </div>
                        <template #footer>
                            <div class="flex w-full justify-end">
                                <UButton @click="onSubmit" icon="i-lucide-plus" size="lg" color="primary" variant="solid">Add AI Summary as Pipedrive Notes</UButton>
                            </div>
                        </template>
                    </UCard>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
