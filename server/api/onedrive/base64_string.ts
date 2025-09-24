import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken()
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const fileUrl = parseBody.file_url

    try {
      const res = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`)
      }

      const buffer = await res.arrayBuffer()

      // 2️⃣ Convert to Base64
      const base64String = Buffer.from(buffer).toString('base64')

      return {
        response: base64String,
      }

    } catch (error: any) {
      console.error("base64String API  Error:", error.response?.data || error.message);
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: "Failed to communicate with base64String API",
        data: error.response?.data || error.message,
      });
    }
});
