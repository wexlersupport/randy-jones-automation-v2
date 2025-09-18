import axios from "axios";
import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken()

    try {
      let url = `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/calendars`
      const response = await axios.get(
        url,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return {
          response : response.data || null
      }

    } catch (error: any) {
      console.error("Calendar API Error:", error.response?.data || error.message);
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: "Failed to communicate with Calendar API",
        data: error.response?.data || error.message,
      });
    }
});
