import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parseBody = JSON.parse(body)
  const { file_id } = parseBody.filesObj

  if (!file_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields'
    })
  }

    const config = useRuntimeConfig();
    // console.log('Runtime Config loaded', config)
    const googlePrivateKey: any = config.public.googlePrivateKey
    const privateKey = googlePrivateKey.replace(/\\n/g, '\n') // important!
    // console.log('Service Account Key loaded', googlePrivateKey)

  try {
    // 🔑 Authenticate with service account
    const auth = new google.auth.JWT({
        email: "test-service-account@third-opus-472305-r8.iam.gserviceaccount.com",
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive']
    })
    await auth.authorize()

    const drive = google.drive({ version: 'v3', auth })

    // 1️⃣ Download file as ArrayBuffer
    const res = await drive.files.get(
        { fileId: file_id, alt: 'media' },
        { responseType: 'arraybuffer' }
    )

    const pdfBuffer = Buffer.from(res.data as ArrayBuffer)

    // ✅ Convert Buffer to Base64 string
    const pdfBase64 = pdfBuffer.toString('base64')

    return {
        response: pdfBase64
    }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
})
