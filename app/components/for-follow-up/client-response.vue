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
    const { data, refresh } = await useFetch('/api/postgre/dynamic', {
        query: {
            table: 'client_response',
            isDesc: true,
            dynamic_field1: 'person_id',
            value1: personId
        },
    });
    const clients = ref<any[]>(data.value?.data || [])

    onMounted(async () => {
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
            header: 'Name',
        },
        {
            id: 'person_email',
            accessorKey: 'person_email',
            header: 'Client Email',
        },
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
            header: 'Next Meeting Date',
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
        }
    ]

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
                is_sent_reminder: true,
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

    function onUpdateData() {
        console.log('Data updated, refreshing...')
        // await refresh()
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

                <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto"
                    v-if="!isLoading">
                    <div class="text-sm text-muted">
                        {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
                        {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
                    </div>

                    <div class="flex items-center gap-1.5">
                    <UPagination
                        :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                        :total="table?.tableApi?.getFilteredRowModel().rows.length"
                        @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
                    />
                    </div>
                </div>
            </div>
        </UCard>
    </div>
</template>