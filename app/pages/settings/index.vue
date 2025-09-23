<script setup lang="ts">
import { ref } from 'vue'

const toast = useToast()
const { data, refresh } = await useFetch('/api/postgre', {
  query: { table: 'for_follow_up_templates' },
});
const items = ref<any[]>(data.value?.data || [])

const selectedItem = ref<typeof items.value[0] | null>(null)
const isCreating = ref(false)

function selectItem(item: any) {
  selectedItem.value = { ...item } // shallow copy to avoid direct mutation
  isCreating.value = false
}

function newItem() {
  selectedItem.value = {
    label: '',
    html: '',
  }
  isCreating.value = true
}

function toSnakeCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2') // handle camelCase → camel_Case
    .replace(/\s+/g, '_')                // spaces → _
    .replace(/-+/g, '_')                 // dashes → _
    .toLowerCase();
}

/** Save changes or create new */
async function onSave() {
  if (!selectedItem.value) return

  try {
    if (isCreating.value) {
      // 👉 CREATE
      const res = await $fetch('/api/postgre', {
        method: 'POST',
        query: {
          table: 'for_follow_up_templates'
        },
        body: {
          label: selectedItem.value.label,
          html: selectedItem.value.html,
          value: toSnakeCase(selectedItem.value.label || 'template')
        }
      })
      toast.add({
        description: 'Template created!',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    } else {
      // 👉 UPDATE
      await $fetch('/api/postgre/' + selectedItem.value.id, {
        method: 'PUT',
        query: {
          table: 'for_follow_up_templates',
          dynamic_field: 'id',
          dynamic_value: selectedItem.value.id
        },
        body: {
          label: selectedItem.value.label,
          html: selectedItem.value.html,
        },
      })
      toast.add({
        description: 'Successfully saved!',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }

    // refresh list and reselect updated/new item
    await refresh()
    items.value = data.value?.data || []

    if (!isCreating.value) {
      // find updated item by id
      const updated = items.value.find(i => i.id === selectedItem.value?.id)
      if (updated) selectItem(updated)
    } else {
      // pick the latest (assuming isDesc)
      if (items.value[0]) selectItem(items.value[0])
      isCreating.value = false
    }
  } catch (error) {
    console.error('Error saving item:', error)
    toast.add({
      description: 'Error saving template.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

/** Delete selected item */
async function onDelete() {
  if (!selectedItem.value || isCreating.value) return

  try {
    await $fetch('/api/postgre/' + selectedItem.value.id, {
      method: 'DELETE',
      query: {
        table: 'for_follow_up_templates',
        dynamic_field: 'id',
        dynamic_value: selectedItem.value.id
      }
    })
    toast.add({
      description: 'Template deleted!',
      icon: 'i-lucide-check-circle',
      color: 'success'
    })

    // refresh list and clear selection
    await refresh()
    items.value = data.value?.data || []
    selectedItem.value = null
    isCreating.value = false
  } catch (error) {
    console.error('Error deleting item:', error)
    toast.add({
      description: 'Error deleting template.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex border max-h-[90vh] border-gray-200 dark:border-gray-700 rounded-md max-w-4xl">
    <!-- LEFT PANEL -->
    <div
      class="w-75 border-r border-gray-700 dark:divide-gray-800 border rounded p-3 bg-gray-50 dark:bg-gray-900 overflow-y-auto"
    >
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">Signature Lists</h2>
        <button
          class="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 dark:hover:bg-green-400"
          @click="newItem"
        >
          + New
        </button>
      </div>

      <ul class="space-y-2 max-h-[80vh] overflow-y-auto">
        <li
          v-for="item in items"
          :key="item.value"
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
        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Name</label>
          <input
            v-model="selectedItem.label"
            type="text"
            class="mt-1 w-full border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 dark:text-gray-300">Description</label>
          <ClientOnly>
            <QuillEditor
              :key="isCreating ? 'new-item' : selectedItem?.id"
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

        <button
          class="px-4 py-2 ml-2 bg-red-500 text-white rounded hover:bg-red-600 dark:hover:bg-red-400"
          v-if="!isCreating"
          @click="onDelete"
        >
          Delete
        </button>


      </div>

      <div v-else class="text-gray-500 dark:text-gray-400">
        Select an item from the left or create a new one.
      </div>
    </div>
  </div>
</template>
