<script setup lang="ts">
    import { ref } from 'vue'
    import { z } from 'zod'
    import VueDatePicker from '@vuepic/vue-datepicker';
    import '@vuepic/vue-datepicker/dist/main.css'

    const colorMode = useColorMode()
    const { call } = useApi()
    const toast = useToast()
    const route = useRoute()
    const personId = route.params.id as string
    const isLoading = ref(true)
    const isLoadingSave = ref(false)
    const isLoadingMerge = ref(false)
    const person = ref<any>({})
    const selectedOption = ref<any>(null);
    const items = ref<any[]>([]);
    const schema = z.object({
        id: z.number() || z.string(),
        name: z.string(),
        org_name: z.string(),
        primary_email: z.string().email(),
        add_time: z.string(),
        owner_name: z.string().optional(),
        generated_email: z.string().optional(),
        from: z.string(),
        to: z.string(),
        subject: z.string(),
        meeting_type: z.string(),
        next_meeting_date: z.string().optional(),
        zoom_link: z.string().optional(),
    })
    const attachmentList = ref<any[]>([])
    const selectedAttachment = ref<any[]>([]);
    const { data }: any = await useFetch('/api/onedrive/microsoft-drive')
    const folderList = ref<any[]>(data.value?.response || []);
    const selectedFolder = ref<any>(null);
    const eventObject = ref<any>(null);
    const { data: _zoom }: any = await useFetch('/api/zoom/meeting_summary')
    const zoomMeetingDetails = ref<any>(_zoom.value?.response?.filter((data: any) => data.detail.summary_overview) || {})
    const selectedZoomMeeting = ref<any>(zoomMeetingDetails.value[0]?.meeting_uuid || null);
    const meetingDetail = ref<any>(null);
    const formattedNextMeeting = ref<any>('');
    const nextMeetingDate = ref<any>('');
    const isMergeZoomMeeting = ref(false);
    const postgreZoomMeetings = ref<any[]>([]);
    const quillRef = ref();

    const { data: _data } = await useFetch('/api/postgre', {
        query: { table: 'for_follow_up_templates', isDesc: true },
    });
    const itemsFollowup = ref<any[]>(_data.value?.data?.sort((a: any, b: any) => a?.label.localeCompare(b?.label)) || []);
    const selectedFollowUp = ref<any>(null);

    onMounted(async () => {
        const leaf_process = ['']
        // const { data }: any = await useFetch('/api/calendar/all_calendar')

        const { response } = await getPersonDetail()
        person.value = response?.data || {}
        items.value = signatureList({ name: person.value?.name })
        const signatureSort = items.value.reduce((map, sig, index) => {
            map[sig.folder_name] = index;
            return map;
        }, {});

        folderList.value = folderList.value.filter((folder: any) => !folder.name.includes('Attachment'))
            .slice().sort((a, b) => {
                const orderA = signatureSort[a.name] ?? Infinity; // use Infinity if not found
                const orderB = signatureSort[b.name] ?? Infinity;
                return orderA - orderB;
            });
        if (person.value?.zoom_meetings?.length) {
            selectedZoomMeeting.value = person.value?.zoom_meetings?.[0]?.meeting_uuid || selectedZoomMeeting.value
        }
        const { response: meetingResponse } = await call('/api/zoom/meeting_detail', 'POST', { meetingId: selectedZoomMeeting.value })
        meetingDetail.value = meetingResponse || {}
        const { data: zoomMeetings }: any = await fetchPostgreZoomMeetings();
        postgreZoomMeetings.value = zoomMeetings

        if (postgreZoomMeetings.value.length > 0 && postgreZoomMeetings.value[0]?.next_meeting_date) {
            formattedNextMeeting.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings.value[0]?.next_meeting_date)
            nextMeetingDate.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings.value[0]?.next_meeting_date)
        } else {
            formattedNextMeeting.value = null
            nextMeetingDate.value = null
        }
        form.value.next_meeting_date = formattedNextMeeting.value
        form.value.id = typeof person.value.id === 'number' ? person.value.id : Number(person.value.id)
        form.value.name = person.value.name
        form.value.org_name = person.value.org_name
        form.value.primary_email = person.value.primary_email
        form.value.add_time = person.value.add_time
        form.value.owner_name = `Contact By ${person.value?.owner_name}`
        if (items.value) {
            if (items.value[0]?.html?.includes('{{name}}') && person.value?.name) {
                form.value.generated_email = items.value[0]?.html.replace('{{name}}', person.value?.name) || '';
            }
            if (items.value[0]?.html?.includes('XXX') && person.value?.name) {
                form.value.generated_email = items.value[0]?.html.replace('XXX', person.value?.name) || '';
            }
        }
        form.value.to = person.value.primary_email
        form.value.subject = items.value[0]?.subject || ''
        form.value.meeting_type = items.value[0]?.subject || ''
        selectedOption.value = items.value[0]?.value || null
        selectedFolder.value = folderList.value?.find((folder: any) => folder.name === items.value[0]?.folder_name)?.id || null

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoading.value = false
        }, 1000)
    })

    const form = ref({
        id: undefined as number | undefined,
        name: '',
        org_name: '',
        primary_email: '',
        add_time: '',
        owner_name: '',
        generated_email: '',
        from: 'francis@viacry.com',
        to: '',
        subject: '',
        meeting_type: '',
        next_meeting_date: '',
        zoom_link: '',
    })

    async function onSubmit() {
        if (form.value.next_meeting_date === '' || form.value.next_meeting_date === null) {
            alert('Please select the next meeting date.')

            return
        }
        isLoadingSave.value = true

        let attachments: any[] = []
        if (selectedAttachment.value.length) {
            await Promise.all(selectedAttachment.value.map(async (file_id: any) => {
                const foundFile = attachmentList.value.find((file: any) => file.id === file_id)
                // console.log('foundFile:', foundFile)
                if (foundFile) {
                    let content = foundFile.base64String
                    if (foundFile?.base64String === undefined || !foundFile?.base64String) {
                        const responseFiles = await fetch('/api/onedrive/base64_string', {
                            method: 'POST',
                            body: JSON.stringify({
                                file_url: foundFile?.['@microsoft.graph.downloadUrl']
                            })
                        })
                        const {response: base64String} = await responseFiles.json()
                        content = base64String
                    }
                    let contentType = 'application/octet-stream'
                    if (foundFile?.file) {
                        contentType = foundFile.file.mimeType
                    }
                    // console.log('contentType:', contentType)

                    attachments.push({
                        "@odata.type": "#microsoft.graph.fileAttachment",
                        name: foundFile.name,
                        contentType,
                        contentBytes: content,
                    });
                    // attachments.push({
                    //     content,
                    //     filename: foundFile.name,
                    //     type: "text/html",
                    //     disposition: "attachment"
                    // })
                }
            }))
        }
        if (uploadedBase64Files.value.length) {
            uploadedBase64Files.value.forEach(file => {
                // console.log('uploaded file:', file)
                const cleanBase64 = (file.base64 as string).replace(/^data:.*;base64,/, '');
                attachments.push({
                    "@odata.type": "#microsoft.graph.fileAttachment",
                    name: file.name,
                    contentType: file.type,
                    contentBytes: cleanBase64
                });
                // attachments.push({
                //     content: (file.base64 as string).replace(/^data:.*;base64,/, ''),
                //     filename: file.name,
                //     type: "text/html",
                //     disposition: "attachment"
                // })
            })

        }
        // console.log('attachments:', attachments)

        try {
            // const res = await sendEmail(attachments)
            // const res = {accepted: ['asdf@example.com']}
            const res= await handleAddCalendarEvent(attachments)
            // console.log('res:', res)

            if (res) {
                if (attachments.length > 0) {
                    const attachment_promise = await Promise.all(
                        attachments.map(async (attach) => {
                            const { response } = await addAttachments(attach)
                            return response
                        })
                    )
                    // console.log('addAttachments response:', attachment_promise)
                }
                const {response: addAttendeesResponse} = await addAttendees()
                // console.log('addAttendeesResponse:', addAttendeesResponse)

                const save_response = await saveClientResponse()
                toast.add({
                    title: 'Calendar event created successfully',
                    description: 'A calendar event has been created successfully.',
                    color: 'success'
                })
            } else {
                toast.add({
                    title: 'Error',
                    description: 'There was an error sending the email. Please try again.',
                    color: 'error'
                })
            }
        } catch (error) {
            toast.add({
                title: 'Error',
                description: 'There was an error sending the email. Please try again.',
                color: 'error'
            })
        }

        setTimeout(() => {
            isLoadingSave.value = false
        }, 1000);
    }

    async function fetchPostgreZoomMeetings() {
        const res = await $fetch('/api/postgre/dynamic_field', {
            method: 'GET',
            query: {
                table: 'zoom_meetings',
                dynamic_field: 'meeting_uuid',
                value: meetingDetail.value?.meeting_uuid || ''
            }
        })

        return res
    }

    // async function getMeetingDetail(meetingId: any) {
    //     const response = await fetch('/api/zoom/meeting_detail', {
    //         method: 'POST',
    //         body: JSON.stringify({meetingId})
    //     })
    //     const res = await response.json()

    //     return res
    // }

    async function saveClientResponse() {
        const response = await $fetch('/api/postgre', {
            method: 'POST',
            query: {
                table: 'client_response'
            },
            body: {
                event_id: eventObject.value?.id || null,
                person_id: person.value?.id || null,
                meeting_id: selectedZoomMeeting.value,
                signature_id: selectedOption.value,
                next_meeting_date: form.value?.next_meeting_date || null,
                person_email: person.value?.primary_email || null,
                person_name: person.value?.name || null
            }
        })

        return response
    }

    async function sendEmail(attachments: any[]) {
        const response = await fetch('/api/email/send-outlook', {
            method: 'POST',
            body: JSON.stringify({
                emailObj: {
                    attachments,
                    from: form.value.from,
                    to: form.value.to,
                    subject: form.value.subject,
                    html: convertHtmlEmail(form.value.generated_email || ''),
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function getPreviousSunday(formattedNextMeeting: any) {
        const pad = (n: any) => String(n).padStart(2, '0');

        const meetingDate = new Date(formattedNextMeeting);
        console.log('meetingDate:', meetingDate) //Mon Sep 22 2025 00:00:00 GMT+0800 (Philippine Standard Time)
        const dayOfWeek = meetingDate.getDay();     // 0=Sun, 1=Mon, ...
        const previousSunday = new Date(meetingDate);
        previousSunday.setDate(meetingDate.getDate() - dayOfWeek);
        const startPreviousSunday = previousSunday.getFullYear() + '-' +
            pad(previousSunday.getMonth() + 1) + '-' +
            pad(previousSunday.getDate()) + 'T15:00'

        const endPreviousSunday = previousSunday.getFullYear() + '-' +
            pad(previousSunday.getMonth() + 1) + '-' +
            pad(previousSunday.getDate()) + 'T16:00'

        return { startPreviousSunday, endPreviousSunday }
    }

    async function calenderEventFormatDate(formattedNextMeeting: any) {
        const pad = (n: any) => String(n).padStart(2, '0');
        const _nextMeeting = new Date(formattedNextMeeting);
        console.log('_nextMeeting:', _nextMeeting) //Mon Sep 22 2025 09:00:00 GMT+0800 (Philippine Standard Time)
        let actualMeetingStartDate = formattedNextMeeting // 2025-09-22T09:00
        let actualMeetingEndDate = new Date(_nextMeeting.setHours(_nextMeeting.getHours() + 1));
        console.log('actualMeetingEndDate:', actualMeetingEndDate) // Mon Sep 22 2025 10:00:00 GMT+0800 (Philippine Standard Time)
        // let actualMeetingEndDate = _nextMeeting.getFullYear() + '-' +
        //     pad(_nextMeeting.getMonth() + 1) + '-' +
        //     pad(_nextMeeting.getDate()) + 'T' +
        //     String(_nextMeeting.getHours() + 1).padStart(2, '0') + ':' +
        //     pad(_nextMeeting.getMinutes()) // 2025-09-22T16:00

        return { actualMeetingStartDate, actualMeetingEndDate }
    }

    async function handleAddCalendarEvent(attachments: any[]) {
        formattedNextMeeting.value = form.value.next_meeting_date
        console.log('formattedNextMeeting:', formattedNextMeeting.value)
        const _date = new Date(form.value.next_meeting_date);
        nextMeetingDate.value = new Intl.DateTimeFormat("en-US", {
            year: "numeric",   // 2025
            month: "long",     // October
            day: "numeric"     // 5
        }).format(_date);

        const { actualMeetingStartDate, actualMeetingEndDate } = await calenderEventFormatDate(formattedNextMeeting.value); //actualMeetingStartDate: 2025-09-22T09:00 actualMeetingEndDate: 2025-09-22T16:00
        console.log('actualMeetingStartDate:', actualMeetingStartDate, 'actualMeetingEndDate:', actualMeetingEndDate);

        const { response: actualMeetingInvite } = await addCalendarEvent(actualMeetingStartDate, actualMeetingEndDate, attachments) // Outlook
        //{@odata.context: "https://graph.microsoft.com/v1.0/$metadata#users('…y%40automationpm.onmicrosoft.com')/events/$entity", @odata.etag: 'W/"MbPvhBte9Uu/e4THen7M7wAAAYXvrQ=="', id: 'AAMkADExNjcwN2FmLWY0MTQtNGEwYy1iNzJlLTY3OTRhMDIxNT…6fszvAAAAAAENAAAxs__EG171S797hMd6fszvAAABiA19AAA=', createdDateTime: '2025-09-19T03:00:00.6838407Z', lastModifiedDateTime: '2025-09-19T03:00:00.7558834Z', …}
        eventObject.value = actualMeetingInvite

        alert(`Email and Calendar Invite sent to ${form.value.to} for ${nextMeetingDate.value}.`)

        return {actualMeetingInvite}
    }

    async function addAttachments(attachment: any) {
        const response = await fetch('/api/calendar/add_attachments', {
            method: 'POST',
            body: JSON.stringify({
                eventId: eventObject.value?.id || null,
                attachment
            })
        })
        const res = await response.json()

        return res
    }

    async function addAttendees() {
        const response = await fetch('/api/calendar/add_attendees', {
            method: 'POST',
            body: JSON.stringify({
                eventId: eventObject.value?.id || null,
                attendees: [form.value.to]
            })
        })
        const res = await response.json()

        return res
    }

    async function addCalendarEvent(start_date_time: any, end_date_time: any, attachments: any[]) {
        const content = isMergeZoomMeeting.value ? plainTextToHtml(form.value.generated_email || '') : convertHtmlEmail(form.value.generated_email || '')
        const response = await fetch('/api/calendar/add_meeting_invite', {
            method: 'POST',
            body: JSON.stringify({
                subject: form.value.subject,
                start_date_time,
                end_date_time,
                // attendees: [form.value.to],
                zoom_link: form.value.zoom_link || '',
                content,
                // attachments
            })
        })
        const res = await response.json()

        return res
    }

    async function getPersonDetail() {
        const response = await fetch('/api/pipedrive/get_person', {
            method: 'POST',
            body: JSON.stringify({personId})
        })
        const res = await response.json()

        return res
    }

    async function handleChange(value: any) {
        isLoadingSave.value = true
        uploadedBase64Files.value = []
        const _items = signatureList({ name: person.value?.name })
        const selected = _items.find(item => item.value === value);
        if (selected) {
            if (selected?.html?.includes('{{name}}') && person.value?.name) {
                form.value.generated_email = selected?.html.replace('{{name}}', person.value?.name) || '';
            }
            if (selected?.html?.includes('XXX') && person.value?.name) {
                form.value.generated_email = selected?.html.replace('XXX', person.value?.name) || '';
            }
        }
        form.value.subject = selected?.subject || '';
        form.value.meeting_type = selected?.subject || '';
        selectedFolder.value = folderList.value.find(item => item.name === selected?.folder_name)?.id || null;

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoadingSave.value = false
        }, 500);
    }

    async function handleSelectAttachment(value: any) {
        console.log('Selected Attachments:', value)
    }

    async function handleSelectFolder(value: any) {
        isLoadingSave.value = true
        selectedAttachment.value = []
        attachmentList.value = []

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoadingSave.value = false
        }, 500);
    }

    async function updateAllAttachmentsToBase64String() {
        // attachmentList.value.forEach(async(attachment: any, index: number) => {
        //     const responseFiles = await fetch('/api/onedrive/base64_string', {
        //         method: 'POST',
        //         body: JSON.stringify({
        //             file_url: attachment?.['@microsoft.graph.downloadUrl']
        //         })
        //     })
        //     const {response: base64String} = await responseFiles.json()

        //     attachmentList.value[index].base64String = base64String
        // })
        const updated = await Promise.all(
            attachmentList.value.map(async (attachment) => {
            const responseFiles = await fetch('/api/onedrive/base64_string', {
                method: 'POST',
                body: JSON.stringify({
                file_url: attachment?.['@microsoft.graph.downloadUrl']
                })
            })
            const { response: base64String } = await responseFiles.json()
            return { ...attachment, base64String }
            })
        )
        attachmentList.value = updated
    }

    async function getOneDriveFiles() {
        const response = await fetch('/api/onedrive/get_files', {
            method: 'POST',
            body: JSON.stringify({folderId: selectedFolder.value})
        })
        const res = await response.json()

        return res
    }

    async function updateAttachmentList() {
        const { response: _list } = await getOneDriveFiles()
        attachmentList.value = _list?.value || []

        const _items = signatureList({ name: person.value?.name })
        const selected = _items.find(item => item.value === selectedOption.value);

        selectedAttachment.value = attachmentList.value.
            filter((item: any) => {
                const lastDotIndex = item.name.lastIndexOf('.');
                if (lastDotIndex === -1) { // No extension found
                    return item.name;
                }
                return selected?.attachment_files?.includes(item.name.substring(0, lastDotIndex));
            }).map((item: any) => item.id);
    }

    const uploadedFiles = ref<any>(null)
    const uploadedBase64Files = ref<any[]>([])
    const handleUploadedFiles = async (event: Event) => {
        const files = Array.from((event.target as HTMLInputElement).files || [])
        const newUploadedFiles = await Promise.all(
            files.map(async (file: any) => {
                const base64 = await toBase64(file)
                return { name: file.name, type: file.type, base64 }
            })
        )

        uploadedBase64Files.value = [...uploadedBase64Files.value, ...newUploadedFiles]
    }

    function openFilePicker() {
        uploadedFiles.value?.click()
    }

    async function handleForFollowUp() {
        isMergeZoomMeeting.value = false
        const _items = itemsFollowup.value
        const selected = _items.find(item => item.value === selectedFollowUp.value);
        form.value.generated_email = selected?.html
        if (selected?.html?.includes('{{name}}') && person.value?.name) {
            form.value.generated_email = selected?.html.replace('{{name}}', person.value?.name) || '';
        }
        if (selected?.html?.includes('XXX') && person.value?.name) {
            form.value.generated_email = selected?.html.replace('XXX', person.value?.name) || '';
        }
    }

    async function removeAttachment(file: any) {
        console.log('Remove Attachment:', file)
        const idx = attachmentList.value.findIndex(f => f.id === file?.id)
        console.log('idx:', idx)
        if (idx !== -1) {
            attachmentList.value.splice(idx, 1)
            // 🔑 remove id from selectedAttachment
            const selIdx = selectedAttachment.value.indexOf(file.id)
            console.log('selIdx:', selIdx)
            if (selIdx !== -1) selectedAttachment.value.splice(selIdx, 1)
            return
        }

        const idx2 = uploadedBase64Files.value.findIndex((f: any) => f.name === file.name)
        console.log('idx2:', idx2)
        if (idx2 !== -1) {
            uploadedBase64Files.value.splice(idx2, 1)
        }
    }

    async function handleChangeZoomMeeting() {
        const { response: meetingResponse } = await call('/api/zoom/meeting_detail', 'POST', { meetingId: selectedZoomMeeting.value })
        meetingDetail.value = meetingResponse || {}
        const { data: _postgreZoomMeetings }: any = await fetchPostgreZoomMeetings();

        if (_postgreZoomMeetings.length > 0 && _postgreZoomMeetings[0]?.next_meeting_date) {
            formattedNextMeeting.value = covertToYYYYMMDDTHHMM(_postgreZoomMeetings[0]?.next_meeting_date)
            nextMeetingDate.value = covertToYYYYMMDDTHHMM(_postgreZoomMeetings[0]?.next_meeting_date)
        } else {
            formattedNextMeeting.value = null
            nextMeetingDate.value = null
        }
        form.value.next_meeting_date = formattedNextMeeting.value
    }

    async function mergeMeetingSummary(summary_overview: any, email_draft: any) {
        const response = await fetch('/api/openai/meeting_merge_gpt', {
            method: 'POST',
            body: JSON.stringify({
                filterObj: {
                    summary_overview,
                    email_draft
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function handleMergeZoomMeeting() {
        if (isMergeZoomMeeting.value) {
            isLoadingMerge.value = true
            const { data: _postgreZoomMeetings }: any = await fetchPostgreZoomMeetings();

            if (_postgreZoomMeetings.length === 0) {
                isMergeZoomMeeting.value = false
                isLoadingMerge.value = false
                alert('No meeting summary found for this Zoom meeting.')

                return
            }

            const editor = quillRef.value?.getQuill()
            const email_draft = editor.getText() // Get plain text
            const { response: generated_signature } = await mergeMeetingSummary(_postgreZoomMeetings[0]?.meeting_ai_summary, email_draft)
            // console.log('generated_signature:', generated_signature)
            form.value.generated_email = generated_signature || ''

            isLoadingMerge.value = false
        } else {
            if (selectedFollowUp.value) {
                await handleForFollowUp()
            } else {
                const _items = signatureList({ name: person.value?.name })
                const selected = _items.find(item => item.value === selectedOption.value);
                if (selected) {
                    if (selected?.html?.includes('{{name}}') && person.value?.name) {
                        form.value.generated_email = selected?.html.replace('{{name}}', person.value?.name) || '';
                    }
                    if (selected?.html?.includes('XXX') && person.value?.name) {
                        form.value.generated_email = selected?.html.replace('XXX', person.value?.name) || '';
                    }
                }
            }
        }
    }

</script>

<template>
    <UDashboardPanel  id="person-details" :ui="{ body: 'gap-2 sm:gap-2 h-full' }">
        <template #header>
            <UDashboardNavbar title="Person Details">
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
            <div v-if="!isLoading" class="p-6 space-y-8">
                <UForm :state="form" :schema="schema" @submit="onSubmit" class="space-x-2 grid grid-cols-1 md:grid-cols-2">
                    <div class="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                            <UCard class="w-full">
                                <template #header>
                                    <h2 class="text-lg font-semibold">Meeting Details</h2>
                                </template>
                                <div class="grid grid-cols-1 gap-1">
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Zoom Meeting:</label>
                                        <USelect
                                            v-model="selectedZoomMeeting"
                                            :items="zoomMeetingDetails.map((item: any) => ({ value: item.meeting_uuid, label: item?.detail?.summary_overview || item.meeting_topic }))"
                                            placeholder="Choose one or more attachments"
                                            class="w-full"
                                            @change="handleChangeZoomMeeting"
                                        />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Meeting List:</label>
                                        <USelect v-model="selectedOption" class="w-full" :items="items" @update:modelValue="handleChange" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Meeting Type:</label>
                                        <UInput v-model="form.meeting_type" label="Meeting Type" class="w-full" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Sender:</label>
                                        <UInput v-model="form.from" label="From" class="w-full" disabled />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Receiver:</label>
                                        <UInput v-model="form.to" label="To" class="w-full" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Next Meeting Date:</label>
                                        <!-- <UInput v-model="form.next_meeting_date" type="datetime-local" label="Next Meeting Date" class="w-full"/> -->
                                        <VueDatePicker v-model="form.next_meeting_date" :dark="colorMode.value === 'dark'" :is24="false" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Zoom Link:</label>
                                        <UInput v-model="form.zoom_link" label="Zoom Link" class="w-full" />
                                    </div>
                                </div>
                            </UCard>

                            <UCard class="w-full mt-6">
                                <template #header>
                                    <h2 class="text-lg font-semibold text-neutral-500">Client Details (view-only)</h2>
                                </template>
                                <div class="grid grid-cols-1 gap-1">
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Name:</label>
                                        <UInput v-model="form.name" label="Person Name" disabled class="w-full"/>
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Email:</label>
                                        <UInput v-model="form.primary_email" label="Primary Email" disabled class="w-full"/>
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Organization:</label>
                                        <UInput v-model="form.org_name" label="Organization Name" disabled class="w-full"/>
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Contact By:</label>
                                        <UInput v-model="form.owner_name" label="Contact By" disabled class="w-full"/>
                                    </div>
                                </div>
                            </UCard>
                        </div>

                        <UCard class="col-span-2 w-full">
                            <template #header>
                                <h2 class="text-lg font-semibold">Auto-Generated Email</h2>
                            </template>
                            <div class="w-full space-y-1 mb-1">
                                <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Subject:</label>
                                <UInput v-model="form.subject" label="Subject" class="w-full"/>
                            </div>
                            <div class="grid grid-cols-1 gap-1">
                                <div class="w-full space-y-1">
                                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">OneDrive Folder:</label>
                                    <USelect
                                        v-model="selectedFolder"
                                        :items="folderList.map(item => ({ value: item.id, label: item.name }))"
                                        placeholder="Choose folder"
                                        class="w-full"
                                        @update:modelValue="handleSelectFolder"
                                    />
                                </div>
                                <UiAppLoading
                                    v-if="isLoadingSave"
                                    class="w-full border rounded-md p-6 my-4 border-neutral-800"
                                />
                                <div v-if="!isLoadingSave" class="w-full space-y-1">
                                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">OneDrive Files:</label>
                                    <USelect
                                        v-model="selectedAttachment"
                                        multiple
                                        :items="attachmentList.map(item => ({ value: item.id, label: item.name }))"
                                        placeholder="Choose one or more attachments"
                                        class="w-full"
                                        @update:modelValue="handleSelectAttachment"
                                    />
                                </div>
                                <!-- Selected Files Layout -->
                                <div v-if="(selectedAttachment.length || uploadedBase64Files.length) && !isLoadingSave" class="space-y-2">
                                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Selected Attachments:</label>

                                    <ul class="divide-y divide-gray-200 dark:divide-gray-800 border rounded p-3
                                                bg-gray-50 dark:bg-gray-900">
                                        <li v-for="file in [...attachmentList.filter(f => selectedAttachment.includes(f.id)), ...uploadedBase64Files]" :key="file.id" class="py-2 flex items-center justify-between text-sm">
                                            <div class="flex items-center gap-2">
                                                <UIcon name="i-lucide-files" class="size-5 text-red-400" />
                                                <span class="text-sm text-gray-700 dark:text-gray-200">{{ file.name }}</span>
                                            </div>
                                            <span class="text-gray-500 dark:text-gray-400 text-xs">
                                                <UIcon name="i-lucide-check-circle" class="size-3 text-green-600" />
                                            </span>
                                            <!-- <UButton
                                                icon="i-heroicons-x-mark"
                                                size="xs"
                                                color="neutral"
                                                variant="ghost"
                                                class="ml-1"
                                                @click="removeAttachment(file)"
                                            /> -->
                                        </li>
                                    </ul>
                                </div>
                                <div v-if="!isLoadingSave" class="border rounded-md p-4 flex">
                                    <input
                                        ref="uploadedFiles"
                                        type="file"
                                        class="w-full text-gray-500"
                                        multiple
                                        @change="handleUploadedFiles"
                                    />
                                    <UButton class="float-right" color="neutral" @click="openFilePicker">
                                        Upload More Files
                                    </UButton>
                                    <UButton v-if="uploadedBase64Files.length" class="float-right ml-2 text-white" color="error" @click="uploadedBase64Files = []">
                                        Clear
                                    </UButton>
                                </div>
                                <div v-if="!isLoadingSave" class="w-full space-y-1">
                                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Select Signature:</label>
                                    <USelect v-model="selectedFollowUp" class="w-full" :items="itemsFollowup" @update:modelValue="handleForFollowUp" placeholder="For Follow Up Signatures"/>
                                </div>
                                <div v-if="!isLoadingSave" class="w-full space-y-1">
                                    <USwitch 
                                        v-model="isMergeZoomMeeting"
                                        name="myCheckbox"
                                        label="AI will merge Zoom Meeting Summary"
                                        description="AI can make mistakes. Check email content before sending."
                                        @update:modelValue="handleMergeZoomMeeting"
                                        :ui="{
                                            label: 'text-neutral-500 font-medium text-sm',
                                            wrapper: 'gap-2',
                                            description: 'text-xs text-neutral-500 italic leading-snug'
                                        }"
                                    />
                                    <div v-if="isLoadingMerge" class="w-full border rounded-md p-4 my-2 border-neutral-800">
                                        <div class="grid text-center gap-3 text-sm">
                                            <p>Merging and generating email. Please wait...</p>
                                            <UProgress />
                                        </div>
                                    </div>
                                </div>
                                <div v-if="!isLoadingSave" class="mb-4 h-[360px]">
                                    <ClientOnly>
                                        <QuillEditor ref="quillRef" contentType="html" v-model:content="form.generated_email"
                                            theme="snow" placeholder="Write your message here..." />
                                    </ClientOnly>
                                    <span class="text-sm text-gray-500 italic">*Please review the email content before sending. No options to undo once sent.</span>
                                </div>
                            </div>

                            <template #footer>
                                <div class="flex w-full justify-end">
                                    <UButton @click="onSubmit" :disabled="isLoadingSave" :loading="isLoadingSave" icon="i-lucide-send" size="lg" color="primary" variant="solid">Send Email</UButton>
                                </div>
                            </template>
                        </UCard>
                    </div>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>

<style scoped>
    .dp__theme_dark {
        --dp-background-color: #18181B;
        --dp-font-size: 0.85rem !important; /* ≈14px */
        line-height: 1.25rem; /* ≈16px */
        border-radius: 0.375rem; /* 6px */
        border-width: 1px;
        border-style: solid;
        border-color: #3f3f47;
    }

    .dp__theme_light {
        --dp-background-color: #FFFFFF;
        --dp-font-size: 0.85rem !important; /* ≈14px */
        line-height: 1.25rem; /* ≈16px */
        border-radius: 0.375rem; /* 6px */
        border-width: 1px;
        border-style: solid;
        border-color: #ddd;
    }

    :deep(.dp__theme_dark .dp--menu-wrapper),
    :deep(.dp__theme_light .dp--menu-wrapper) {
        position: sticky !important;
        top: 0;      /* distance from top of the scrolling container */
        z-index: 50; /* keep above content */
    }

    :deep(.dp__theme_dark .dp--tp-wrap),
    :deep(.dp__theme_light .dp--tp-wrap) {
        max-width: 100% !important;
    }
</style>
