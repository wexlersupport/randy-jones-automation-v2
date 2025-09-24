export default async function getOnedriveAccessToken(): Promise<string> {
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

    const accessToken: string = tokenRes.access_token

    return accessToken
  } catch (error: any) {
    console.error(error)
    throw new Error(error.message || 'Failed to get access token')
  }
}
