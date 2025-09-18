<script setup lang="ts">
    import * as v from 'valibot'
    import type { FormSubmitEvent } from '@nuxt/ui'

    const emits = defineEmits(['download']);
    const toast = useToast()
    const form: any = useTemplateRef('form')
    const open = ref<boolean>(false)
    const isLoading = ref<boolean>(false)
    type EmailObj = {
        from: string,
        to: string,
        subject: string,
        html: string,
        filename: string,
        content?: string,
    }
    const emailObj = reactive<EmailObj>({
        from: 'francis.regala@strattonstudiogames.com',
        to: '',
        subject: 'Test Subject',
        html: `<p>Thank you!</p>`,
        filename: 'test.pdf',
        content: '',
    })
    const props = defineProps<{
        data: any,
    }>()
    
    const pdf_name = ref<string>('')
    onMounted(async () => {
        if (props?.data) {
            const name = props?.data?.field_service?.CustomerName ?? ''
            pdf_name.value = `${name}_${props?.data?.work_order_id}_${props?.data?.quotation_id}`

            emailObj.filename = `${pdf_name.value}.pdf`
            emailObj.subject = `${name} - WO#${props?.data?.work_order_id} - Quote#${props?.data?.quotation_id}`
        }
    })

    defineExpose({
        onModalOpen,
    })
    function onModalOpen() {
        open.value = true
    }

    const schema = v.object({
        from: v.pipe(v.string(), v.email('Invalid email')),
        to: v.pipe(v.string(), v.email('Invalid email')),
        subject: v.pipe(v.string(), v.minLength(2, 'Must be at least 2 characters'))
    })
    type Schema = v.InferOutput<typeof schema>

    async function onSubmit(event: FormSubmitEvent<Schema>) {
        // console.log('emailObj', emailObj, event)
        isLoading.value = true

        try {
            emailObj.content = props.data.pdf_base64
            const response_send_quotation = await fetch('/api/sendgrid/send-quotation', {
                method: 'POST',
                body: JSON.stringify({emailObj})
            })
            const send_quotation_res = await response_send_quotation.json()
            // console.log('send_quotation_res ', send_quotation_res)

        if (send_quotation_res?.accepted?.length > 0 || send_quotation_res?.data?.id || (send_quotation_res.length > 0 && send_quotation_res[0].statusCode)) {
            delete emailObj.content
            const created_at = formatJsDateToDatetime(new Date())
            const createItem = await handleApiResponse($fetch('/api/postgre', {
                query: { table: 'email' },
                method: 'POST',
                body: { 
                    ...emailObj,
                    created_at,
                    status: 'sent',
                    quotation_id: props?.data?.quotation_id,
                    work_order_id: props?.data?.work_order_id
                }
            }));

            toast.add({
                title: 'Success',
                description: 'Your email was successfully sent!',
                icon: 'i-lucide-check',
                color: 'success'
            })
            open.value = false
        } else {
            toast.add({
                title: 'Opss! Something went wrong.',
                description: 'There was a problem with your request!',
            })
        }
        } catch (error) {
            console.error('Error sending email:', error)
            toast.add({
                title: 'Error',
                description: 'Failed to send email. Please try again.',
                color: 'error'
            })
        } finally {
            isLoading.value = false
        }
    }

    function onSendEmail() {
        form.value.submit()
    }
</script>

<template>
    <UModal v-model="open" class="w-full sm:max-w-4xl">
        <UForm ref="form" :schema="schema" :state="emailObj" @submit="onSubmit" class="space-y-6">
            <UCard class="px-6 py-4 sm:p-6 divide-y divide-gray-100 dark:divide-gray-800">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Send Email
                        </h3>
                        <UButton 
                            color="neutral" 
                            variant="ghost" 
                            icon="i-heroicons-x-mark-20-solid" 
                            class="-my-1" 
                            @click="open = false" 
                        />
                    </div>
                </template>

                <div class="space-y-6">
                    <!-- Email Recipients -->
                    <div class="grid grid-cols-1 gap-4">
                        <UFormGroup label="To" name="to" class="space-y-2">
                            <UInput 
                                v-model="emailObj.to" 
                                placeholder="recipient@example.com"
                                type="email"
                                size="lg"
                                class="w-full"
                            />
                        </UFormGroup>
                    </div>

                    <!-- Email Subject -->
                    <div class="grid grid-cols-1 gap-4">
                        <UFormGroup label="Subject" name="subject" class="space-y-2">
                            <UInput 
                                v-model="emailObj.subject" 
                                placeholder="Enter email subject"
                                size="lg"
                                class="w-full"
                            />
                        </UFormGroup>
                    </div>

                    <!-- Email Content -->
                    <div class="space-y-3">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Message
                        </label>
                        <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <QuillEditor 
                                v-model:content="emailObj.html" 
                                content-type="html"
                                :options="{
                                    theme: 'snow',
                                    modules: {
                                        toolbar: [
                                            ['bold', 'italic', 'underline'],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            ['link'],
                                            ['clean']
                                        ]
                                    },
                                    placeholder: 'Compose your email message...'
                                }"
                                class="min-h-[200px]"
                            />
                        </div>
                    </div>

                    <!-- Attachments Section -->
                    <div v-if="pdf_name" class="space-y-3">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Attachments
                        </label>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <div class="flex items-center space-x-3">
                                <UIcon name="i-heroicons-document-text" class="w-5 h-5 text-gray-500" />
                                <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                    {{ pdf_name }}
                                </span>
                                <UBadge color="success" variant="soft" size="xs">
                                    PDF
                                </UBadge>
                            </div>
                        </div>
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end space-x-3">
                        <UButton 
                            color="neutral" 
                            variant="soft" 
                            @click="open = false"
                            size="lg"
                        >
                            Cancel
                        </UButton>
                        <UButton 
                            type="submit" 
                            color="primary"
                            size="lg"
                            :loading="isLoading"
                            :disabled="!emailObj.to || !emailObj.subject"
                        >
                            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 mr-2" />
                            Send Email
                        </UButton>
                    </div>
                </template>
            </UCard>
        </UForm>
    </UModal>
</template>
