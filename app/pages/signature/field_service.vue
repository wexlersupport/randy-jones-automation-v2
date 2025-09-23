<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
const { data } = await useFetch('/api/postgre', {
    query: { table: 'configuration' }
});

const toast = useToast()
const loginSchema = z.object({
  Employee: z.string().nonempty('Employee Number is required').min(1, 'Must be at least 1 character'),
  Password: z.string().nonempty('Password is required').min(1, 'Must be at least 1 character')
})
const isLoading = ref<boolean>(false)

type LoginSchema = z.output<typeof loginSchema>
const login = reactive<Partial<LoginSchema>>({
  Employee: undefined,
  Password: undefined
})

const validate = (state: Partial<LoginSchema>): FormError[] => {
  const errors: FormError[] = []
  if (state.Employee && state.Password && state.Employee === state.Password) {
    errors.push({ name: 'Password', message: 'Passwords must be different' })
  }
  return errors
}

async function onSubmit(event: FormSubmitEvent<LoginSchema>) {
  isLoading.value = true

  const config_all: any = data.value?.data
  const res = await fetchFieldServiceLogin()

  if (res?.cookies?.length > 0) {
      const fs_cookie = config_all?.find((item: any) => item.config_key === 'fs_cookie')
      if (res?.cookies[1]) {
          const update_fs_cookie = await handleApiResponse($fetch('/api/postgre/'+fs_cookie.id, {
              query: {
                  table: 'configuration',
                  dynamic_field: 'id',
                  dynamic_value: fs_cookie.id
              },
              method: 'PUT',
              body: {
                  updated_at: formatJsDateToDatetime(new Date()),
                  config_value: res?.cookies[1]?.toString()
              }
          }));
      } else if (res?.cookies[0]) {
          const update_fs_cookie = await handleApiResponse($fetch('/api/postgre/'+fs_cookie.id, {
              query: {
                  table: 'configuration',
                  dynamic_field: 'id',
                  dynamic_value: fs_cookie.id
              },
              method: 'PUT',
              body: {
                  updated_at: formatJsDateToDatetime(new Date()),
                  config_value: res?.cookies[0]?.toString()
              }
          }));
      }
      toast.add({
          title: 'Success',
          description: `Field Service login successful!`,
          color: 'success'
      })
  } else {
      toast.add({
          title: 'Error',
          description: `Field Service login failed!`,
          color: 'error'
      })
  }

  isLoading.value = false
}

async function fetchFieldServiceLogin() {
    const response = await fetch('/api/vista/field_service/login', {
        method: 'POST',
        body: JSON.stringify({
            employee_no: login.Employee,
            password: login.Password
        })
    })
    const res = await response.json()

    return res
  }
</script>

<template>
  <UPageCard
    title="Field Service"
    description="Please login to access field service data."
    variant="subtle"
  >
    <UForm
      :schema="loginSchema"
      :state="login"
      :validate="validate"
      :disabled="isLoading"
      @submit="onSubmit"
      class="flex flex-col gap-4 max-w-xs"
    >
      <UFormField name="Employee">
        <UInput
          v-model="login.Employee"
          type="text"
          placeholder="Employee Number"
          class="w-full"
        />
      </UFormField>

      <UFormField name="Password">
        <UInput
          v-model="login.Password"
          type="password"
          placeholder="Password"
          class="w-full"
        />
      </UFormField>

      <UButton 
        icon="i-lucide-log-in"
        :disabled="isLoading"
        :loading="isLoading"
        label="Login" class="w-fit px-4" type="submit" />
    </UForm>
  </UPageCard>
</template>
