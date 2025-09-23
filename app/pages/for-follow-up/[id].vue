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
        meeting_type: z.string(),
        next_meeting_date: z.string().optional(),
        zoom_link: z.string().optional(),
    })
    const { data }: any = await useFetch('/api/onedrive/microsoft-drive')
    // console.log('OneDrive:', data.value)
    const attachmentList = ref<any[]>([])
    const selectedAttachment = ref<any[]>([]);
    const folderList = ref<any[]>(data.value?.response || []);
    const selectedFolder = ref<any>(null);
    const calendarObject = ref<any>(null);
    const eventObject = ref<any>(null);

    const { data: _zoom }: any = await useFetch('/api/zoom/meeting_summary')
    console.log('Zoom Meeting Summary:', _zoom.value)
    const zoomMeetingDetails = ref<any>(_zoom.value?.response || {})
    const selectedZoomMeeting = ref<any>(zoomMeetingDetails.value[0]?.meeting_uuid || null);
    const meetingDetail = ref<any>(null);
    // console.log('selectedZoomMeeting:', selectedZoomMeeting.value)
    const formattedNextMeeting = ref<any>('');
    const nextMeetingDate = ref<any>('');

    const { data: _data, refresh: refreshSignatures } = await useFetch('/api/postgre', {
        query: { table: 'for_follow_up_templates', isDesc: true },
    });
    
    // Function to reorder signatures
    function reorderSignatures(signatures: any[]) {
        const appointmentSignatures = signatures.filter((sig: any) => 
            sig.label && sig.label.toLowerCase().includes('appointment')
        );
        const otherSignatures = signatures.filter((sig: any) => 
            !sig.label || !sig.label.toLowerCase().includes('appointment')
        );
        return [...appointmentSignatures, ...otherSignatures];
    }
    
    // Initial load with reordering
    const allSignatures = _data.value?.data || [];
    const itemsFollowup = ref<any[]>(reorderSignatures(allSignatures));
    const selectedFollowUp = ref<any>(null);
    
    // Function to refresh signatures list
    async function refreshSignaturesList() {
        await refreshSignatures();
        const updatedSignatures = _data.value?.data || [];
        itemsFollowup.value = reorderSignatures(updatedSignatures);
    }
    
    // Watch for changes in signature data
    watch(_data, (newData) => {
        if (newData?.data) {
            itemsFollowup.value = reorderSignatures(newData.data);
        }
    }, { deep: true });

    // const { data: customers } = await useFetch('/api/postgre', {
    //     query: { table: 'customers' }
    // });
    // console.log('PostgreSQL Customers:', customers.value);

    onMounted(async () => {
        const { data }: any = await useFetch('/api/calendar/all_calendar')
        // console.log('Calendar:', data.value)
        calendarObject.value = data.value?.response?.value.find((cal: any) => cal.name === 'Calendar')
        // console.log('Calendar:', calendarObject.value)

        // let res_next_meeting = await getNextMeetingDate();
        // console.log('res_next_meeting1:', res_next_meeting) // Mon Sep 22 2025
        // if (!res_next_meeting) {
        //     res_next_meeting = await getNextMeetingDate();
        // }
        // formattedNextMeeting.value = res_next_meeting.formattedNextMeeting
        // nextMeetingDate.value = res_next_meeting.nextMeetingDate
        // console.log('res_next_meeting2:', res_next_meeting) // Mon Sep 22 2025

        // if (!formattedNextMeeting.value) {
        //     const today = new Date();
        //     today.setDate(today.getDate() + 7);
        //     const next_meeting_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0') + 'T15:00';
        //     form.value.next_meeting_date = next_meeting_date;
        // } else {
        //     const today = new Date(formattedNextMeeting.value);
        //     console.log('today:', today)
        //     const next_date = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        //     let next_time = String(today.getHours()).padStart(2, '0') + ':' + String(today.getMinutes()).padStart(2, '0');
        //     if (next_time === '00:00') {
        //         const _today = new Date();
        //         next_time = String(_today.getHours()).padStart(2, '0') + ':' + String(_today.getMinutes()).padStart(2, '0');
        //     }
        //     console.log('next_date:', next_date, next_time)
        //     form.value.next_meeting_date = next_date + 'T' + next_time;
        // }

        const { response } = await getPersonDetail()
        person.value = response?.data || {}
        console.log('person data:', person.value)
        if (person.value?.zoom_meetings?.length) {
            selectedZoomMeeting.value = person.value?.zoom_meetings?.[0]?.meeting_uuid || selectedZoomMeeting.value
        }

        const { response: meetingResponse } = await getMeetingDetail(selectedZoomMeeting.value)
        meetingDetail.value = meetingResponse || {}
        console.log('meetingDetail data:', meetingDetail.value)

        const { data: postgreZoomMeetings }: any = await fetchPostgreZoomMeetings();
        console.log('Postgre Zoom Meetings:', postgreZoomMeetings)

        if (postgreZoomMeetings.length > 0 && postgreZoomMeetings[0]?.next_meeting_date) {
            formattedNextMeeting.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings[0]?.next_meeting_date)
            nextMeetingDate.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings[0]?.next_meeting_date)
        } else {
            formattedNextMeeting.value = null
            nextMeetingDate.value = null
        }
        console.log('formattedNextMeeting.value:', formattedNextMeeting.value)
        console.log('nextMeetingDate.value:', nextMeetingDate.value)
        form.value.next_meeting_date = formattedNextMeeting.value

        items.value = signatureList({ name: person.value?.name })
        // itemsFollowup.value = forFollowUp({ name: person.value?.name })
        form.value.id = person.value.id
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
        // form.value.generated_email = items.value[0]?.html || ''
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
        id: '',
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
        console.log('Submitted Data:', form.value)
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
                    disposition: "attachment"
                })
            })
            
        }
        // console.log('Attachments:', attachments)

        try {
            const res = await sendEmail(attachments)
            // const res = {accepted: ['asdf@example.com']}
            console.log('Email Send Response:', res)

            if (res) {
                toast.add({
                    title: 'Email sent successfully',
                    description: 'The email has been sent successfully.',
                    color: 'success'
                })

                const new_event= await handleAddCalendarEvent()
                const save_response = await saveClientResponse()
                console.log('save_response:', save_response)

                if (new_event) {
                    toast.add({
                        title: 'Calendar event created successfully',
                        description: 'A calendar event has been created successfully.',
                        color: 'success'
                    })
                }
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
                // dynamic_field1: 'person_id',
                // value1: personId,
                dynamic_field: 'meeting_uuid',
                value: meetingDetail.value?.meeting_uuid || ''
            }
        })

        return res
    }

    async function getMeetingDetail(meetingId: any) {
        const response = await fetch('/api/zoom/meeting_detail', {
            method: 'POST',
            body: JSON.stringify({meetingId})
        })
        const res = await response.json()

        return res
    }

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

    async function sendingMeetingInvites(actualMeetingStartDate: any) {
        const send_meeting_date = actualMeetingStartDate.split("T")[0];
        const send_meeting_time = actualMeetingStartDate.split("T")[1];
        const [hours, minutes] = send_meeting_time.split(":").map(Number);
        const pad = (n: any) => String(n).padStart(2, '0');
        const send_meeting_time_end = pad(hours + 1) + ':' + pad(minutes);
        console.log('send_meeting_date:', send_meeting_date, send_meeting_time_end)
        const dtStart = convertDateStamp(send_meeting_date, send_meeting_time)
        const dtEnd = convertDateStamp(send_meeting_date, send_meeting_time_end)
        console.log('dtStart dtEnd:', dtStart, dtEnd) //20250922T070000Z 20250922T080000Z

        const response = await fetch('/api/email/meeting-invites', {
            method: 'POST',
            body: JSON.stringify({
                emailObj: {
                    dt_start: dtStart,
                    dt_end: dtEnd,
                    from: form.value.from,
                    to: form.value.to,
                    subject: form.value.subject,
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function sendingMeetingReminders(actualMeetingStartDate: any, next_meeting_date: any) {
        const send_meeting_date = actualMeetingStartDate.split("T")[0];
        console.log('send_reminders_date:', send_meeting_date) // 2025-09-22
        const dtStart = convertDateStamp(send_meeting_date, '15:00')
        const dtEnd = convertDateStamp(send_meeting_date, '16:00')
        console.log('sendingMeetingReminders dtStart dtEnd:', dtStart, dtEnd) //20250922T070000Z 20250922T080000Z

        const response = await fetch('/api/email/meeting-reminders', {
            method: 'POST',
            body: JSON.stringify({
                emailObj: {
                    dt_start: dtStart,
                    dt_end: dtEnd,
                    from: form.value.from,
                    to: form.value.to,
                    subject: 'Meeting Reminders',
                    next_meeting_date
                }
            })
        })
        const res = await response.json()

        return res
    }

    async function sendEmail(attachments: any[]) {
        // This function is now integrated into onSubmit
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

        return res
    }

    async function getNextMeetingDate() {
        const nextMeetingDate = getRandomDayFromNext7(30)
        console.log('nextMeetingDate:', nextMeetingDate) //September 22nd

        const cleanDate = nextMeetingDate.replace(/(\d+)(st|nd|rd|th)/, "$1");
        const year = new Date().getFullYear();
        const fullDate = `${cleanDate} ${year}`;
        const date = new Date(fullDate);
        const formattedNextMeeting: any = date.toDateString().split("T")[0];
        console.log('formattedNextMeeting:', formattedNextMeeting)

        return { nextMeetingDate, formattedNextMeeting }
    }

    async function getPreviousSunday(formattedNextMeeting: any) {
        const pad = (n: any) => String(n).padStart(2, '0');
        
        const meetingDate = new Date(formattedNextMeeting);
        console.log('meetingDate:', meetingDate) //Mon Sep 22 2025 00:00:00 GMT+0800 (Philippine Standard Time)
        const dayOfWeek = meetingDate.getDay();     // 0=Sun, 1=Mon, ...
        const previousSunday = new Date(meetingDate);
        previousSunday.setDate(meetingDate.getDate() - dayOfWeek);
        // Set the desired time (15:00:00)
        // previousSunday.setHours(15, 0, 0, 0);
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
        // let actualMeetingStartDate = _nextMeeting.getFullYear() + '-' +
        //     pad(_nextMeeting.getMonth() + 1) + '-' +
        //     pad(_nextMeeting.getDate()) + 'T09:00'
        let actualMeetingStartDate = formattedNextMeeting
        let actualMeetingEndDate = _nextMeeting.getFullYear() + '-' +
            pad(_nextMeeting.getMonth() + 1) + '-' +
            pad(_nextMeeting.getDate()) + 'T' + String(_nextMeeting.getHours() + 1).padStart(2, '0') + ':' + pad(_nextMeeting.getMinutes())
        console.log('actualMeetingStartDate:', actualMeetingStartDate, 'actualMeetingEndDate:', actualMeetingEndDate) //actualMeetingStartDate: 2025-09-22T09:00 actualMeetingEndDate: 2025-09-22T16:00

        return { actualMeetingStartDate, actualMeetingEndDate }
    }

    async function handleAddCalendarEvent() {
        // const { nextMeetingDate, formattedNextMeeting } = await getNextMeetingDate();
        // console.log('formattedNextMeeting:', formattedNextMeeting) //Mon Sep 22 2025
        formattedNextMeeting.value = form.value.next_meeting_date
        console.log('formattedNextMeeting.value:', formattedNextMeeting.value)

        const _date = new Date(form.value.next_meeting_date);
        nextMeetingDate.value = new Intl.DateTimeFormat("en-US", {
            year: "numeric",   // 2025
            month: "long",     // October
            day: "numeric"     // 5
        }).format(_date);
        console.log('nextMeetingDate.value:', nextMeetingDate.value)

        const { startPreviousSunday, endPreviousSunday } = await getPreviousSunday(formattedNextMeeting.value);
        // console.log('startPreviousSunday:', startPreviousSunday, 'endPreviousSunday:', endPreviousSunday) //startPreviousSunday: 2025-09-21T15:00 endPreviousSunday: 2025-09-21T16:00
        // const { response: sundayReminder } = await addCalendarEvent(startPreviousSunday, endPreviousSunday)

        const { actualMeetingStartDate, actualMeetingEndDate } = await calenderEventFormatDate(formattedNextMeeting.value);
        console.log('actualMeetingStartDate:', actualMeetingStartDate, 'actualMeetingEndDate:', actualMeetingEndDate) //actualMeetingStartDate: 2025-09-22T09:00 actualMeetingEndDate: 2025-09-22T16:00
        
        // const res_send_reminders = await sendingMeetingReminders(startPreviousSunday, nextMeetingDate.value) // Google
        // console.log('Meeting Reminder:', res_send_reminders)

        const { response: actualMeetingInvite } = await addCalendarEvent(actualMeetingStartDate, actualMeetingEndDate) // Outlook
        console.log('actualMeetingInvite:', actualMeetingInvite) //{@odata.context: "https://graph.microsoft.com/v1.0/$metadata#users('…y%40automationpm.onmicrosoft.com')/events/$entity", @odata.etag: 'W/"MbPvhBte9Uu/e4THen7M7wAAAYXvrQ=="', id: 'AAMkADExNjcwN2FmLWY0MTQtNGEwYy1iNzJlLTY3OTRhMDIxNT…6fszvAAAAAAENAAAxs__EG171S797hMd6fszvAAABiA19AAA=', createdDateTime: '2025-09-19T03:00:00.6838407Z', lastModifiedDateTime: '2025-09-19T03:00:00.7558834Z', …}
        eventObject.value = actualMeetingInvite

        // const sunday_reminder_calendar = await setSundayReminderCalendar(startPreviousSunday)
        // console.log('sunday_reminder_calendar:', sunday_reminder_calendar) //Sunday, September 21, 2025

        // const res_send_invites = await sendingMeetingInvites(actualMeetingStartDate) //Client Invites
        // console.log('Meeting Invite:', res_send_invites)

        alert(`Email and Calendar Invite sent to ${form.value.to} for ${nextMeetingDate.value}.`)

        return {actualMeetingInvite}
    }

    async function setSundayReminderCalendar(startPreviousSunday: any) {
        const _date = new Date(startPreviousSunday);
        const sunday_reminder_calendar = new Intl.DateTimeFormat("en-US", {
            weekday: "long",   // Sunday
            year: "numeric",   // 2025
            month: "long",     // October
            day: "numeric"     // 5
        }).format(_date);

        return sunday_reminder_calendar
    }

    async function addCalendarEvent(start_date_time: any, end_date_time: any) {
        const response = await fetch('/api/calendar/add_meeting_invite', {
            method: 'POST',
            body: JSON.stringify({
                subject: form.value.subject,
                start_date_time,
                end_date_time,
                attendees: [form.value.to],
                zoom_link: form.value.zoom_link || '',
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
        // form.value.generated_email = selected?.html || '';
        form.value.subject = selected?.subject || '';
        form.value.meeting_type = selected?.subject || '';
        selectedFolder.value = folderList.value.find(item => item.name === selected?.folder_name)?.id || null;
        // console.log('handleChange selectedFolder.value:', selectedFolder.value);

        await updateAttachmentList()
        await updateAllAttachmentsToBase64String()

        setTimeout(() => {
            isLoadingSave.value = false
        }, 500);
    }

    async function handleSelectAttachment(value: any) {
        // console.log('Selected Attachments:', value)
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
            // const { data } = await compressFiles(attachment)
            // console.log('Compressed data:', data)

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

    async function compressFiles(attachment: any) {
        const response = await fetch('/api/convertapi/compress', {
            method: 'POST',
            body: JSON.stringify({
                file_url: attachment?.['@microsoft.graph.downloadUrl'],
                file_name: attachment?.name
            })
        })
        const res = await response.json()

        return res
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
        // console.log('Uploaded Base64 Files:', uploadedBase64Files.value)
    }

    // Trigger hidden file input
    function openFilePicker() {
        uploadedFiles.value?.click()
    }

    async function handleForFollowUp() {
        console.log('Selected For Follow Up:', selectedFollowUp.value)

        const _items = itemsFollowup.value
        const selected = _items.find(item => item.value === selectedFollowUp.value);
        console.log('selected:', selected)
        
        if (selected?.html) {
            let signatureHtml = selected.html;
            
            // Replace placeholders with actual values
            if (signatureHtml.includes('{{name}}') && person.value?.name) {
                signatureHtml = signatureHtml.replace(/\{\{name\}\}/g, person.value.name);
            }
            if (signatureHtml.includes('XXX') && person.value?.name) {
                signatureHtml = signatureHtml.replace(/XXX/g, person.value.name);
            }
            
            // Ensure proper formatting and white spacing
            // Add proper line breaks and spacing if not already present
            if (!signatureHtml.startsWith('<p>') && !signatureHtml.startsWith('<div>')) {
                signatureHtml = `<p>${signatureHtml}</p>`;
            }
            
            // Add spacing before and after the signature content
            const currentContent = form.value.generated_email || '';
            if (currentContent && !currentContent.endsWith('<br>') && !currentContent.endsWith('</p>')) {
                form.value.generated_email = currentContent + '<br><br>' + signatureHtml;
            } else {
                form.value.generated_email = signatureHtml;
            }
            
            // Update subject and folder selection if available
            if (selected.subject) {
                form.value.subject = selected.subject;
            }
            if (selected.folder_name) {
                const matchingFolder = folderList.value?.find((folder: any) => folder.name === selected.folder_name);
                if (matchingFolder) {
                    selectedFolder.value = matchingFolder.id;
                    await updateAttachmentList();
                    await updateAllAttachmentsToBase64String();
                }
            }
        }
    }

    async function removeAttachment(file: any) {
        console.log('Remove Attachment:', file)
        const findIndex = attachmentList.value.findIndex(f => f.id === file?.id)
        console.log('findIndex Attachment:', findIndex)
        if (findIndex !== -1) {
            attachmentList.value.splice(findIndex, 1)
        } else {
            const findIndex2 = uploadedBase64Files.value.findIndex((f: any) => f.name === file.name)
            if (findIndex2 !== -1) {
                uploadedBase64Files.value.splice(findIndex2, 1)
            }
        }
    }

    async function handleChangeZoomMeeting() {
        console.log('Selected Zoom Meeting:', selectedZoomMeeting.value);
        const { response: meetingResponse } = await getMeetingDetail(selectedZoomMeeting.value)
        meetingDetail.value = meetingResponse || {}
        console.log('meetingDetail data:', meetingDetail.value)

        
        const { data: postgreZoomMeetings }: any = await fetchPostgreZoomMeetings();
        console.log('Postgre Zoom Meetings:', postgreZoomMeetings)

        if (postgreZoomMeetings.length > 0 && postgreZoomMeetings[0]?.next_meeting_date) {
            formattedNextMeeting.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings[0]?.next_meeting_date)
            nextMeetingDate.value = covertToYYYYMMDDTHHMM(postgreZoomMeetings[0]?.next_meeting_date)
        } else {
            formattedNextMeeting.value = null
            nextMeetingDate.value = null
        }
        console.log('formattedNextMeeting.value:', formattedNextMeeting.value)
        console.log('nextMeetingDate.value:', nextMeetingDate.value)
        form.value.next_meeting_date = formattedNextMeeting.value
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
                                        <UInput v-model="form.from" label="From" class="w-full" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Receiver:</label>
                                        <UInput v-model="form.to" label="To" class="w-full" />
                                    </div>
                                    <div class="w-full space-y-1">
                                        <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Next Meeting Date:</label>
                                        <UInput v-model="form.next_meeting_date" type="datetime-local" label="Next Meeting Date" class="w-full" />
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
                                            <!-- <span class="text-gray-500 dark:text-gray-400 text-xs">
                                                <UIcon name="i-lucide-check-circle" class="size-3 text-green-600" />
                                            </span> -->
                                            <UButton
                                                icon="i-heroicons-x-mark"
                                                size="xs"
                                                color="neutral"
                                                variant="ghost"
                                                class="ml-1"
                                                @click="removeAttachment(file)"
                                            />
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
                                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Attach Signature:</label>
                                    <USelect v-model="selectedFollowUp" class="w-full" :items="itemsFollowup" @update:modelValue="handleForFollowUp" placeholder="Select Signature"/>
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
                    </div>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
