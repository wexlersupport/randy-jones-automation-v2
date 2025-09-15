<script setup lang="ts">

    onMounted(async () => {
        const res = await getMeetingSummary()
        console.log(res)
    })

    async function getMeetingSummary() {
        const response = await fetch('/api/zoom/meeting_summary', {
            method: 'POST'
        })
        const res = await response.json()

        return res
    }
</script>

<template>
    <UDashboardPanel id="for-follow-up-index">
        <template #header>
            <UDashboardNavbar title="For Follow Up">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            
        </template>
    </UDashboardPanel>
</template>
