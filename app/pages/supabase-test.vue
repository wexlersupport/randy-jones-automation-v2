<script setup lang="ts">
const supabase = useSupabaseClient()

const isLoading = ref(false)
const dbResult = ref<any>(null)

const testDatabase = async () => {
  isLoading.value = true
  try {
    // Test basic connection by fetching current timestamp
    const { data, error } = await supabase
      .from('signatures')
      .select('*')
      .limit(1)

    if (error) {
      dbResult.value = { error: error.message }
    } else {
      dbResult.value = { success: true, data }
    }
  } catch (err) {
    dbResult.value = { error: 'Connection test failed', details: err }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="p-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Supabase Test Page</h2>
      </template>

      <div class="space-y-4">
        <!-- Connection Status -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Supabase Client: {{ supabase ? 'Connected' : 'Not Connected' }}
          </p>
        </div>

        <!-- Simple Database Test -->
        <div class="space-y-2">
          <h3 class="font-medium">Database Test</h3>
          <UButton @click="testDatabase" :loading="isLoading" variant="outline">
            Test Database Connection
          </UButton>
          <div v-if="dbResult" class="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            <pre>{{ JSON.stringify(dbResult, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>


