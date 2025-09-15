import axios from "axios";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const clientId = config.public.zoomClientId;
  const clientSecret = config.public.zoomClientSecret;
  const accountId = config.public.zoomAccountId;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const tokenRes = await axios.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {},
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return {
        response : tokenRes.data || null
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
