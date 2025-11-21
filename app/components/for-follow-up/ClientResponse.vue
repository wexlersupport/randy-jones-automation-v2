<script setup lang="ts">
    import { upperFirst } from 'scule'
    import { getPaginationRowModel, type Row } from '@tanstack/table-core'
    import type { TableColumn, TableRow } from '@nuxt/ui/runtime/components/Table.vue.js';

    const UButton = resolveComponent('UButton')
    const UBadge = resolveComponent('UBadge')
    const UDropdownMenu = resolveComponent('UDropdownMenu')
    const UCheckbox = resolveComponent('UCheckbox')
    
    const route = useRoute()
    const personId = route.params.id as string
    const search = ref('')
    const statusFilter = ref('all')
    const isLoading = ref<boolean>(true)
    const toast = useToast()
    const table = useTemplateRef('table')
    const columnVisibility = ref()
    const rowSelection = ref({})
    const pagination = ref({
        pageIndex: 0,
        pageSize: 10
    })
    const clients = ref<any[]>([])

    onMounted(async () => {
        const { data }: any = await getClientResponse();
        clients.value = data || []

        isLoading.value = false
    })
    
    const filteredRows = computed(() => {
        if (!search.value) {
            isLoading.value = true
            setTimeout(() => {
                isLoading.value = false
            }, 1000)

            return clients.value
        }
        // page.value = 1
        setTimeout(() => {
            isLoading.value = false
        }, 1000)

        return clients.value.filter((d: any) => {
            return Object.values(d).some((value) => {
                return String(value).toLowerCase().includes(search.value.toLowerCase())
            })
        })
    })

    function getRowItems(row: Row<any>) {
        return [
            {
                type: 'label',
                label: 'Actions'
            },
            {
                type: 'separator'
            },
            {
                label: 'Copy Email',
                icon: 'i-lucide-copy',
                onSelect() {
                    if (!navigator.clipboard) {
                        toast.add({
                            title: 'Clipboard not supported',
                            description: 'Your browser does not support clipboard operations.'
                        })
                        return
                    }
                    if (!row.original || !row.original.person_email) {
                        toast.add({
                            title: 'Error',
                            description: 'No email found for this row.'
                        })
                        return
                    }
                    navigator.clipboard.writeText(row.original.person_email)

                    toast.add({
                        title: 'Copied to clipboard',
                        description: 'Email copied to clipboard'
                    })
                }
            }
        ]
    }

    const columns: TableColumn<any>[] = [
        {
            id: 'person_name',
            accessorKey: 'person_name',
            header: 'Client Name',
        },
        // {
        //     id: 'person_email',
        //     accessorKey: 'person_email',
        //     header: 'Client Email',
        // },
        {
            id: 'signature_id',
            accessorKey: 'signature_id',
            header: 'Meeting Type',
            cell: ({ row }) => {
                const _items = signatureList({ name: row.getValue('person_name') })
                const selected = _items.find(item => item.value === row.getValue('signature_id'));
                return selected ? selected.subject : row.getValue('signature_id')
            }
        },
        {
            id: 'next_meeting_date',
            accessorKey: 'next_meeting_date',
            header: 'Meeting Date',
            cell: ({ row }) => {
                return new Date(row.getValue('next_meeting_date')).toLocaleString('en-US', {
                    year: "numeric",
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            }
        },
        {
            id: 'is_script_sent',
            accessorKey: 'is_script_sent',
            header: 'Reminder Status',
            cell: ({ row }) => {
                // return row.getValue('is_script_sent') ? 'Sent' : 'Pending'
                if (row.original?.is_script_sent) {
                    return 'Sent last ' + new Date(row.original.sent_reminder_date).toLocaleString('en-US', {
                        year: "numeric",
                        day: 'numeric',
                        month: 'short'
                    })
                } else {
                    return h('div', { class: 'flex items-center justify-between w-full' }, [
                        h('span', 'Pending'),
                        h(UButton, {
                            icon: 'i-lucide-send',
                            color: 'primary',
                            variant: 'subtle',
                            label: 'Send Now',
                            onClick: () => onSendNow(row.original),
                            class: 'cursor-pointer',
                        })
                    ])

                }
            }
        }
    ]

    async function getClientResponse() {
        const res = await $fetch('/api/postgre/dynamic', {
            method: 'GET',
            query: {
                table: 'client_response',
                isDesc: true,
                dynamic_field1: 'person_id',
                value1: personId
            }
        })

        return res
    }

    async function getInviteReminders() {
        const res = await $fetch('/api/postgre/dynamic', {
            method: 'GET',
            query: {
                table: 'meeting_summary_temp',
                isDesc: true,
                dynamic_field1: 'type',
                value1: 'invite_reminders'
            }
        })

        return res
    }

    async function onSendNow(row: any) {
        if (confirm(`Are you sure you want to send a reminder to ${row.person_email}?`)) {
            isLoading.value = true
            const { data }: any = await getInviteReminders();
            const reminders_data = data || {}
            // console.log("Reminders Data...", reminders_data);
            const recipientEmails = row?.person_email?.split(',')
            const recipientNames = row?.person_name?.split(',')
            // console.log("Recipient...", recipientEmails, recipientNames);

            let emailResponses = await Promise.all(
                recipientEmails.map((email: any, index: number) =>
                    sendEmail(row, email?.trim(), recipientNames[index], reminders_data?.[0])
                )
            );
            // console.log("emailResponses...", emailResponses);

            const allSuccessful = emailResponses.every(res => res?.success);
            // console.log("allSuccessful...", allSuccessful);
            if (allSuccessful) {
                // console.log("Emails sent successfully to all recipients for client_response ID:", row.id);
                const updateResponse: any = await updateClientResponse(row);
                // console.log("Update response...", updateResponse);
            }

            await onUpdateData()
            isLoading.value = false
        }
    }

    async function sendEmail(data: any, email: any, name: any, reminders_data: any) {
        const convertedDate = clientResponseDate(new Date(data?.next_meeting_date));
        const replacements = {
            name,
            meeting_date: convertedDate,
            zoom_link: data?.zoom_link,
        };
        let content = fillTemplate(reminders_data?.meeting_ai_summary, replacements);
        content = plainTextToHtml(content);
        // console.log('Email Content:', content);

        const newSchedule = {
            message: {
                subject: reminders_data.model || 'Quick Reminder — Upcoming Meeting with Randy Jones',
                body: {
                    contentType: "HTML",
                    content
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: email
                        }
                    }
                ]
            },
        };
        // console.log('newSchedule:', newSchedule);

        const response = await fetch(`/api/email/sent-reminders-now`, {
            method: 'POST',
            body: JSON.stringify({newSchedule})
        })
        const res = await response.json()
        // console.log('Email sent response:', res);
        return res
    }

    async function onSentClientReminder(row: any) {
        const client_response = await updateClientResponse(row)
        const calendar_event = await updateCalendarEvent(row?.event_id)

        toast.add({
            title: 'Success',
            description: `Client reminder sent successfully to ${row.person_email}`
        })
        await refresh()
        clients.value = data.value?.data || []
        const { startPreviousSunday, endPreviousSunday } = await getPreviousSunday(row.next_meeting_date);
        console.log('startPreviousSunday:', startPreviousSunday) //2025-09-21T15:00
        const sunday_reminder_calendar = await setSundayReminderCalendar(startPreviousSunday);
        console.log('sunday_reminder_calendar:', sunday_reminder_calendar) //Sunday, September 21, 2025

        alert(`This will send the client a Reminder Calendar invite for ${sunday_reminder_calendar}.`)
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

    async function updateCalendarEvent(eventId: string) {
        const response = await fetch(`/api/calendar/update_calendar_event`, {
            method: 'POST',
            body: JSON.stringify({eventId})
        })
        const res = await response.json()

        return res
    }

    async function updateClientResponse(row: any) {
        const res = await $fetch('/api/postgre/' + row.id, {
            method: 'PUT',
            query: {
                table: 'client_response',
                dynamic_field: 'id',
                dynamic_value: row.id
            },
            body: {
                is_script_sent: true,
                sent_reminder_date: new Date()
            },
        })

        return res
    }

    watch(() => statusFilter.value, (newVal) => {
        search.value = 'FilteredByStatus:' + newVal
    })

    function select(row: TableRow<any>, e?: Event) {
        // row.toggleSelected(!row.getIsSelected())
    }

    async function onUpdateData() {
        isLoading.value = true
        const { data }: any = await getClientResponse();
        clients.value = data || []

        setTimeout(() => {
            isLoading.value = false
        }, 1000);
    }

    // Expose functions that the parent can call
    defineExpose({
        onUpdateData
    })
</script>

<template>
    <div>
        <UCard class="w-full">
            <template #header>
                <h2 class="text-lg font-semibold">Invite Reminder</h2>
            </template>

            <div class="grid grid-cols-1 gap-1">
                <UiAppLoading
                    v-if="isLoading"
                    class="w-full border rounded-md p-6 my-4 border-neutral-800"
                />
                <UTable
                    v-if="!isLoading"
                    ref="table"
                    v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection"
                    v-model:pagination="pagination"
                    :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }"
                    class="shrink-0"
                    :data="filteredRows"
                    :columns="columns"
                    :loading="isLoading"
                    @select="select"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
                        td: 'border-b border-default'
                    }"
                />

            </div>
        </UCard>
    </div>
</template>