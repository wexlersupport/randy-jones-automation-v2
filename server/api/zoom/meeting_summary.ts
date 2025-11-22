import axios from "axios";
import signatureList from "../../../app/utils/signature-list";
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const ZOOM_BASE_URL = "https://api.zoom.us/v2";

  try {
    const { response }: any = await $fetch(
        "/api/zoom/access_token",
        {
            method: "GET",
            isResponseJson: false
        }
    );
    const accessToken = response?.access_token || null;

    const summaryUrl = `${ZOOM_BASE_URL}/meetings/meeting_summaries`;
    const summaryRes = await axios.get(summaryUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Calculate cutoff date (today - 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    // Filter summaries by summary_created_time
    const recentSummaries = summaryRes.data?.summaries?.filter((s: any) => {
      const created = new Date(s.summary_created_time);
      return created >= cutoffDate;
    });

     const detailedMeetings = await Promise.all(
      recentSummaries?.map(async (m: any) => {
        try {
          // Zoom UUIDs require *double* encoding
          const encodedUuid = encodeURIComponent(encodeURIComponent(m.meeting_uuid));
          const detailUrl = `${ZOOM_BASE_URL}/meetings/${encodedUuid}/meeting_summary`;
          const detailRes = await axios.get(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          let postgre_data: any, person_details: any, signature: any = null;
          const dbRes: any = await $fetch("/api/postgre/dynamic", {
            method: "GET",
            params: {
              table: "zoom_meetings",           // <-- your table name
              isDesc: "true",                   // optional
              dynamic_field1: "meeting_uuid",   // <-- your column name
              value1: m.meeting_uuid,               // raw UUID (recommended)
            },
          });
          // console.log(`DB Response for ${encodedUuid}:`, dbRes.data.length);
          if (dbRes.data.length > 0) {
            postgre_data = dbRes.data[0];
            const pipedriveApiKey = config.public.pipedriveApiKey;
            const response = await axios.get(
              `https://api.pipedrive.com/v1/persons/${postgre_data.person_id}?api_token=${pipedriveApiKey}`
            );
            // console.log('person_details:', response?.data);
            if (response?.data) {
              person_details = response?.data?.data || null;
            }

            const signatureItems = signatureList({ name: '-' });
            signature = signatureItems.find((sig) => sig.value === postgre_data.signature_id);
          }

          return { ...m, detail: detailRes.data, postgre_data, person_details, signature };
        } catch (err: any) {
          console.warn(`Failed to fetch detail for ${m.id}:`, err.response?.data || err.message);
          return { ...m, detail: null };
        }
      })
    );

    return {
      response: detailedMeetings,
    };
  } catch (error: any) {
    console.error("Zoom Meeting Summary Error:", error.response?.data || error.message);
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: "Failed to fetch Zoom meeting summary",
      data: error.response?.data || error.message,
    });
  }
});
