<script setup lang="ts">
    const emits = defineEmits(['on-update-materials']);
    const toast = useToast()
    const open = ref<boolean>(false)
    const products = ref<any[]>([])
    const search = ref('')
    const materialsAddModalRef = ref<any>(null)
    const isLoading = ref<boolean>(true)
    const query = { table: 'materials' }

    defineExpose({
        onModalOpen,
    })
    function onModalOpen() {
        open.value = true
    }

    onMounted(async () => {
        await fetchMaterials()
    })

    async function fetchMaterials() {
        isLoading.value = true
        const { data } = await useFetch('/api/postgre', {
            query: { ...query, isDesc: true },
        });
        products.value = data.value?.data || [];

        isLoading.value = false
    }

    async function addToMaterialCosts(product: any) {
        emits('on-update-materials', product);
        open.value = false;
    }

    const filteredRows = computed(() => {
        if (!search.value) {
            isLoading.value = true
            setTimeout(() => {
                isLoading.value = false
            }, 1000)

            return products.value
        }

        setTimeout(() => {
            isLoading.value = false
        }, 1000)

        return products.value.filter((d: any) => {
            return Object.values(d).some((value) => {
                return String(value).toLowerCase().includes(search.value.toLowerCase())
            })
        })
    })

    async function onEdit(product: any) {
        materialsAddModalRef.value.onModalOpen(product)
    }

    async function removeMaterialCostItem(product: any) {
        if (confirm('Are you sure you want to remove this item?')) {
            isLoading.value = true

            const deleteItem = await handleApiResponse($fetch(`/api/postgre/dynamic_field`, {
                query: {
                    ...query,
                    dynamic_field: 'id',
                    value: Number(product.id),
                },
                method: 'DELETE'
            }));

            await fetchMaterials()

            isLoading.value = false
            toast.add({
                title: 'Success',
                description: 'Material was successfully removed!',
                icon: 'i-lucide-check',
                color: 'success'
            })
        }
    }
</script>

<template>
    <UModal fullscreen v-model:open="open"
        title="Material List"
        description="Select materials to add to the quotation"
        :ui="{ footer: 'justify-end' }">
        
        <template #body>
            <div class="flex">
                <UInput
                    v-model="search"
                    size="lg"
                    class="w-full"
                    icon="i-lucide-search"
                    placeholder="Input search term"
                />
                <UButton
                    class="ml-2"
                    icon="i-heroicons-plus-circle"
                    label="Add New Material"
                    color="primary"
                    variant="solid"
                    @click="materialsAddModalRef.onModalOpen()"
                />
            </div>
            <UiAppLoading
                v-if="isLoading"
                class="border rounded-md p-6 my-4 border-neutral-800"
            />
            <div v-if="filteredRows.length > 0 && !isLoading"
                class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-2 py-2">
                <UCard class="text-center my-2" v-for="(product, index) in filteredRows" :key="index"
                    :ui="{ header: 'p-2 min-h-[75px]', footer: 'p-2', body: 'p-2 sm:p-4 min-h-[340px]' }">
                    <template #header>
                        <h3 class="text-lg font-semibold">{{ product.name }}</h3>
                    </template>

                    <div class="space-y-4">
                        <div class="relative w-full h-48 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <img
                                :src="product.imageUrl"
                                :alt="product.name"
                                class="object-cover w-full h-full"
                                v-if="product.imageUrl"
                            />
                            <UIcon name="i-heroicons-photo" class="text-6xl text-gray-400 dark:text-gray-500" v-else />
                        </div>
                        <p class="text-gray-700 dark:text-gray-300">{{ product.description }}</p>
                        <div class="flex items-center justify-center space-x-6">
                            <UInput
                                v-model.number="product.quantity"
                                type="number"
                                :min="1"
                                placeholder="Qty"
                                class="w-20"
                            />
                            <span class="text-xl font-bold text-primary-500 dark:text-primary-400">${{ (Number(product.cost) * Number(product.quantity)).toFixed(2) }}</span>
                        </div>                        
                    </div>

                    <template #footer>
                        <div class="text-gray-500 dark:text-gray-400 py-1 gap-x-2 flex items-center justify-center">
                            <UButton
                                class="cursor-pointer"
                                icon="i-heroicons-shopping-cart"
                                label="Add to Material Costs"
                                color="neutral"
                                variant="solid"
                                @click="addToMaterialCosts(product)"
                            />
                            <UTooltip arrow text="Edit item">
                                <UButton @click="onEdit(product)" class="cursor-pointer" icon="i-lucide-pencil" variant="outline" color="info"/>
                            </UTooltip>
                            <UTooltip arrow text="Remove item">
                                <UButton @click="removeMaterialCostItem(product)" class="cursor-pointer" icon="i-lucide-trash-2" variant="outline" color="error"/>
                            </UTooltip>
                        </div>
                    </template>
                </UCard>
            </div>
        </template>

        <template #footer="{ close }">
            <UButton @click="open = false" label="Close" color="neutral" variant="outline" />
        </template>
    </UModal>

    <UiModalMaterialsAdd ref="materialsAddModalRef" @on-update-materials="fetchMaterials" />
</template>
