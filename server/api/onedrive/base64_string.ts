import axios from "axios";
import getOnedriveAccessToken from './auth';

export default defineEventHandler(async (event) => {
    const accessToken = await getOnedriveAccessToken()
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const fileUrl = parseBody.file_url

    try {
      // const response = await axios.get(
      //   `https://automationpm-my.sharepoint.com/personal/viacry_automationpm_onmicrosoft_com/_layouts/15/download.aspx?UniqueId=c87caaba-5c62-4b78-9b2f-8b3b055ec165&Translate=false&tempauth=v1.eyJzaXRlaWQiOiI3MTYwNTE0Yi0yYjRlLTQ2OTMtYjc0MS1mNzIwOTc0NzU2MTUiLCJhcHBfZGlzcGxheW5hbWUiOiJSYW5keSBKb25lcyBBdXRvbWF0aW9uIiwibmFtZWlkIjoiMGEzNjZmNDgtNzBhNy00MjEyLWEyNDYtNWY0MGNjODgzN2Y3QDc2OTY4MTkyLTNkN2ItNDk5NC1iZmYxLTdkY2U0MzliOWZlNSIsImF1ZCI6IjAwMDAwMDAzLTAwMDAtMGZmMS1jZTAwLTAwMDAwMDAwMDAwMC9hdXRvbWF0aW9ucG0tbXkuc2hhcmVwb2ludC5jb21ANzY5NjgxOTItM2Q3Yi00OTk0LWJmZjEtN2RjZTQzOWI5ZmU1IiwiZXhwIjoiMTc1ODExNjIyOSJ9.CkAKDGVudHJhX2NsYWltcxIwQ01IVXFzWUdFQUFhRmpoa1VWQnViV3RsVmpCNVdqbEhObXQ2VjNObVFXY3FBQT09CjIKCmFjdG9yYXBwaWQSJDAwMDAwMDAzLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMAoKCgRzbmlkEgI2NBILCJ60z7We_Lo-EAUaDDQwLjEyNi4zNS44OCosUVhOeDFvWXBLdVhaZXF1czBEMnhnTmpURGJyRFNlcEFyS3pTTFBKN3Bucz0wqwE4AUIQocadqY2gAAD1-me-BSpDrEoQaGFzaGVkcHJvb2Z0b2tlbnoBMboBqAFteWFwcGZvbGRlci53cml0ZSBzZWxlY3RlZHNpdGVzIGZpbGVzLnNlbGVjdGVkb3BlcmF0aW9ucyBhbGxzaXRlcy5yZWFkIGFsbHNpdGVzLndyaXRlIGFsbHNpdGVzLm1hbmFnZSBhbGxmaWxlcy53cml0ZSBhbGxzaXRlcy5hcmNoaXZlIGFsbGZpbGVzLnJlYWQgYWxsc2l0ZXMuZnVsbGNvbnRyb2zIAQE.nQyiPvsQwA-nl5Upjdx5k_5IXL5yXtYiYN2XXkxuPaw&ApiVersion=2.0`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${accessToken}`
      //     }
      //   }
      // );


      // return {
      //     response : response.data || null
      // }
      const res = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`)
      }

      const buffer = await res.arrayBuffer()

      // 2️⃣ Convert to Base64
      const base64String = Buffer.from(buffer).toString('base64')

      return {
        response: base64String,
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
