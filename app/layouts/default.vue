<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const links = [[
  // {
  //   label: 'Zoom Meetings',
  //   icon: 'i-lucide-video',
  //   to: '/zoom-meetings',
  //   onSelect: () => {
  //     open.value = false
  //   }
  // },
  {
    label: 'For Follow Up',
    icon: 'i-lucide-send',
    to: '/for-follow-up',
    slot: 'for-follow-up-components' as const,
    onSelect: () => {
      open.value = false
    }
  },
  // {
  //   label: 'Client Response',
  //   icon: 'i-lucide-user-check',
  //   to: '/client-response',
  //   onSelect: () => {
  //     open.value = false
  //   }
  // },
],[],
[
  {
  label: 'Signatures',
  icon: 'i-lucide-settings',
  to: '/signature'
},
  // {
  //   label: 'Feedback',
  //   icon: 'i-lucide-message-circle',
  //   to: 'https://github.com/nuxt-ui-pro/dashboard',
  //   target: '_blank'
  // }, {
  //   label: 'Help & Support',
  //   icon: 'i-lucide-info',
  //   to: 'https://github.com/nuxt/ui-pro',
  //   target: '_blank'
  // }
]
] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-pro/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
          class="border-b border-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class=""
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[2]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
