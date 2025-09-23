import path from 'path'
import ConvertAPI from 'convertapi'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const convertapiSecretKey = config.public.convertapiSecretKey;
  try {
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const fileUrl: string = parseBody.file_url
    const fileName: string = parseBody.file_name || 'compressed_file.pdf'

    if (!fileUrl) {
      throw new Error('Missing file URL')
    }

    // 🔹 Detect extension (from file_name if given, else from file_url)
    const cleanUrl: any = fileUrl.split('?')[0]
    const extFromUrl = path.extname(cleanUrl).slice(1).toLowerCase()
    const extFromName = path.extname(fileName).slice(1).toLowerCase()
    const inputFormat = extFromName || extFromUrl || 'pdf'

    const compressibleFormats = ['pdf', 'jpg', 'png', 'tiff']
    if (!compressibleFormats.includes(inputFormat)) {
      return { success: false, error: 'Unsupported file format for compression: ' + inputFormat }
    }

    const convertapi = new ConvertAPI(convertapiSecretKey)
    const { response }: any = await convertapi.convert(
      'compress',
      {
        File: fileUrl,
        Quality: 70,
        StoreFile: true,           // ensures ConvertAPI hosts the result
        FileName: path.basename(fileName, path.extname(fileName)), // name w/out extension
      },
      inputFormat
    )

    // ConvertAPI gives you a direct URL for the new file
    // const compressedUrl = response.Files[0].Url
    return { success: true, data: response?.Files[0] }
  } catch (err: any) {
    console.error(err)
    return { success: false, error: err.message }
  }
})
