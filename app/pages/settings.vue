<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[{
  label: 'For Follow Up',
  icon: 'i-lucide-send',
  to: '/settings',
  exact: true
}, 
//{
//  label: 'Signatures',
//  icon: 'i-lucide-file-signature',
//  to: '/settings/signature-list',
//  exact: true
//}
// {
//   label: 'Field Service',
//   icon: 'i-lucide-book-open',
//   to: '/settings/field_service',
//   exact: true
// }, {
//   label: 'Members',
//   icon: 'i-lucide-users',
//   to: '/settings/members'
// }, {
//   label: 'Notifications',
//   icon: 'i-lucide-bell',
//   to: '/settings/notifications'
// }, {
//   label: 'Security',
//   icon: 'i-lucide-shield',
//   to: '/settings/security'
// }], [{
//   label: 'Documentation',
//   icon: 'i-lucide-book-open',
//   to: 'https://ui.nuxt.com/getting-started/installation/pro/nuxt',
//   target: '_blank'
// }, {
//   label: 'Buy now',
//   icon: 'i-lucide-shopping-cart',
//   to: 'https://ui.nuxt.com/pro/purchase',
//   target: '_blank'
]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
