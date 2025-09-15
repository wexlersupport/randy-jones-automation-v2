<script setup lang="ts">
    const { data } = await useFetch('/api/postgre', {
        query: { table: 'configuration' }
    });
    const scope_of_works = ref<any>()
    const toast = useToast()
    const state = reactive<{ [key: string]: any }>({
        scope_of_works: true,
        fs_x_xsrf_token: '',
        fs_cookie: ''
    })

    onMounted(async () => {
      const config_all: any = data.value?.data
      scope_of_works.value = config_all?.find((item: any) => item.config_key === 'scope_of_works')
      state.scope_of_works = scope_of_works.value.config_value === 'true' ? true : false

      const fs_x_xsrf_token = config_all?.find((item: any) => item.config_key === 'fs_x_xsrf_token')
      state.fs_x_xsrf_token = fs_x_xsrf_token?.config_value

      const fs_cookie = config_all?.find((item: any) => item.config_key === 'fs_cookie')
      state.fs_cookie = fs_cookie?.config_value
    })

    const sections = [{
        title: 'System Configuration',
        description: 'Change any settings will apply immediately.',
        fields: [{
            name: 'scope_of_works',
            label: 'AI generate Scope of Works',
            description: 'System will generate scope of works. Default is enabled.',
            type: 'switch'
          },
          // {
          //     name: 'fs_x_xsrf_token',
          //     label: 'XSRF Token',
          //     description: 'System will saved XSRF token.',
          //     type: 'textarea',
          // },
          // {
          //     name: 'fs_cookie',
          //     label: 'Cookie',
          //     description: 'System will saved Cookie.',
          //     type: 'textarea',
          // }
        ]
    }]

    async function onChange() {
      const config_all: any = data.value?.data
      // console.log(state)
      const update_scope_of_works = await handleApiResponse($fetch('/api/postgre/'+scope_of_works.value.id, {
          query: {
              table: 'configuration',
              dynamic_field: 'id',
              dynamic_value: scope_of_works.value.id
          },
          method: 'PUT',
          body: {
            updated_at: formatJsDateToDatetime(new Date()),
            config_value: state.scope_of_works?.toString()
          }
      }));
      // console.log('updateItem ', updateItem)

      // const fs_x_xsrf_token = config_all?.find((item: any) => item.config_key === 'fs_x_xsrf_token')
      // const update_fs_x_xsrf_token = await handleApiResponse($fetch('/api/postgre/'+fs_x_xsrf_token.id, {
      //     query: {
      //         table: 'configuration',
      //         dynamic_field: 'id',
      //         dynamic_value: fs_x_xsrf_token.id
      //     },
      //     method: 'PUT',
      //     body: {
      //       updated_at: formatJsDateToDatetime(new Date()),
      //       config_value: state.fs_x_xsrf_token?.toString()
      //     }
      // }));
      // // console.log('update_fs_x_xsrf_token ', update_fs_x_xsrf_token)

      // const fs_cookie = config_all?.find((item: any) => item.config_key === 'fs_cookie')
      // const update_fs_cookie = await handleApiResponse($fetch('/api/postgre/'+fs_cookie.id, {
      //     query: {
      //         table: 'configuration',
      //         dynamic_field: 'id',
      //         dynamic_value: fs_cookie.id
      //     },
      //     method: 'PUT',
      //     body: {
      //       updated_at: formatJsDateToDatetime(new Date()),
      //       config_value: state.fs_cookie?.toString()
      //     }
      // }));
      // console.log('update_fs_x_xsrf_token ', update_fs_x_xsrf_token)

      // toast.add({
      //   title: 'Success',
      //   description: `AI generate Scope of Works is now ${state.scope_of_works ? 'enabled' : 'disabled'}!`,
      //   color: 'success'
      // })
      toast.add({
        title: 'Success',
        description: `System Configuration updated successfully!`,
        color: 'success'
      })
    }
</script>

<template>
  <div v-for="(section, index) in sections" :key="index">
    <UPageCard
      :title="section.title"
      :description="section.description"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Save changes"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
        @click="onChange"
      />
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ container: 'divide-y divide-default' }">
      <UFormField
        v-for="field in section.fields"
        :key="field.name"
        :name="field.name"
        :label="field.label"
        :description="field.description"
        :ui="{ container: field.type === 'textarea' ? 'w-full' : '' }"
        class="flex items-center justify-between not-last:pb-4 gap-2"
      >
        <USwitch
          v-if="field.type === 'switch'"
          v-model="state[field.name]"
        />
        <UInput
          v-else-if="field.type === 'input'"
          v-model="state[field.name]"
        />
        <UTextarea
          v-else-if="field.type === 'textarea'"
          v-model="state[field.name]"
          :rows="5"
          autoresize
          class="float-right w-full max-w-[460px]"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
