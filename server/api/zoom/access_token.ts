import axios from "axios";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const clientId = config.public.zoomClientId;
  const clientSecret = config.public.zoomClientSecret;
  const accountId = config.public.zoomAccountId;

  // Validate required environment variables
  if (!clientId || !clientSecret || !accountId || 
      clientId === 'your_zoom_client_id_here' || 
      clientSecret === 'your_zoom_client_secret_here' || 
      accountId === 'your_zoom_account_id_here') {
    console.warn("Zoom API credentials not configured. Please set NUXT_PUBLIC_ZOOM_CLIENT_ID, NUXT_PUBLIC_ZOOM_CLIENT_SECRET, and NUXT_PUBLIC_ZOOM_ACCOUNT_ID in your .env file.");
    throw createError({
      statusCode: 400,
      statusMessage: "Zoom API credentials not configured",
      data: "Please configure your Zoom API credentials in the .env file",
    });
  }

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
