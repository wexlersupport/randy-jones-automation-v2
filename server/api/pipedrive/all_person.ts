import axios from "axios";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

  try {
    const response = await axios.get(
      `${PIPEDRIVE_BASE_URL}/persons?api_token=${pipedriveApiKey}`
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
