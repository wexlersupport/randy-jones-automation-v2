<script setup lang="ts">
    import * as v from 'valibot'
    import type { FormSubmitEvent } from '@nuxt/ui'

    const emits = defineEmits(['on-update-materials']);
    const toast = useToast()
    const data = ref<any>(null)
    const open = ref<boolean>(false)
    const isLoading = ref<boolean>(true)
    const form = useTemplateRef<any>('form')
    const query = { table: 'materials' }
    let formObj = reactive<{
        id: number | null | undefined,
        name: string,
        cost: number,
        description: string,
    }>({
        id: null,
        name: '',
        cost: 0,
        description: '',
    })
    const schema = v.object({
        name: v.pipe(v.string(), v.minLength(1, 'Must be at least 1 character')),
        cost: v.pipe(v.number(), v.minValue(0, 'Cost must be a positive number')),
    })
    type Schema = v.InferOutput<typeof schema>

    defineExpose({
        onModalOpen,
    })
    function onModalOpen(editData: any = null) {
        open.value = true
        if (editData) {
            data.value = editData
            formObj = {
                id: Number(data.value.id),
                cost: Number(data.value.cost),
                name: data.value.name,
                description: data.value.description || '',
            }
        }
    }

    // onMounted(async () => {
    //     if (data.value) {
    //         console.log('Data for modal:', data.value);
    //     }
    // })

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        // console.log('formObj', formObj, event)
        isLoading.value = true
        let description = ''
        if (formObj.id) {
            // Update existing material
            const updated_at = formatJsDateToDatetime(new Date())
            const updateItem = await handleApiResponse($fetch('/api/postgre/'+formObj.id, {
                query: {
                    table: 'materials',
                    dynamic_field: 'id',
                    dynamic_value: formObj.id
                },
                method: 'PUT',
                body: { updated_at,
                    name: formObj.name,
                    cost: Number(formObj.cost),
                    description: formObj.description || '',
                 }
            }));
            description = 'Material was successfully updated!'

        } else {
            // Create new material
            formObj.id = undefined; // Remove id for new item creation
            const created_at = formatJsDateToDatetime(new Date())
            const createItem = await handleApiResponse($fetch('/api/postgre', {
                query,
                method: 'POST',
                body: { created_at, ...formObj }
            }));
            description = 'Material was successfully created!'
        }
        
        toast.add({
            title: 'Success',
            description,
            icon: 'i-lucide-check',
            color: 'success'
        })

        formObj = {
            id: null,
            name: '',
            cost: 0,
            description: '',
        }

        isLoading.value = false
        emits('on-update-materials');
        open.value = false
    }

    function onSave() {
        form.value.submit()
    }
</script>

<template>
    <UModal v-model:open="open"
        :title="`${data ? 'Edit Material' : 'Add New Material'}`"
        description="Please fill in all required (*) details of new material."
        :ui="{ footer: 'justify-end' }">

        <template #body>
            <div class="py-2">
                <UForm ref="form" :schema="schema" :state="formObj" class="space-y-4" @submit="onSubmit">
                    <div>
                        <div class="grid grid-cols-4 gap-2">
                            <div class="text-right col-span-1 pt-1">* Name:</div>
                            <div class="col-span-3">
                                <UFormField name="name">
                                    <UInput v-model="formObj.name"
                                        placeholder="Name of Material"
                                        autocomplete="off"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>
                            <div class="text-right col-span-1 pt-1">* Cost:</div>
                            <div class="col-span-3">
                                <UFormField name="cost">
                                    <UInput v-model="formObj.cost"
                                        type="number"
                                        placeholder="Cost of Material"
                                        autocomplete="off"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>
                            <div class="text-right col-span-1 pt-1">Description:</div>
                            <div class="col-span-3">
                                <UFormField name="description">
                                    <UTextarea
                                        v-model="formObj.description"
                                        autocomplete="off"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>

                            
                        </div>
                    </div>
                </UForm>
            </div>
        </template>

        <template #footer="{ close }">
            <UButton @click="open = false" label="Close" color="neutral" variant="outline" />
            <UButton @click="onSave" label="Save" icon="i-lucide-save" />
        </template>
    </UModal>
</template>
