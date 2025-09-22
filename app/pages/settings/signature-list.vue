<script setup lang="ts">
import { ref } from 'vue'

const toast = useToast()

// ✅ Load the data from Postgre
const { data, refresh } = await useFetch('/api/postgre', {
  query: { table: 'signature_lists', isDesc: true },
})
const items = ref<any[]>(data.value?.data || [])

const selectedItem = ref<typeof items.value[0] | null>(null)
const isCreating = ref(false)

function selectItem(item: any) {
  selectedItem.value = { ...item }
  isCreating.value = false
  attachmentTags.value = selectedItem.value.attachment_files
    ? selectedItem.value.attachment_files.split('|').map((s: string) => s.trim())
    : []
}

function newItem() {
  selectedItem.value = {
    id: null,
    label: '',
    html: '',
    value: '',
    subject: '',
    folder_name: '',
    attachment_files: ''   // was []
  }
  isCreating.value = true
}


function toSnakeCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .toLowerCase()
}

const attachmentFilesString = computed({
  get() {
    // Show the pipe-string in the textarea
    return selectedItem.value?.attachment_files || ''
  },
  set(val: string) {
    if (selectedItem.value) {
      // Save exactly as a single TEXT column with pipe separator
      selectedItem.value.attachment_files = val
        .split('|')
        .map(f => f.trim())
        .filter(Boolean)
        .join('|')
    }
  }
})

const attachmentTags = computed<string[]>({
  get() {
    const str = selectedItem.value?.attachment_files || ''
    return str ? str.split('|').map(s => s.trim()) : []
  },
  set(arr: string[]) {
    if (selectedItem.value) {
      selectedItem.value.attachment_files = arr.join('|')
    }
  }
})
console.log('Attachment Tags:', attachmentTags.value)


async function onSave() {
  if (!selectedItem.value) return
  try {
    const payload = {
      ...selectedItem.value,
      attachment_files: selectedItem.value.attachment_files // pipe-separated string
    }

    console.log('Payload to save:', payload)

    if (isCreating.value) {
      await $fetch('/api/postgre', {
        method: 'POST',
        query: { table: 'signature_lists' },
        body: {
          ...payload,
          value: toSnakeCase(payload.label || 'template')
        }
      })
    } else {
      await $fetch('/api/postgre/' + payload.id, {
        method: 'PUT',
        query: {
          table: 'signature_lists',
          dynamic_field: 'id',
          dynamic_value: payload.id
        },
        body: payload
      })
    }

    toast.add({
      description: isCreating.value ? 'Template created!' : 'Successfully saved!',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })
    isCreating.value = false
  } catch (err) {
    console.error('Error saving item:', err)
    toast.add({
      description: 'Error saving template.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

</script>

<template>
  <div class="flex border border-gray-200 dark:border-gray-700 rounded-md max-w-6xl mx-auto mt-8">
    <!-- LEFT PANEL -->
    <div
      class="w-72 border-r border-gray-700 dark:divide-gray-800 rounded-l p-3 bg-gray-50 dark:bg-gray-900 overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">Signature Lists</h2>
        <!-- Uncomment if you want a create button -->
        <!--
        <button
          class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 dark:hover:bg-green-400"
          @click="newItem"
        >
          + New
        </button>
        -->
      </div>

      <ul class="space-y-2">
        <li
          v-for="item in items"
          :key="item.id || item.value"
          class="text-sm p-2 rounded cursor-pointer border border-gray-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900"
          :class="selectedItem?.id === item.id && !isCreating ? 'bg-blue-200 dark:bg-blue-800' : ''"
          @click="selectItem(item)"
        >
          {{ item.label }}
        </li>
      </ul>
    </div>

    <!-- RIGHT PANEL -->
    <div class="flex-1 p-6 overflow-y-auto bg-white dark:bg-gray-900">
      <h2 class="text-lg font-bold mb-4">
        {{ isCreating ? 'Create Template' : 'Details' }}
      </h2>

      <div v-if="selectedItem" class="space-y-4">
        <!-- Name -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Name</label>
          <input
            v-model="selectedItem.label"
            type="text"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- Subject -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Subject</label>
          <input
            v-model="selectedItem.subject"
            type="text"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- Folder Name -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Folder Name</label>
          <input
            v-model="selectedItem.folder_name"
            type="text"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- Attachments -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Attachment Files</label>
          <!-- <textarea
            v-model="attachmentFilesString"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Separate multiple files with commas"
          /> -->
          <USelect
            v-model="attachmentTags"
            :items="attachmentTags.map(tag => ({ label: tag, value: tag }))"
            multiple
            placeholder="Select attachment files"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <!-- HTML Body -->
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Description / HTML</label>
          <ClientOnly>
            <QuillEditor
              contentType="html"
              v-model:content="selectedItem.html"
              theme="snow"
              placeholder="Write your message here..."
            />
          </ClientOnly>
        </div>

        <button
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-400"
          @click="onSave"
        >
          {{ isCreating ? 'Create' : 'Save' }}
        </button>
      </div>

      <div v-else class="text-gray-500 dark:text-gray-400">
        Select an item from the left or create a new one.
      </div>
    </div>
  </div>
</template>
