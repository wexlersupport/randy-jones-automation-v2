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

    return {
      response: summaryRes.data,
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
