import axios from "axios";
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pipedriveApiKey = config.public.pipedriveApiKey;
    const PIPEDRIVE_BASE_URL = "https://api.pipedrive.com/v1";

  try {
    const response = await axios.get(
      `${PIPEDRIVE_BASE_URL}/persons?api_token=${pipedriveApiKey}`
    );
    // console.log("Pipedrive Persons Response:", response.data?.data);
    const persons = response.data?.data || [];

    // 2️⃣ For each person, fetch PostgreSQL data by person.id
    //    (assuming your PostgreSQL table has a column like person_id)
    const results = await Promise.all(
      persons.map(async (person: any) => {
        const query = `SELECT * FROM zoom_meetings WHERE person_id = $1 ORDER BY created_at DESC`;
        const rows = await sql(query, [person.id]);
        return {
          ...person,
          zoom_meetings: rows || null, // attach DB row if found
        };
      })
    );
    // console.log("Combined Results:", results);

    return {
        response: results || null
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
