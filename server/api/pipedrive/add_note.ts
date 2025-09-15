import axios from "axios";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

    const body = await readBody(event)
    const parseBody = JSON.parse(body)

    const content = parseBody.ai_summary_overview
    const person_id = parseBody.person_id || 1; // Default to 1 if not provided
    const org_id = parseBody.org_id || 1; // Default to 1 if not provided

  try {
    const response = await axios.post(
      `${PIPEDRIVE_BASE_URL}/notes?api_token=${pipedriveApiKey}`,
      {
        content,
        person_id,
        org_id
      }
    );

    return {
        response : response.data || null
    }

  } catch (error: any) {
    console.error("Zoom API Auth Error:", error.response?.data || error.message);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "Failed to communicate with Zoom API",
      data: error.response?.data || error.message,
    });
  }
});
