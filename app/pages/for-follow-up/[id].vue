<script setup lang="ts">
    import { is } from 'valibot'
    import { ref } from 'vue'
    import { z } from 'zod'

    const toast = useToast()
    const route = useRoute()
    const router = useRouter()
    const personId = route.params.id as string
    // console.log('Person ID:', personId)
    const isLoading = ref(true)
    const isLoadingSave = ref(false)
    const person = ref<any>({})
    const selectedOption = ref('a-qc');
    const items = ref<any[]>([]);
    const schema = z.object({
        id: z.number(),
        name: z.string(),
        org_name: z.string(),
        primary_email: z.string().email(),
        add_time: z.string(),
        owner_name: z.string().optional(),
        generated_email: z.string().optional(),
        from: z.string(),
        to: z.string(),
        subject: z.string(),
    })
    const { data }: any = await useFetch('/api/drive/list')
    console.log('Drive List Data:', data.value)
    const attachmentList = ref<any[]>(data.value?.files || [])
    const selectedAttachment = ref<any[]>([]);
    // const { data: file }: any = await useFetch('/api/drive/get_files')
    // console.log('Drive File Data:', file.value)
    const folderList = ref<any[]>([]);
    const selectedFolder = ref<any>(null);


    onMounted(async () => {
        // const test = await getDriveFolder()
        // console.log('OneDrive folder info:', test)

        const { response } = await getPersonDetail()
        person.value = response?.data || {}
        console.log('Fetched data:', person.value)
        items.value = signatureList({ name: person.value?.name })
        form.value.id = person.value.id
        form.value.name = person.value.name
        form.value.org_name = person.value.org_name
        form.value.primary_email = person.value.primary_email
        form.value.add_time = person.value.add_time
        form.value.owner_name = `Contact By ${person.value?.owner_name}`
        form.value.generated_email = items.value[0]?.html || ''
        form.value.to = person.value.primary_email
        form.value.subject = items.value[0]?.label || ''

        setTimeout(() => {
            isLoading.value = false
        }, 1000)
    })

    const form = ref({
        id: '',
        name: '',
        org_name: '',
        primary_email: '',
        add_time: '',
        owner_name: '',
        generated_email: '',
        from: 'francis.regala@strattonstudiogames.com',
        to: '',
        subject: '',
    })

    async function onSubmit() {
        isLoadingSave.value = true
        // console.log('Submitted Data:', form.value)

        let attachments: any[] = []
        if (selectedAttachment.value.length) {
            selectedAttachment.value.forEach((file_id: any) => {
                const foundFile = attachmentList.value.find((file: any) => file.id === file_id)
                if (foundFile) {
                    attachments.push({
                        content: foundFile.base64String,
                        filename: foundFile.name,
                        type: "text/html",
                        encoding: "base64",
                        disposition: "attachment"
                    })
                }
            })
        }
        // console.log('Attachments:', attachments)        

        const response = await fetch('/api/email/send', {
            method: 'POST',
            body: JSON.stringify({
                emailObj: {
                    attachments,
                    from: form.value.from,
                    to: form.value.to,
                    subject: form.value.subject,
                    html: convertHtmlEmail(form.value.generated_email || ''),
                }
            })
        })
        const res = await response.json()
        // console.log('Email Send Response:', res)

        if (res?.accepted?.length > 0) {
            toast.add({
                title: 'Email sent successfully',
                description: 'The email has been sent successfully.',
                color: 'success'
            })

            // setTimeout(() => {
            //     router.back()
            // }, 1000)
        } else {
            toast.add({
                title: 'Error',
                description: 'There was an error sending the email. Please try again.',
                color: 'error'
            })
        }

        setTimeout(() => {
            isLoadingSave.value = false
        }, 1000);
    }

    async function getPersonDetail() {
        const response = await fetch('/api/pipedrive/get_person', {
            method: 'POST',
            body: JSON.stringify({personId})
        })
        const res = await response.json()

        return res
    }

    async function handleChange(value: any) {
        const _items = signatureList({ name: person.value?.name })
        const selected = _items.find(item => item.value === value);
        form.value.generated_email = selected?.html || '';
        form.value.subject = selected?.label || '';
    }

    async function handleSelectAttachment(value: any) {
        isLoadingSave.value = true

        const file_id = selectedAttachment.value[selectedAttachment.value?.length - 1]
        const findIndex = attachmentList.value.findIndex((file: any) => file.id === file_id)

        if (selectedAttachment.value.length === 0 || !file_id || findIndex === -1) {
            return
        }

        const responseFiles = await fetch('/api/drive/get_files', {
            method: 'POST',
            body: JSON.stringify({
                filesObj: { file_id }
            })
        })
        const {response: base64String} = await responseFiles.json()

        attachmentList.value[findIndex].base64String = base64String
        // console.log('attachmentList.value ', attachmentList.value)

        setTimeout(() => {
            isLoadingSave.value = false
        }, 500);
    }

    async function getDriveFolder() {
        const response = await fetch('/api/onedrive/microsoft-drive', {
            method: 'POST'
        })
        const res = await response.json()

        return res
    }

</script>

<template>
    <UiAppLoading
        v-if="isLoading"
        class="w-full border rounded-md p-6 my-4 border-neutral-800"
    />
    <UDashboardPanel v-if="!isLoading" id="person-details" :ui="{ body: 'gap-2 sm:gap-2 h-full' }">
        <template #header>
            <UDashboardNavbar title="Person Details">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
                <template #right>
                    <UiAppButtonBack />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <div class="p-6 space-y-8">
                <UForm :state="form" :schema="schema" @submit="onSubmit" class="space-x-6 flex">
                    <!-- Summary Info -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Person Details</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-4">
                            <UInput v-model="form.name" label="Person Name" />
                            <UInput v-model="form.primary_email" label="Primary Email" />
                            <UInput v-model="form.org_name" label="Organization Name" />
                            <UTextarea v-model="form.owner_name" label="Contact By" :rows="15" />
                        </div>
                    </UCard>

                    <!-- Summary Details (Array) -->
                    <UCard class="w-full">
                        <template #header>
                            <h2 class="text-lg font-semibold">Auto-Generated Email</h2>
                        </template>
                        <div class="grid grid-cols-1 gap-2">
                            <USelect v-model="selectedOption" :items="items" @update:modelValue="handleChange" />
                            <UInput v-model="form.from" label="From" />
                            <UInput v-model="form.to" label="To" />
                            <UInput v-model="form.subject" label="Subject" />
                            <div class="w-full space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto">OneDrive Folder:</label>
                                <USelect
                                    v-model="selectedFolder"
                                    multiple
                                    :items="folderList.map(item => ({ value: item.id, label: item.name }))"
                                    placeholder="Choose folder"
                                    class="w-full"
                                     @update:modelValue="handleSelectAttachment"
                                />
                            </div>
                            <div class="w-full space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto">OneDrive Files:</label>
                                <USelect
                                    v-model="selectedAttachment"
                                    multiple
                                    :items="attachmentList.map(item => ({ value: item.id, label: item.name }))"
                                    placeholder="Choose one or more attachments"
                                    class="w-full"
                                     @update:modelValue="handleSelectAttachment"
                                />
                            </div>
                            <!-- Selected Files Layout -->
                            <div v-if="selectedAttachment.length" class="space-y-2">
                                <label class="block text-sm font-medium w-50 my-auto">Selected Attachments:</label>

                                <ul class="divide-y divide-gray-200 dark:divide-gray-800 border rounded p-3 
                                            bg-gray-50 dark:bg-gray-900">
                                    <li
                                    v-for="file in attachmentList.filter(f => selectedAttachment.includes(f.id))"
                                    :key="file.id"
                                    class="py-2 flex items-center justify-between text-sm"
                                    >
                                    <div class="flex items-center gap-2">
                                        <UIcon name="i-lucide-files" class="size-5 text-red-400" />
                                        <span class="text-sm text-gray-700 dark:text-gray-200">{{ file.name }}</span>
                                    </div>
                                    <span class="text-gray-500 dark:text-gray-400 text-xs">
                                        <UIcon name="i-lucide-check-circle" class="size-3 text-green-600" />
                                    </span>
                                    </li>
                                </ul>
                            </div>
                            <div class="mb-4 h-[360px]">
                                <ClientOnly>
                                    <QuillEditor contentType="html" v-model:content="form.generated_email"
                                        theme="snow" placeholder="Write your message here..." />
                                </ClientOnly>
                                <span class="text-sm text-gray-500 italic">*Please review the email content before sending. No options to undo once sent.</span>
                            </div>
                        </div>

                        <template #footer>
                            <div class="flex w-full justify-end">
                                <UButton @click="onSubmit" :disabled="isLoadingSave" :loading="isLoadingSave" icon="i-lucide-send" size="lg" color="primary" variant="solid">Send Email</UButton>
                            </div>
                        </template>
                    </UCard>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
