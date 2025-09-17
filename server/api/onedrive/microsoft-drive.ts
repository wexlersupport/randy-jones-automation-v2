import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();
    const onedriveTenantId = config.public.onedriveTenantId
    const onedriveAccountId = config.public.onedriveAccountId
    const onedriveClientSecret = config.public.onedriveClientSecret

  try {
    // 1️⃣ Get Access Token
    const tokenRes = await $fetch<any>(
      `https://login.microsoftonline.com/${onedriveTenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        body: new URLSearchParams({
          client_id: onedriveAccountId!,
          client_secret: onedriveClientSecret!,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials'
        }).toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const accessToken = tokenRes.access_token
    if (!accessToken) throw new Error('Failed to get access token')

    // 2️⃣ Call Graph API
    const graphRes = await $fetch<any>(
      `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/drive/root/children`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    return { success: true, response: graphRes.value }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || 'Unknown error' }
  }
})
