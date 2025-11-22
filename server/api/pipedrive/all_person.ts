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
    // ---- 2. Fetch Zoom Summaries ----
    const summaryRes = await axios.get(`${ZOOM_BASE_URL}/meetings/meeting_summaries`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Cutoff: 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    // Filter Zoom summaries
    const recentSummaries = summaryRes.data?.summaries?.filter((s: any) => {
      const created = new Date(s.summary_created_time);
      return created >= cutoffDate;
    }) || [];
    // Extract UUIDs to match PostgreSQL rows
    const recentUUIDs = recentSummaries.map((s: any) => s.meeting_uuid);

    const response = await axios.get(
      `${PIPEDRIVE_BASE_URL}/persons?api_token=${pipedriveApiKey}`
    );
    const persons = response.data?.data || [];

    const results = await Promise.all(
      persons.map(async (person: any) => {
        const query = `SELECT * FROM zoom_meetings WHERE person_id = $1 ORDER BY created_at DESC`;
        const rows = await sql(query, [person.id]);
        // ---- Filter rows based on recent Zoom summaries ----
        const filteredRows = rows.filter((r: any) =>
          recentUUIDs.includes(r.meeting_uuid)
        );

        let detailRes: any = null;
        if (filteredRows.length > 0) {
          const encodedUuid = encodeURIComponent(encodeURIComponent(filteredRows[0]?.meeting_uuid));
          detailRes = await axios.get(`${ZOOM_BASE_URL}/meetings/${encodedUuid}/meeting_summary`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        }

        return {
          ...person,
          zoom_meetings: filteredRows || null,
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
