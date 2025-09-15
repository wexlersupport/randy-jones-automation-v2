<script setup lang="ts">
    import * as v from 'valibot'
    import type { FormSubmitEvent } from '@nuxt/ui'

    const emits = defineEmits(['download']);
    const toast = useToast()
    const form: any = useTemplateRef('form')
    const open = ref<boolean>(false)
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
        html: `<p>Hi,</p><p><br></p><p>You have a new generated quotation available. Please see attached file for more details.</p><p><br></p><p>If you wish to edit the generated pdf quote, click link below.</p><p><a href="https://hawkins-webapp.netlify.app/" rel="noopener noreferrer" target="_blank">Hawkins Electric Web Application Link</a></p><p><br></p><p>Thank you.</p>`,
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
    }

    function onSendEmail() {
        form.value.submit()
    }
</script>

<template>
    <UModal v-model:open="open"
        title="Compose Email"
        description="Fill-up required fields (*) before click the 'Send Email' button "
        :ui="{ footer: 'justify-end' }">
        
        <template #body>
            <div class="py-2">
                <UForm ref="form" :schema="schema" :state="emailObj" class="space-y-4" @submit="onSubmit">
                    <div>
                        <div class="grid grid-cols-4 gap-2">
                            <div class="text-right col-span-1 pt-1">* From:</div>
                            <div class="col-span-3">
                                <UFormField name="from">
                                    <UInput v-model="emailObj.from"
                                        placeholder="From (email address)"
                                        autocomplete="off"
                                        class="w-full"
                                        readonly
                                        disabled
                                    />
                                </UFormField>
                            </div>
                            <div class="text-right col-span-1 pt-1">* To:</div>
                            <div class="col-span-3">
                                <UFormField name="to">
                                    <UInput v-model="emailObj.to"
                                        placeholder="To (email address)"
                                        autocomplete="off"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>
                            <div class="text-right col-span-1 pt-1">* Subject:</div>
                            <div class="col-span-3">
                                <UFormField name="subject">
                                    <UInput v-model="emailObj.subject"
                                        placeholder="Subject"
                                        autocomplete="off"
                                        class="w-full"
                                    />
                                </UFormField>
                            </div>
                            <div class="py-4 col-span-4 h-[200px]">
                                <ClientOnly>
                                    <QuillEditor contentType="html" v-model:content="emailObj.html"
                                        theme="snow" placeholder="Write your message here..." />
                                </ClientOnly>
                            </div>
                            <div id="uploadedFilesContainer" class="col-span-4 mt-6 p-4 rounded-md border">
                                <div class="text-sm mb-2">Attachment Files:</div>
                                <ul id="uploadedFilesList" class="list-disc pl-4 text-red-400" v-if="pdf_name">
                                    <li class="flex items-center space-x-2 mb-1" @click="emits('download')">
                                        <UButton :label="`${pdf_name}.pdf`" class="cursor-pointer" icon="i-lucide-file-text" variant="ghost" />
                                    </li>
                                </ul>
                                <p  v-if="!pdf_name" id="noFilesMessage" class="text-gray-500 text-sm italic">No files uploaded yet.</p>
                            </div>
                        </div>
                    </div>
                </UForm>
            </div>
        </template>

        <template #footer="{ close }">
            <UButton @click="open = false" label="Cancel" color="neutral" variant="outline" />
            <UButton @click="onSendEmail" label="Send Email" icon="i-lucide-send" color="info" />
        </template>
    </UModal>
</template>
