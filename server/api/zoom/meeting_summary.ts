import axios from "axios";

export default defineEventHandler(async (event) => {
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

     const detailedMeetings = await Promise.all(
      summaryRes.data?.summaries.map(async (m: any) => {
        try {
          // Zoom UUIDs require *double* encoding
          const encodedUuid = encodeURIComponent(encodeURIComponent(m.meeting_uuid));
          const detailUrl = `${ZOOM_BASE_URL}/meetings/${encodedUuid}/meeting_summary`;
          const detailRes = await axios.get(detailUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          return { ...m, detail: detailRes.data || null };
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
