import axios from "axios";
import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken()
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const folderId = parseBody.folderId

    try {
      const response = await axios.get(
        `https://graph.microsoft.com/v1.0/users/viacry@automationpm.onmicrosoft.com/drive/items/${folderId}/children`,
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
      console.error("OneDrive API Auth Error:", error.response?.data || error.message);
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: "Failed to communicate with OneDrive API",
        data: error.response?.data || error.message,
      });
    }
});
