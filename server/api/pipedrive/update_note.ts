import axios from "axios";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const content = parseBody.new_note
    const noteId = parseBody.id; // Note ID to update

  try {
    const response = await axios.put(
      `${PIPEDRIVE_BASE_URL}/notes/${noteId}?api_token=${pipedriveApiKey}`,
      {
        content
      }
    );

    return {
        response : response.data || null
    }
  } catch (error: any) {
    console.error("Pipedrive API Auth Error:", error.response?.data || error.message);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "Failed to communicate with Pipedrive API",
      data: error.response?.data || error.message,
    });
  }
});
