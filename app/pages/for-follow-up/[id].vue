<script setup lang="ts">
    import { is } from 'valibot'
    import { ref } from 'vue'
    import { z } from 'zod'

    const toast = useToast()
    const route = useRoute()
    const router = useRouter()
    const personId = route.params.id as string
    // console.log('Person ID:', personId)
    const isLoading = ref(true)
    const isLoadingSave = ref(false)
    const person = ref<any>({})
    const selectedOption = ref<any>(null);
    const items = ref<any[]>([]);
    const schema = z.object({
        id: z.number(),
        name: z.string(),
        org_name: z.string(),
        primary_email: z.string().email(),
        add_time: z.string(),
        owner_name: z.string().optional(),
        generated_email: z.string().optional(),
        from: z.string(),
        to: z.string(),
        subject: z.string(),
    })
    const { data }: any = await useFetch('/api/onedrive/microsoft-drive')
    // console.log('OneDrive:', data.value)
    const attachmentList = ref<any[]>([])
    const selectedAttachment = ref<any[]>([]);
    const folderList = ref<any[]>(data.value?.response || []);
    const selectedFolder = ref<any>(null);
    const calendarObject = ref<any>(null);

    const { data: _zoom }: any = await useFetch('/api/zoom/meeting_summary')
    // console.log('Zoom Meeting Summary:', _zoom.value)
    const zoomMeetingDetails = ref<any>(_zoom.value?.response?.summaries || {})
    const selectedZoomMeeting = ref<any>(zoomMeetingDetails.value[0]?.meeting_uuid || null);


    onMounted(async () => {
        const { data }: any = await useFetch('/api/calendar/all_calendar')
        // console.log('Calendar:', data.value)
        calendarObject.value = data.value?.response?.value.find((cal: any) => cal.name === 'Calendar')
        // console.log('Calendar:', calendarObject.value)

        const { response: calendarEvents }: any = await getCalendarEvents()
        // console.log('Calendar Events:', calendarEvents)

        const { response } = await getPersonDetail()
        person.value = response?.data || {}
        // console.log('Fetched data:', person.value)
        items.value = signatureList({ name: person.value?.name })
        form.value.id = person.value.id
        form.value.name = person.value.name
        form.value.org_name = person.value.org_name
        form.value.primary_email = person.value.primary_email
        form.value.add_time = person.value.add_time
        form.value.owner_name = `Contact By ${person.value?.owner_name}`
        form.value.generated_email = items.value[0]?.html || ''
        form.value.to = person.value.primary_email
        form.value.subject = items.value[0]?.subject || ''
        selectedOption.value = items.value[0]?.value || null
        selectedFolder.value = folderList.value?.find((folder: any) => folder.name === items.value[0]?.folder_name)?.id || null

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoading.value = false
        }, 1000)
    })

    const form = ref({
        id: '',
        name: '',
        org_name: '',
        primary_email: '',
        add_time: '',
        owner_name: '',
        generated_email: '',
        from: 'francis.regala@strattonstudiogames.com',
        to: '',
        subject: '',
    })

    async function onSubmit() {
        isLoadingSave.value = true
        // console.log('Submitted Data:', form.value)
        // console.log('attachmentList.value:', attachmentList.value)

        let attachments: any[] = []
        if (selectedAttachment.value.length) {
            await Promise.all(selectedAttachment.value.map(async (file_id: any) => {
                const foundFile = attachmentList.value.find((file: any) => file.id === file_id)
                // console.log('foundFile:', foundFile)
                if (foundFile) {
                    let content = foundFile.base64String
                    if (foundFile?.base64String === undefined || !foundFile?.base64String) {
                        console.log('base64String :', foundFile?.name, content)
                        const responseFiles = await fetch('/api/onedrive/base64_string', {
                            method: 'POST',
                            body: JSON.stringify({
                                file_url: foundFile?.['@microsoft.graph.downloadUrl']
                            })
                        })
                        const {response: base64String} = await responseFiles.json()
                        content = base64String
                    }
                    attachments.push({
                        content,
                        filename: foundFile.name,
                        type: "text/html",
                        encoding: "base64",
                        disposition: "attachment"
                    })
                }
            }))
        }
        // console.log('uploadedBase64Files.value:', uploadedBase64Files.value)
        if (uploadedBase64Files.value.length) {
            uploadedBase64Files.value.forEach(file => {
                attachments.push({
                    content: (file.base64 as string).replace(/^data:.*;base64,/, ''),
                    filename: file.name,
                    type: "text/html",
                    encoding: "base64",
                    disposition: "attachment"
                })
            })
            
        }
        // console.log('Attachments:', attachments)

        const response = await fetch('/api/email/send', {
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
        // console.log('Email Send Response:', res)

        if (res?.accepted?.length > 0) {
            toast.add({
                title: 'Email sent successfully',
                description: 'The email has been sent successfully.',
                color: 'success'
            })

            const new_event= await handleAddCalendarEvent()
            if (new_event) {
                toast.add({
                    title: 'Calendar event created successfully',
                    description: 'A calendar event has been created successfully.',
                    color: 'success'
                })
            }

            // setTimeout(() => {
            //     router.back()
            // }, 1000)
        } else {
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

    async function handleAddCalendarEvent() {
        const nextMeetingDate = getRandomDayFromNext7(30)
        // console.log('nextMeetingDate:', nextMeetingDate)

        const cleanDate = nextMeetingDate.replace(/(\d+)(st|nd|rd|th)/, "$1");
        const year = new Date().getFullYear();
        const fullDate = `${cleanDate} ${year}`;
        const date = new Date(fullDate);
        const formattedNextMeeting: any = date.toDateString().split("T")[0];
        // console.log('formattedNextMeeting:', formattedNextMeeting)

        const meetingDate = new Date(formattedNextMeeting); // Your meeting date
        const dayOfWeek = meetingDate.getDay();     // 0=Sun, 1=Mon, ...
        const previousSunday = new Date(meetingDate);
        previousSunday.setDate(meetingDate.getDate() - dayOfWeek);
        // Set the desired time (15:00:00)
        previousSunday.setHours(15, 0, 0, 0);
        // console.log('previousSunday:', previousSunday)
        const pad = (n: any) => String(n).padStart(2, '0');

        const formatDateStart = previousSunday.getFullYear() + '-' +
            pad(previousSunday.getMonth() + 1) + '-' +
            pad(previousSunday.getDate()) + 'T' +
            pad(previousSunday.getHours()) + ':' +
            pad(previousSunday.getMinutes());

        const formatDateEnd = previousSunday.getFullYear() + '-' +
            pad(previousSunday.getMonth() + 1) + '-' +
            pad(previousSunday.getDate()) + 'T' +
            pad(previousSunday.getHours()+1) + ':' +
            pad(previousSunday.getMinutes());
        // console.log('formatDateStart:', formatDateStart, formatDateEnd)
        const { response: sundayReminder } = await addCalendarEvent(formatDateStart, formatDateEnd)

        const _nextMeeting = new Date(formattedNextMeeting);
        let actualMeetingStartDate = _nextMeeting.getFullYear() + '-' +
            pad(_nextMeeting.getMonth() + 1) + '-' +
            pad(_nextMeeting.getDate()) + 'T09:00'
        let actualMeetingEndDate = _nextMeeting.getFullYear() + '-' +
            pad(_nextMeeting.getMonth() + 1) + '-' +
            pad(_nextMeeting.getDate()) + 'T16:00'
        const { response: actualMeetingInvite } = await addCalendarEvent(actualMeetingStartDate, actualMeetingEndDate)
        // console.log('Add Calendar Event Response:', response)

        const _date = new Date(formatDateStart);
        const formatted = new Intl.DateTimeFormat("en-US", {
            weekday: "long",   // Sunday
            year: "numeric",   // 2025
            month: "long",     // October
            day: "numeric"     // 5
        }).format(_date);

        alert(`Sending this email would also create a Reminder Calendar Appointment on ${formatted}. Next meeting date will be on ${nextMeetingDate}.`)

        return {actualMeetingInvite, sundayReminder}
    }

    async function addCalendarEvent(start_date_time: any, end_date_time: any) {
        const response = await fetch('/api/calendar/add_calendar_event', {
            method: 'POST',
            body: JSON.stringify({
                subject: form.value.subject,
                start_date_time,
                end_date_time,
            })
        })
        const res = await response.json()

        return res
    }

    async function getCalendarEvents() {
        const response = await fetch('/api/calendar/calendar_events', {
            method: 'POST',
            body: JSON.stringify({ calendarId: calendarObject.value?.id })
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
        form.value.generated_email = selected?.html || '';
        form.value.subject = selected?.subject || '';
        selectedFolder.value = folderList.value.find(item => item.name === selected?.folder_name)?.id || null;
        // console.log('handleChange selectedFolder.value:', selectedFolder.value);

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoadingSave.value = false
        }, 500);
    }

    async function handleSelectAttachment(value: any) {
        // isLoadingSave.value = true

        // const file_id = selectedAttachment.value[selectedAttachment.value?.length - 1]
        // const findIndex = attachmentList.value.findIndex((file: any) => file.id === file_id)
        // const findItem = attachmentList.value.find((file: any) => file.id === file_id)

        // if (selectedAttachment.value.length === 0 || !file_id || !findItem) {
        //     return
        // }

        // const responseFiles = await fetch('/api/onedrive/base64_string', {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         filesObj: { file_id }
        //     })
        // })
        // const {response: base64String} = await responseFiles.json()

        // attachmentList.value[findIndex].base64String = base64String

        // setTimeout(() => {
        //     isLoadingSave.value = false
        // }, 500);
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
        attachmentList.value.forEach(async(attachment: any, index: number) => {
            // console.log('attachment:', attachment)
            const responseFiles = await fetch('/api/onedrive/base64_string', {
                method: 'POST',
                body: JSON.stringify({
                    file_url: attachment?.['@microsoft.graph.downloadUrl']
                })
            })
            const {response: base64String} = await responseFiles.json()
            // console.log('Base64 String:', base64String)

            attachmentList.value[index].base64String = base64String
        })
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
                return { name: file.name, base64 }
            })
        )

        uploadedBase64Files.value = [...uploadedBase64Files.value, ...newUploadedFiles]
        console.log('Uploaded Base64 Files:', uploadedBase64Files.value)
    }

    // Trigger hidden file input
    function openFilePicker() {
        uploadedFiles.value?.click()
    }

</script>

<template>
    <UiAppLoading
        v-if="isLoading"
        class="w-full border rounded-md p-6 my-4 border-neutral-800"
    />
    <UDashboardPanel v-if="!isLoading" id="person-details" :ui="{ body: 'gap-2 sm:gap-2 h-full' }">
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
            <div class="p-6 space-y-8">
                <UForm :state="form" :schema="schema" @submit="onSubmit" class="space-x-6 flex">
                    <!-- Summary Info -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Person Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-4">
                            <USelect
                                v-model="selectedZoomMeeting"
                                multiple
                                :items="zoomMeetingDetails.map((item: any) => ({ value: item.meeting_uuid, label: item.meeting_topic }))"
                                placeholder="Choose one or more attachments"
                                class="w-full"
                            />
                            <UInput v-model="form.name" label="Person Name" />
                            <UInput v-model="form.primary_email" label="Primary Email" />
                            <UInput v-model="form.org_name" label="Organization Name" />
                            <UTextarea v-model="form.owner_name" label="Contact By" :rows="15" />
                        </div>
                    </UCard>

                    <!-- Summary Details (Array) -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Auto-Generated Email</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-2">
                            <USelect v-model="selectedOption" :items="items" @update:modelValue="handleChange" />
                            <UInput v-model="form.from" label="From" />
                            <UInput v-model="form.to" label="To" />
                            <UInput v-model="form.subject" label="Subject" />
                            <div class="w-full space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto">OneDrive Folder:</label>
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
                            <div v-if="!isLoadingSave" class="w-full space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto">OneDrive Files:</label>
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
                                <label class="block text-sm font-medium w-50 my-auto">Selected Attachments:</label>

                                <ul class="divide-y divide-gray-200 dark:divide-gray-800 border rounded p-3 
                                            bg-gray-50 dark:bg-gray-900">
                                    <li
                                    v-for="file in [...attachmentList.filter(f => selectedAttachment.includes(f.id)), ...uploadedBase64Files]"
                                    :key="file.id"
                                    class="py-2 flex items-center justify-between text-sm"
                                    >
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-files" class="size-5 text-red-400" />
                                        <span class="text-sm text-gray-700 dark:text-gray-200">{{ file.name }}</span>
                                    </div>
                                    <span class="text-gray-500 dark:text-gray-400 text-xs">
                                        <UIcon name="i-lucide-check-circle" class="size-3 text-green-600" />
                                    </span>
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
                            <div v-if="!isLoadingSave" class="mb-4 h-[360px]">
                                <ClientOnly>
                                    <QuillEditor contentType="html" v-model:content="form.generated_email"
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
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
