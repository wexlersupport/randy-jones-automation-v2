import getOnedriveAccessToken from './auth';

interface DriveResponse {
  success: boolean;
  response?: any;
  error?: string;
}

export default defineEventHandler(async (): Promise<DriveResponse> => {
  const accessToken: string = await getOnedriveAccessToken()
  try {

    const graphRes: any = await $fetch<any>(
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
