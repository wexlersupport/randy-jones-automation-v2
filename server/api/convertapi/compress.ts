import ConvertAPI from 'convertapi'
import axios from 'axios'
// import getOnedriveAccessToken from '../onedrive/auth';

export default defineEventHandler(async (event) => {
    // const accessToken = await getOnedriveAccessToken()
    // const body = await readBody(event)
    // const { downloadUrl, fileName } = body // sent from client
    const config = useRuntimeConfig()
    const convertApi = new ConvertAPI(config.public?.convertApiSecret)

    try {
        // 1. Download file from Microsoft Graph
        // const response = await axios.get(`https://automationpm-my.sharepoint.com/personal/viacry_automationpm_onmicrosoft_com/_layouts/15/download.aspx?UniqueId=4a43ee2c-a9cf-4cb1-b21a-0875c3e48e61&Translate=false&tempauth=v1.eyJzaXRlaWQiOiI3MTYwNTE0Yi0yYjRlLTQ2OTMtYjc0MS1mNzIwOTc0NzU2MTUiLCJhcHBfZGlzcGxheW5hbWUiOiJSYW5keSBKb25lcyBBdXRvbWF0aW9uIiwibmFtZWlkIjoiMGEzNjZmNDgtNzBhNy00MjEyLWEyNDYtNWY0MGNjODgzN2Y3QDc2OTY4MTkyLTNkN2ItNDk5NC1iZmYxLTdkY2U0MzliOWZlNSIsImF1ZCI6IjAwMDAwMDAzLTAwMDAtMGZmMS1jZTAwLTAwMDAwMDAwMDAwMC9hdXRvbWF0aW9ucG0tbXkuc2hhcmVwb2ludC5jb21ANzY5NjgxOTItM2Q3Yi00OTk0LWJmZjEtN2RjZTQzOWI5ZmU1IiwiZXhwIjoiMTc1ODUyNTI5NSJ9.CkAKDGVudHJhX2NsYWltcxIwQ0pUUXc4WUdFQUFhRmxoTVNuRk9NSGM0V210WGMxTnhObmxUT0ZGSVFVRXFBQT09CjIKCmFjdG9yYXBwaWQSJDAwMDAwMDAzLTAwMDAtMDAwMC1jMDAwLTAwMDAwMDAwMDAwMAoKCgRzbmlkEgI2NBILCJTBqZqs6rw-EAUaDTIwLjE5MC4xNjMuOTYqLGIzUkltU3lvNlBFQVFyNkYvMjdZcjJuZnRIWERMZlhKVllDZm1qOHROVjA9MKsBOAFCEKHII8cwEAAA9Zgb5zdacINKEGhhc2hlZHByb29mdG9rZW56ATG6AagBbXlhcHBmb2xkZXIud3JpdGUgc2VsZWN0ZWRzaXRlcyBmaWxlcy5zZWxlY3RlZG9wZXJhdGlvbnMgYWxsc2l0ZXMucmVhZCBhbGxzaXRlcy53cml0ZSBhbGxzaXRlcy5tYW5hZ2UgYWxsZmlsZXMud3JpdGUgYWxsc2l0ZXMuYXJjaGl2ZSBhbGxmaWxlcy5yZWFkIGFsbHNpdGVzLmZ1bGxjb250cm9syAEB.HCEldlyoydBp117ggOoPWvAzUYN6yrZwfgWPG9YoC-U&ApiVersion=2.0`, {
        //     // responseType: 'arraybuffer',
        //     headers: {
        //         Authorization: `Bearer ${accessToken}`,
        //     },
        // })
        // console.log('Downloaded file size:', response.data)
        // const buffer = Buffer.from(response.data)

        // 2. Compress PDF using ConvertAPI (PDF → PDF with compression)
        // const result = await convertApi.convert('compress', {
        // File: buffer,
        // FileName: fileName,
        // PdfQuality: 'medium' // options: low|medium|high
        // }, 'pdf')
        const result = await convertApi.convert(
            'compress',
            { 
                File: `https://automationpm-my.sharepoint.com/personal/viacry_automationpm_onmicrosoft_com/Documents/6-Annual%20Review%20(AR)/Client%20Review%20Playbook.pdf`,
                PdfQuality: 'medium'
            },
            'pdf'
        )
        // console.log('ConvertAPI result:', result)

        // 3. Get compressed file URL
        // const compressedFile = result
        // console.log('compressedFile:', compressedFile)

        return {
            success: true,
            response: result.files[0]
        }
    } catch (err) {
        console.error(err)
        return { success: false, error: err.message }
    }
})
