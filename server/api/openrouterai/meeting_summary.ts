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
                        You are an AI assistant. Summarize the following meeting overview into a clear, structured summary. 
                        Highlight key discussion points, decisions made, and next action items. 
                        Keep it concise and easy to read.

                        Meeting Overview: ${filterObj.summary_overview}

                        Meeting Next Steps: ${filterObj.next_steps || "No next steps available."}
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