import axios from "axios"

export default defineEventHandler(async (event) => {
  //   const query = getQuery(event)
  const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

  const body = await readBody(event)
  const parseBody = JSON.parse(body)
  console.log('Parsed Body:', parseBody)

  // ✅ Always required
  const config = useRuntimeConfig()
  const pipedriveApiKey = config.public.pipedriveApiKey

  // ✅ Build URLSearchParams with api_token first
  const params = new URLSearchParams({ api_token: pipedriveApiKey })

  // ✅ Append all optional parameters that were passed in
  for (const [key, value] of Object.entries(parseBody)) {
    if (value !== undefined && value !== null && key !== 'api_token') {
      params.append(key, String(value))
    }
  }

  try {
    const response = await axios.get(
      `${PIPEDRIVE_BASE_URL}/notes?${params.toString()}`
    );

    return {
        response : response.data || null
    }
  } catch (err: any) {
    throw createError({
      statusCode: err.response?.status || 500,
      statusMessage: err.message || 'Pipedrive API error'
    })
  }
})
