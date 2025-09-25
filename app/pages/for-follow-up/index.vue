<script setup lang="ts">
    import { upperFirst } from 'scule'
    import { getPaginationRowModel, type Row } from '@tanstack/table-core'
    import type { TableColumn, TableRow } from '@nuxt/ui/runtime/components/Table.vue.js';

    const UButton = resolveComponent('UButton')
    const UBadge = resolveComponent('UBadge')
    const UDropdownMenu = resolveComponent('UDropdownMenu')
    const UCheckbox = resolveComponent('UCheckbox')
    const search = ref('')
    const statusFilter = ref('all')
    const isLoading = ref<boolean>(true)
    const toast = useToast()
    const table = useTemplateRef<any>('table')
    const columnVisibility = ref()
    const rowSelection = ref({})
    const pagination = ref({
        pageIndex: 0,
        pageSize: 10
    })
    const persons = ref<any[]>([])

    onMounted(async () => {
        const {response} = await getPipedrivePerson()
        persons.value = response || []

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
        if (search.value.startsWith('FilteredByStatus:')) {
            const status = search.value.replace('FilteredByStatus:', '')
            if (status === 'all') return persons.value
            
            return persons.value.filter((person: any) => {
                return person.status === status
            })
        }
        
        if (!search.value) {
            return persons.value
        }
        
        const searchTerm = search.value.toLowerCase()
        return persons.value.filter((person: any) => {
            if (person.name && 
                String(person.name).toLowerCase().includes(searchTerm)) {
                return true
            }
            
            if (person.primary_email && 
                String(person.primary_email).toLowerCase().includes(searchTerm)) {
                return true
            }
            
            if (person.org_name && 
                String(person.org_name).toLowerCase().includes(searchTerm)) {
                return true
            }
            
            if (person.notes && 
                String(person.notes).toLowerCase().includes(searchTerm)) {
                return true
            }
            
            return false
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
                    if (!row.original || !row.original.primary_email) {
                        toast.add({
                            title: 'Error',
                            description: 'No email found for this row.'
                        })
                        return
                    }
                    navigator.clipboard.writeText(row.original.primary_email)

                    toast.add({
                        title: 'Copied to clipboard',
                        description: 'Email copied to clipboard'
                    })
                }
            },
            {
                label: 'View Contact Details',
                icon: 'i-lucide-list',
                onSelect() {
                    navigateTo('/for-follow-up/' + row.original.id)
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
                    onClick: () => navigateTo('/for-follow-up/' + row.original.id),
                    class: 'text-center cursor-pointer',
                })
            }
        },
        {
            id: "Client Email",
            accessorKey: 'primary_email',
            header: ({ column }) => {
                const isSorted = column.getIsSorted()

                return h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    label: 'Email',
                    icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                    class: '-mx-2.5',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                })
            },
        },
        {
            id: "Organization Name",
            accessorKey: 'org_name',
            header: ({ column }) => {
                const isSorted = column.getIsSorted()

                return h(UButton, {
                    color: 'neutral',
                    variant: 'ghost',
                    label: 'Organization Name',
                    icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                    class: '-mx-2.5',
                    onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
                })
            },
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
    <UiAppLoading
        v-if="isLoading"
        class="w-full border rounded-md p-6 my-4 border-neutral-800"
    />
    <UDashboardPanel v-if="!isLoading" id="for-follow-up-index">
        <template #header>
            <UDashboardNavbar title="For Follow Up">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>
        
        <template #body>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
                <UInput
                    v-model="search"
                    class="max-w-sm"
                    icon="i-lucide-search"
                    placeholder="Input search term"
                />

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

            <UiAppLoading
                v-if="isLoading"
                class="border rounded-md p-6 my-4 border-neutral-800"
            />

            <UTable
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
        </template>
    </UDashboardPanel>
</template>
