import { neon } from '@netlify/neon';
import { defineEventHandler, getQuery, readBody, createError } from 'h3';
import axios from 'axios';

export default defineEventHandler(async (event) => {
  const { table, isDesc } = getQuery(event);
  const sql = neon();
  const config = useRuntimeConfig();
  const pipedriveApiKey = config.public.pipedriveApiKey;
  const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1';

  try {
    // 1️⃣ Fetch zoom_meetings from database
    const query = `SELECT * FROM ${table} ORDER BY id ${isDesc ? 'DESC' : 'ASC'} LIMIT 1000`;
    const zoomMeetings = await sql(query);

    // 2️⃣ Enrich each meeting with person data from Pipedrive
    const enrichedMeetings = await Promise.all(
      zoomMeetings.map(async (meeting) => {
        if (!meeting.person_id) return meeting;

        try {
          const response = await axios.get(
            `${PIPEDRIVE_BASE_URL}/persons/${meeting.person_id}?api_token=${pipedriveApiKey}`
          );
          return {
            ...meeting,
            person: response.data?.data || null, // attach person properties
          };
        } catch (err: any) {
          console.error(`Failed to fetch person ${meeting.person_id}:`, err.message);
          return { ...meeting, person: null }; // fallback if Pipedrive fails
        }
      })
    );

    return { data: enrichedMeetings };
  } catch (error: any) {
    console.error(`Error fetching ${table}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch ${table}`,
    });
  }
});
