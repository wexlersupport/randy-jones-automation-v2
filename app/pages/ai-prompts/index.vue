<script setup lang="ts">
    const toast = useToast()
    const isLoading = ref(true)
    const { data, refresh }: any = await useFetch('/api/postgre/dynamic_field', {
        query: {
            table: 'meeting_summary_temp',
            dynamic_field: 'type',
            value: 'ai_prompts',
            isDesc: true
        }
    });
    // console.log('Fetched AI Prompt data:', data.value)
    // const promptData = data.value?.data?.[0] || null
    const aiPrompt = ref<string>(data.value?.data?.[0]?.meeting_ai_summary || '')
    const ai_password = ref<any>(null)
    const isAuthorized = ref(false)
    const correctPassword = ref('')

    const handleSubmit = async() => {
        isLoading.value = true

        await createAiPrompt()
        await deleteMerge()
        await refresh()
        isLoading.value = false

        toast.add({
            title: 'AI Prompt saved',
            description: 'Your AI prompt has been saved successfully.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })
    }

    onMounted(async () => {
        const { data }: any = await getAiPassword();
        ai_password.value = data[0] || null
        correctPassword.value = data[0]?.openid_id || ''

        setTimeout(() => {
            isLoading.value = false
        }, 1000)
    })

    async function deleteMerge() {
        const {data: merge_data} = await handleApiResponse($fetch(`/api/postgre/dynamic_field`, {
            method: 'GET',
            query: {
                table: 'meeting_summary_temp',
                dynamic_field: 'type',
                value: 'merge'
            }
        }));
        // console.log('Fetched merge items:', merge_data)
        merge_data.forEach(async(item: any) => {
            if (item?.type === 'merge') {
                const deleteItem = await handleApiResponse($fetch(`/api/postgre/dynamic_field`, {
                    method: 'DELETE',
                    query: {
                        table: 'meeting_summary_temp',
                        dynamic_field: 'id',
                        value: Number(item?.id)
                    }
                }));
                console.log('Deleted merge items:', deleteItem)
            }
        });
    }

    async function createAiPrompt() {
        const created_at = formatJsDateToDatetime(new Date())
        const createItem = await handleApiResponse($fetch('/api/postgre', {
            method: 'POST',
            query: {
                table: 'meeting_summary_temp'
            },
            body: {
                meeting_uuid: 'ai_prompts',
                meeting_ai_summary: aiPrompt.value,
                type: 'ai_prompts',
                created_at,
            }
        }));
        console.log('AI Prompt saved:', createItem)

        return createItem
    }

    async function getAiPassword() {
        const res = await $fetch('/api/postgre/dynamic', {
            method: 'GET',
            query: {
                table: 'meeting_summary_temp',
                isDesc: true,
                dynamic_field1: 'type',
                value1: 'ai_password',
            }
        })

        return res
    }
</script>

<template>
    <UDashboardPanel  id="ai-prompts" :ui="{ body: 'gap-2 sm:gap-2 h-full' }">
        <template #body>
            <UiAppLoading
                v-if="isLoading"
                class="w-full border rounded-md p-6 my-4 border-neutral-800"
            />

            <div v-if="!isLoading" class="p-1 space-y-4">
                <div class="grid grid-cols-1 gap-2">
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">AI prompts to merge Signatures and Meeting Summaries</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-3">

                            <!-- ADMIN PASSWORD MODULE -->
                            <AdminPassword @authorized="isAuthorized = true" />

                            <UTextarea
                                v-model="aiPrompt"
                                :disabled="!isAuthorized"
                                placeholder="Enter your AI prompt here..."
                                class="w-full border border-neutral-700 rounded-md p-2 bg-neutral-900 text-white"
                                :rows="20"
                            />
                            <UButton
                                :color="isAuthorized ? 'primary' : 'neutral'"
                                class="w-fit"
                                icon="i-lucide-save"
                                :disabled="!isAuthorized"
                                @click="handleSubmit"
                            >
                                Save AI Prompt
                            </UButton>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
