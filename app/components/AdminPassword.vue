<script setup lang="ts">
const emit = defineEmits(['authorized'])

const toast = useToast()
const adminPassword = ref('')
const correctPassword = ref('')
const aiPassword = ref<any>(null)

const newPassword = ref('')
const confirmPassword = ref('')
const oldPassword = ref('')
const showChangePassword = ref(false)

onMounted(async () => {
  const { data }: any = await $fetch('/api/postgre/dynamic', {
    query: {
      table: 'meeting_summary_temp',
      isDesc: true,
      dynamic_field1: 'type',
      value1: 'ai_password'
    }
  })

  aiPassword.value = data[0] || null
  correctPassword.value = aiPassword.value?.openid_id || ''
})

const verifyPassword = () => {
  if (adminPassword.value === correctPassword.value) {
    emit('authorized')
    toast.add({
      title: 'Access Granted',
      description: 'Admin permissions unlocked.',
      icon: 'i-lucide-lock-open',
      color: 'success'
    })
  } else {
    toast.add({
      title: 'Invalid Password',
      description: 'Incorrect password.',
      icon: 'i-lucide-alert-triangle',
      color: 'error'
    })
  }
}

const updatePassword = async () => {
  if (oldPassword.value !== correctPassword.value) {
    toast.add({
      title: 'Incorrect Old Password',
      description: 'Old password incorrect.',
      icon: 'i-lucide-alert-triangle',
      color: 'error'
    })
    return
  }

  if (newPassword.value.length < 4) {
    toast.add({
      title: 'Password too short',
      description: 'Minimum 4 characters required.',
      icon: 'i-lucide-alert-triangle',
      color: 'error'
    })
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.add({
      title: 'Password mismatch',
      description: 'New password and confirmation do not match.',
      icon: 'i-lucide-alert-triangle',
      color: 'error'
    })
    return
  }

  await $fetch('/api/postgre/' + aiPassword.value.id, {
    method: 'PUT',
    query: {
      table: 'meeting_summary_temp',
      dynamic_field: 'id',
      dynamic_value: aiPassword.value.id
    },
    body: {
      openid_id: newPassword.value,
      created_at: new Date().toISOString()
    }
  })

  correctPassword.value = newPassword.value

  toast.add({
    title: 'Password Updated',
    description: 'Admin password updated successfully.',
    icon: 'i-lucide-check-circle',
    color: 'success'
  })

  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  showChangePassword.value = false
}
</script>

<template>
  <div class="space-y-3">

    <!-- PASSWORD INPUT -->
    <div class="flex items-center gap-3">
      <UInput
        v-model="adminPassword"
        type="password"
        placeholder="Enter admin password"
      />

      <UButton icon="i-lucide-lock" color="info" @click="verifyPassword">
        Unlock
      </UButton>

      <UButton
        v-if="correctPassword"
        icon="i-lucide-key"
        color="neutral"
        @click="showChangePassword = !showChangePassword"
      >
        {{ showChangePassword ? 'Hide' : 'Change Password' }}
      </UButton>
    </div>

    <!-- CHANGE PASSWORD -->
    <div
      v-if="showChangePassword"
      class="p-4 border rounded-md border-neutral-700 bg-neutral-900 flex gap-3"
    >
      <UInput v-model="oldPassword" type="password" placeholder="Old password" />
      <UInput v-model="newPassword" type="password" placeholder="New password" />
      <UInput v-model="confirmPassword" type="password" placeholder="Confirm password" />

      <UButton class="w-fit" color="warning" icon="i-lucide-key" @click="updatePassword">
        Update Password
      </UButton>
    </div>

  </div>
</template>
