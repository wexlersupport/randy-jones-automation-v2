<script setup lang="ts">
    const toast = useToast()
    const isLoading = ref(true)
    const { data, refresh }: any = await useFetch('/api/postgre/dynamic_field', {
        query: {
            table: 'meeting_summary_temp',
            dynamic_field: 'type',
            value: 'ai_summarize',
            isDesc: true
        }
    });
    // console.log('Fetched AI Prompt data:', data.value)
    // const promptData = data.value?.data?.[0] || null
    const aiPrompt = ref<string>(data.value?.data?.[0]?.meeting_ai_summary || '')
    const ai_password = ref<any>(null)
    const adminPassword = ref('')
    const isAuthorized = ref(false)
    const correctPassword = ref('')

    const newPassword = ref('')
    const confirmPassword = ref('')
    const oldPassword = ref('')
    const isChangingPassword = ref(false)
    const showChangePassword = ref(false)

    const handleSubmit = async() => {
        isLoading.value = true

        await createAiPrompt()
        // await deleteMerge()
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
                value: 'summary'
            }
        }));
        // console.log('Fetched merge items:', merge_data)
        merge_data.forEach(async(item: any) => {
            if (item?.type === 'summary') {
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
                meeting_uuid: 'ai_summarize',
                meeting_ai_summary: aiPrompt.value,
                type: 'ai_summarize',
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

    const verifyPassword = () => {
        if (adminPassword.value === correctPassword.value) {
            isAuthorized.value = true
            toast.add({
                title: 'Access Granted',
                description: 'Admin permissions unlocked.',
                icon: 'i-lucide-lock-open',
                color: 'success'
            })
        } else {
            toast.add({
                title: 'Invalid Password',
                description: 'The password you entered is incorrect.',
                icon: 'i-lucide-alert-triangle',
                color: 'error'
            })
        }
    }

    const updatePassword = async () => {
        if (oldPassword.value !== correctPassword.value) {
            toast.add({
                title: 'Incorrect Old Password',
                description: 'The old password you entered is incorrect.',
                icon: 'i-lucide-alert-triangle',
                color: 'error'
            })
            return
        }

        if (newPassword.value.trim().length < 4) {
            toast.add({
                title: 'Password Too Short',
                description: 'New password must be at least 4 characters.',
                icon: 'i-lucide-alert-triangle',
                color: 'error'
            })
            return
        }

        if (newPassword.value !== confirmPassword.value) {
            toast.add({
                title: 'Password Mismatch',
                description: 'New password and confirmation do not match.',
                icon: 'i-lucide-alert-triangle',
                color: 'error'
            })
            return
        }

        // Save in DB
        const created_at = formatJsDateToDatetime(new Date())
        const res = await $fetch('/api/postgre/' + ai_password.value.id, {
            method: 'PUT',
            query: {
                table: 'meeting_summary_temp',
                dynamic_field: 'id',
                dynamic_value: ai_password.value.id
            },
            body: {
                created_at,
                openid_id: newPassword.value
            },
        })
        // console.log('Password update response:', res)

        correctPassword.value = newPassword.value // update frontend value

        toast.add({
            title: 'Password Updated',
            description: 'The admin password has been successfully changed.',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        // Reset UI
        oldPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        isChangingPassword.value = false
        showChangePassword.value = false
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
                            <h2 class="text-lg font-semibold">AI prompts to summarize Zoom Meetings</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-3">
                            <div class="flex items-center space-x-3">
                                <UInput
                                    v-model="adminPassword"
                                    type="password"
                                    placeholder="Enter admin password"
                                    class="w-50"
                                />

                                <UButton
                                    color="info"
                                    icon="i-lucide-lock"
                                    @click="verifyPassword"
                                >
                                    Unlock AI Prompt
                                </UButton>
                                <UButton
                                    v-if="isAuthorized"
                                    color="neutral"
                                    icon="i-lucide-key"
                                    class="w-fit"
                                    @click="showChangePassword = !showChangePassword"
                                >
                                    {{ showChangePassword ? 'Hide Password Change' : 'Change Admin Password' }}
                                </UButton>
                            </div>
                            <span class="text-xs text-neutral-400 italic mb-2">
                                *To change admin password, please unlock the AI prompt first.
                            </span>

                            <!-- CHANGE PASSWORD SECTION -->
                            <div v-if="isAuthorized && showChangePassword" class="p-4 border rounded-md border-neutral-700 bg-neutral-900 space-y-4">
                                <h3 class="text-md font-semibold text-white">Change Admin Password</h3>

                                <div class="grid grid-cols-1 gap-3">
                                    <UInput
                                        v-model="oldPassword"
                                        type="password"
                                        placeholder="Enter old password"
                                        class="w-60"
                                    />

                                    <UInput
                                        v-model="newPassword"
                                        type="password"
                                        placeholder="Enter new password"
                                        class="w-60"
                                    />

                                    <UInput
                                        v-model="confirmPassword"
                                        type="password"
                                        placeholder="Confirm new password"
                                        class="w-60"
                                    />

                                    <UButton
                                        color="warning"
                                        icon="i-lucide-key"
                                        class="w-fit"
                                        @click="updatePassword"
                                    >
                                        Update Password
                                    </UButton>
                                </div>
                            </div>

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
