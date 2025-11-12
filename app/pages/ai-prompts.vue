<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[
  {
    label: 'Summarize',
    icon: 'i-lucide-file-text',
    to: '/ai-prompts/summarize',
    exact: true
  },
  {
    label: 'Merge',
    icon: 'i-lucide-shuffle',
    to: '/ai-prompts',
    exact: true
  },
]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="ai-prompts" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="AI Prompts">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
            <UiAppButtonBack />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-2 lg:gap-6 w-full mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
