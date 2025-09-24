import axios from "axios";
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const personId = parseBody.personId

    try {
      const response = await axios.get(
        `${PIPEDRIVE_BASE_URL}/persons/${personId}?api_token=${pipedriveApiKey}`
      );

      const dbPromise = await sql(`SELECT * FROM zoom_meetings WHERE person_id = $1 ORDER BY created_at DESC`, [personId]);
      const new_response = {
        data: { ...response.data?.data, zoom_meetings: dbPromise }
      }

      return {
          response : new_response
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
