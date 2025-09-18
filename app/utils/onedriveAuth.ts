// server/utils/onedriveAuth.ts
import { useRuntimeConfig } from '#imports'

export async function getOnedriveAccessToken(): Promise<string> {
  const config = useRuntimeConfig()
  const tenantId = config.public.onedriveTenantId
  const clientId = config.public.onedriveAccountId
  const clientSecret = config.public.onedriveClientSecret

  const tokenRes = await $fetch<any>(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  if (!tokenRes.access_token) {
    throw new Error('Failed to get OneDrive access token')
  }

  return tokenRes.access_token
}
