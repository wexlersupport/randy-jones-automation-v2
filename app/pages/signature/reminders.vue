<script setup lang="ts">
import { is } from 'valibot';

    const toast = useToast()
    const isLoading = ref(true)
    const { data, refresh }: any = await useFetch('/api/postgre/dynamic_field', {
        query: {
            table: 'meeting_summary_temp',
            dynamic_field: 'type',
            value: 'invite_reminders',
            isDesc: true
        }
    });
    // console.log('Fetched Invite Reminders data:', data.value)
    const remindersData = ref<any>(data.value?.data?.[0] || null)
    const subject = ref<string>(remindersData.value?.model || '')
    const content = ref<string>(remindersData.value?.meeting_ai_summary || '')

    onMounted(async () => {
        setTimeout(() => {
            isLoading.value = false
        }, 1000)
    })

    async function onSave() {
        isLoading.value = true
        // console.log('Saving Invite Reminders Template with subject:',remindersData.value, subject.value, 'and content:', content.value)
        if (!subject.value) {
            toast.add({
                description: 'Subject is required',
                icon: 'i-lucide-alert-circle',
                color: 'error'
            })
            return
        }
        if (!content.value) {
            toast.add({
                description: 'Content is required',
                icon: 'i-lucide-alert-circle',
                color: 'error'
            })
            return
        }

        await $fetch('/api/postgre/' + remindersData.value.id, {
            method: 'PUT',
            query: {
                table: 'meeting_summary_temp',
                dynamic_field: 'id',
                dynamic_value: remindersData.value.id
            },
            body: {
                model: subject.value,
                meeting_ai_summary: content.value,
            },
        })

        await refresh()
        toast.add({
            description: 'Successfully saved!',
            icon: 'i-lucide-check-circle',
            color: 'success'
        })

        isLoading.value = false
    }
</script>

<template>
    <div class="flex border border-gray-200 dark:border-gray-700 rounded-md max-w-4xl">
        <div class="w-full border-r border-gray-700 dark:divide-gray-800 border rounded p-3 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
            <div class="flex items-center mb-6">
                <h2 class="text-lg font-bold">Invite Reminders Template</h2>
            </div>
            <!-- Helper notice -->
            <div class="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 p-3 mb-4 text-sm">
                <strong>Placeholders:</strong> these auto-fill when sending. Please don’t edit the curly-brace text. <br />
                Available: <code v-pre>{{name}}</code>, <code v-pre>{{meeting_date}}</code>, <code v-pre>{{zoom_link}}</code>.
            </div>
            <UiAppLoading
                v-if="isLoading"
                class="w-full border rounded-md p-6 my-4 border-neutral-800"
            />
            <div v-if="!isLoading" class="flex items-center justify-between mb-2 gap-2">
                <label class="w-25 font-medium text-gray-600 dark:text-gray-300">Subject: </label>
                <input
                    v-model="subject"
                    type="text"
                    class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
            </div>
            <div v-if="!isLoading">
                <ClientOnly>
                    <QuillEditor
                        contentType="html"
                        v-model:content="content"
                        theme="snow"
                        placeholder="Write your message here..."
                    />
                </ClientOnly>
            </div>
            <div class="grid grid-cols-1 gap-3 my-4">
                <UButton
                    color="primary"
                    size="lg"
                    class="w-fit"
                    icon="i-lucide-save"
                    :loading="isLoading"
                    @click="onSave"
                >
                    Save Template
                </UButton>
            </div>
        </div>
    </div>
</template>
