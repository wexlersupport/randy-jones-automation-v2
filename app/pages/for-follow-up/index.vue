<script setup lang="ts">
    import { upperFirst } from 'scule'
    import { getPaginationRowModel, type Row } from '@tanstack/table-core'
    import type { TableColumn, TableRow } from '@nuxt/ui/runtime/components/Table.vue.js';

    const { call } = useApi()
    const UButton = resolveComponent('UButton')
    const UBadge = resolveComponent('UBadge')
    const UDropdownMenu = resolveComponent('UDropdownMenu')
    const UCheckbox = resolveComponent('UCheckbox')
    const search = ref('')
    const statusFilter = ref('all')
    const isLoading = ref<boolean>(true)
    const isOpen = ref<boolean>(false)
    const toast = useToast()
    const table = useTemplateRef<any>('table')
    const columnVisibility = ref()
    const rowSelection = ref({})
    const pagination = ref({
        pageIndex: 0,
        pageSize: 10
    })
    const persons = ref<any[]>([])
    const selectedPerson = ref<any>(null)
    const filterMeetingsOnly = ref(false)

    onMounted(async () => {
        const {response} = await getPipedrivePerson()
        persons.value = response.map((person: any) => {
            let meeting_type = '-'
            if (person?.zoom_meetings?.length > 0) {
                meeting_type = leafProcess()?.find((item: any) => item.value === person?.zoom_meetings[0]?.signature_id)?.label || 'Quick Call'
            }
            return {
                ...person,
                meeting_label: meeting_type
            }
        })
        // console.log('persons.value:', persons.value)

        isLoading.value = false
    })

    async function getPipedrivePerson() {
        const response = await fetch('/api/pipedrive/all_person', {
            method: 'POST'
        })
        const res = await response.json()

        return res
    }

    const filteredRows = computed(() => {
        let rows = [...persons.value]    // always start with full list

        // 1. APPLY MEETING FILTER
        if (filterMeetingsOnly.value) {
            rows = rows.filter((person: any) => {
                const hasZoomMeeting = person?.zoom_meetings?.length > 0
                const hasZoomSummary = !!person?.zoom_summary?.meeting_end_time
                return hasZoomMeeting || hasZoomSummary
            })
        }

        // 2. APPLY STATUS FILTER
        if (search.value.startsWith('FilteredByStatus:')) {
            const status = search.value.replace('FilteredByStatus:', '')

            if (status !== 'all') {
                rows = rows.filter((person: any) => person.status === status)
            }

            return rows   // now this is safe because meeting filter already applied
        }

        // 3. APPLY TEXT SEARCH (ONLY modifies rows, doesn't reset!)
        if (search.value.trim()) {
            const term = search.value.toLowerCase()

            rows = rows.filter((person: any) => {
                return (
                    person.name?.toLowerCase().includes(term) ||
                    person.primary_email?.toLowerCase().includes(term) ||
                    person.org_name?.toLowerCase().includes(term) ||
                    person.notes?.toLowerCase().includes(term)
                )
            })
        }

        return rows   // ALWAYS return final filtered result
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
                label: 'View Contact Details',
                icon: 'i-lucide-list',
                onSelect() {
                    // navigateTo('/for-follow-up/' + row.original.id)
                    // selectedPerson.value = persons.value.find(p => p.id === row.original.id)
                    // selectedPerson.value.primary_phone = selectedPerson.value?.phone?.length > 0 ? selectedPerson.value.phone[0]?.value : ''
                    // console.log('View Contact Details clicked', selectedPerson.value);
                    // isOpen.value = true

                    const id = row.original.id // Adjust depending on your row data
                    const url = `https://randyjonesautomation.pipedrive.com/person/${id}`
                    window.open(url, '_blank')
                }
            },
            {
                type: 'separator'
            }
        ]
    }

    const columns: TableColumn<any>[] = [
        {
            id: 'select',
            header: ({ table }) =>
            h(UCheckbox, {
                'modelValue': table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                table.toggleAllPageRowsSelected(!!value),
                'ariaLabel': 'Select all'
            }),
            cell: ({ row }) =>
            h(UCheckbox, {
                'modelValue': row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'ariaLabel': 'Select row'
            })
        },
        {
            id: "Client name",
            accessorKey: 'name',
            header: ({ column }) => {
                const isSorted = column.getIsSorted()

                return h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    label: 'Client',
                    icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                    class: '-mx-2.5',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                })
            },
            cell: ({ row }) => {
                return h(UButton, {
                    color: 'neutral',
                    variant: 'subtle',
                    label: row.original.name,
                    onClick: async () => {
                        // navigateTo('/for-follow-up/' + row.original.id)
                        const selected = persons.value.find(p => p.id === row.original.id)
                        if (selected) {
                            if (selected?.zoom_meetings?.length > 0) {
                                navigateTo('/zoom-meetings/' + encodeURIComponent(selected.zoom_meetings[0]?.meeting_uuid))
                                return
                            }
                        }

                        isLoading.value = true
                        const { response } = await call('/api/zoom/meeting_summary')
                        const filtered = response.filter((meeting: any) => !meeting.postgre_data)
                        if (filtered?.length > 0) {
                            navigateTo('/zoom-meetings/' + encodeURIComponent(filtered[0]?.meeting_uuid) + '?person_id=' + row.original.id)
                        } else {
                            isLoading.value = false
                        }
                    },
                    class: 'text-center cursor-pointer',
                })
            }
        },
        {
            id: 'meeting_label',
            accessorKey: 'meeting_label',
            header: 'Meeting Type'
        },
        {
            id: 'Last Meeting Date',
            accessorKey: 'zoom_summary',
            header: ({ column }) => {
                const isSorted = column.getIsSorted()

                return h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    label: 'Last Meeting Date',
                    icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                    class: '-mx-2.5',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                })
            },
            cell: ({ row }) => {
                if (!row.original?.zoom_summary?.meeting_end_time || row.original?.zoom_summary?.meeting_end_time?.length === 0) {
                    return '-'
                }
                return new Date(row.original?.zoom_summary?.meeting_end_time).toLocaleString('en-US', {
                    year: "numeric",
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            }
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                return h(
                    'div',
                    { class: 'text-right' },
                    h(
                    UDropdownMenu,
                    {
                        content: {
                        align: 'end'
                        },
                        items: getRowItems(row)
                    },
                    () =>
                        h(UButton, {
                        icon: 'i-lucide-ellipsis-vertical',
                        color: 'neutral',
                        variant: 'ghost',
                        class: 'ml-auto'
                        })
                    )
                )
            }
        }
    ]

    watch(() => statusFilter.value, (newVal) => {
        search.value = 'FilteredByStatus:' + newVal
    })

    function select(row: TableRow<any>, e?: Event) {
        row.toggleSelected(!row.getIsSelected())
    }
</script>

<template>
    <UDashboardPanel id="for-follow-up-index">
        <template #header>
            <UDashboardNavbar title="Client Meeting Dashboard">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>
        
        <template #body>
            <UiAppLoading
                v-if="isLoading"
                class="w-full border rounded-md p-6 my-4 border-neutral-800"
            />

            <div v-if="!isLoading" class="flex flex-wrap items-center justify-between gap-1.5">
                <div>
                    <UInput
                        v-model="search"
                        class="max-w-sm"
                        icon="i-lucide-search"
                        placeholder="Input search term..."
                    />
                    <UCheckbox 
                        v-model="filterMeetingsOnly"
                        label="Show only contacts with meetings"
                        class="mt-4"
                    />
                </div>

                <div class="flex flex-wrap items-center gap-1.5">
                    <UDropdownMenu
                        :items="
                        table?.tableApi
                            ?.getAllColumns()
                            .filter((column: any) => column.getCanHide())
                            .map((column: any) => ({
                                label: upperFirst(column.id),
                                type: 'checkbox' as const,
                                checked: column.getIsVisible(),
                                onUpdateChecked(checked: boolean) {
                                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                                },
                                onSelect(e?: Event) {
                                    e?.preventDefault()
                                }
                            }))
                        "
                        :content="{ align: 'end' }"
                    >
                        <UButton
                            label="Display"
                            color="neutral"
                            variant="outline"
                            trailing-icon="i-lucide-settings-2"
                        />
                    </UDropdownMenu>
                </div>
            </div>
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
        </template>
    </UDashboardPanel>

    <USlideover
        v-model:open="isOpen"
        title="Contact Details"
        description="All record details are sourced from PipeDrive."
    >
        <template #body>
            <div class="grid grid-cols-1 gap-1">
                <div class="w-full space-y-1">
                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Name:</label>
                    <UInput v-model="selectedPerson.name" label="Person Name" disabled class="w-full"/>
                </div>
                <div class="w-full space-y-1">
                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Phone:</label>
                    <UInput v-model="selectedPerson.primary_phone" label="Primary Phone" disabled class="w-full"/>
                </div>
                <div class="w-full space-y-1">
                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Email:</label>
                    <UInput v-model="selectedPerson.primary_email" label="Primary Email" disabled class="w-full"/>
                </div>
                <div class="w-full space-y-1">
                    <label class="block text-sm font-medium w-50 my-auto text-neutral-500">Organization:</label>
                    <UInput v-model="selectedPerson.org_name" label="Organization Name" disabled class="w-full"/>
                </div>
            </div>
        </template>
        <template #footer>
            <UButton
                block
                color="info"
                class="p-4"
                @click="isOpen = false"
            >
                OK
            </UButton>
        </template>
    </USlideover>
</template>
