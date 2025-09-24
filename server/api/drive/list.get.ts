import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { defineEventHandler } from 'h3'

export default defineEventHandler(async () => {
  try {
    const config = useRuntimeConfig();
    const googlePrivateKey: any = config.public.googlePrivateKey
    const privateKey = googlePrivateKey.replace(/\\n/g, '\n') // important!

    // 2️⃣ Create a JWT Client
    const auth = new google.auth.JWT({
        email: "test-service-account@third-opus-472305-r8.iam.gserviceaccount.com",
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive']
    })

    // 3️⃣ Authorize & Get Token
    await auth.authorize()

    // 4️⃣ Create Drive Client
    const drive = google.drive({ version: 'v3', auth })

    // 5️⃣ Example: List first 100 files
    const folderId = '1I-9AN_RPqx2b-8Pstjn4Raa0kQbA9qHr' // replace with your folder ID
    const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink)',
        pageSize: 100,
    })

    return {
      success: true,
      files: res.data.files,
    }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
})
