import axios from "axios";
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const ZOOM_BASE_URL = "https://api.zoom.us/v2";
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

  try {
    const { response: zoom_auth }: any = await $fetch(
        "/api/zoom/access_token",
        {
            method: "GET",
            isResponseJson: false
        }
    );
    const accessToken = zoom_auth?.access_token || null;

    const response = await axios.get(
      `${PIPEDRIVE_BASE_URL}/persons?api_token=${pipedriveApiKey}`
    );
    const persons = response.data?.data || [];

    const results = await Promise.all(
      persons.map(async (person: any) => {
        const query = `SELECT * FROM zoom_meetings WHERE person_id = $1 ORDER BY created_at DESC`;
        const rows = await sql(query, [person.id]);

        let detailRes: any = null;
        if (rows.length > 0) {
          const meeting_uuid = rows.length > 0 ? rows[0].meeting_uuid : null;
          const encodedUuid = encodeURIComponent(encodeURIComponent(meeting_uuid));
          const detailUrl = `${ZOOM_BASE_URL}/meetings/${encodedUuid}/meeting_summary`;
          detailRes = await axios.get(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }

        return {
          ...person,
          zoom_meetings: rows || null, // attach DB row if found
          zoom_summary: detailRes?.data || null
        };
      })
    );

    return {
        response: results || null
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
