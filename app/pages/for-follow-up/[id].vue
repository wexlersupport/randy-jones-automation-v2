<script setup lang="ts">
    import { ref } from 'vue'
    import { z } from 'zod'

    const toast = useToast()
    const route = useRoute()
    const router = useRouter()
    const personId = route.params.id as string
    console.log('Person ID:', personId)
    const isLoading = ref(true)
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

    onMounted(async () => {
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

        isLoading.value = false 
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
        console.log('Submitted Data:', form.value)

        const response = await fetch('/api/email/send', {
            method: 'POST',
            body: JSON.stringify({
                emailObj: {
                    from: form.value.from,
                    to: form.value.to,
                    subject: form.value.subject,
                    html: convertHtmlEmail(form.value.generated_email || ''),
                }
            })
        })
        const res = await response.json()
        console.log('res ', res)

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
        console.log('Selected option:', value)
        const _items = signatureList({ name: person.value?.name })
        const selected = _items.find(item => item.value === value);
        console.log('Selected selected:', selected)
        form.value.generated_email = selected?.html || '';
        form.value.subject = selected?.label || '';
    }
</script>

<template>
    <UiAppLoading
        v-if="isLoading"
        class="w-full border rounded-md p-6 my-4 border-neutral-800"
    />
    <UDashboardPanel v-if="!isLoading" id="person-details" :ui="{ body: 'gap-2 sm:gap-2' }">
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
                        <div class="grid grid-cols-1 gap-4">
                            <USelect v-model="selectedOption" :items="items" @update:modelValue="handleChange" />
                            <UInput v-model="form.from" label="From" />
                            <UInput v-model="form.to" label="To" />
                            <UInput v-model="form.subject" label="Subject" />
                            <div class="pb-4 h-[380px]">
                                <ClientOnly>
                                    <QuillEditor contentType="html" v-model:content="form.generated_email"
                                        theme="snow" placeholder="Write your message here..." />
                                </ClientOnly>
                                <span class="text-sm text-gray-500 italic">*Please review the email content before sending. No options to undo once sent.</span>
                            </div>
                        </div>

                        <template #footer>
                            <div class="flex w-full justify-end">
                                <UButton @click="onSubmit" icon="i-lucide-send" size="lg" color="primary" variant="solid">Send Email</UButton>
                            </div>
                        </template>
                    </UCard>
                </UForm>
            </div>
        </template>
    </UDashboardPanel>

</template>
