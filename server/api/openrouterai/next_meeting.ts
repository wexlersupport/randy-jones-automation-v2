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
                        when is next meeting based on this meeting summary, result is one sentence only and date only:

                        ${filterObj.summary_overview}
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