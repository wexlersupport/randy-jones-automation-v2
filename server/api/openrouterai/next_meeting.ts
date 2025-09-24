import axios from 'axios'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const openrouterApiKey = config.public.openrouterApiKey
    const body = await readBody(event)
    const parseBody = JSON.parse(body)
    const filterObj = parseBody.filterObj

    try {
        const { data } = await axios.post('https://openrouter.ai/api/v1/chat/completions',
            {
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    {
                        role: "user",
                        content: `
                            Given this meeting summary:

                            "${filterObj.summary_overview}"

                            If a next meeting date/time is mentioned, reply ONLY with the date and time (example: "December 2, 2025 1:00 PM").
                            If there is NO next meeting scheduled, reply ONLY with the word "none".
                            No extra text.
                        `
                    }
                ]
            },
            {
            headers: {
                Authorization: `Bearer ${openrouterApiKey}`,
                'Content-Type': 'application/json',
            }
        })

        return {
            response : data
        }   
    } catch (error: any) {
        return {
            error : error.response.data
        }
    }
})