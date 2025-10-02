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
                        You are an AI assistant. 

                        Task:
                        1. Keep the "Meeting Overview" text exactly as provided, without altering or summarizing it.  
                        2. Rewrite the "Email Draft" into a clear, professional, and modern business email.  

                        Output Rules:
                        - Output must be plain email text only.  
                        - Do NOT use markdown formatting (no **bold**, no bullet points, no headings).  
                        - Section titles like "Meeting Summary", "Next Meeting", and "Attached Documents" should appear as plain text on their own line.  
                        - Do NOT add any tags, brackets, or wrappers such as <s>, [OUT], or [/OUT].  
                        - The text must start at the very left margin.  
                        - The email signature (Randy Jones, The Legacy Builder, contact info) must appear **only once, at the very end of the email**.  
                        - Do NOT include the signature anywhere else in the body.  
                        - Do NOT include Subject above the email.
                        - The final structure must always be: Greeting → Body → Meeting Summary/Next Steps/Attached Docs → Closing line → Signature.

                        Meeting Overview (do not modify):
                        ${filterObj.summary_overview}

                        Email Draft (revise into formal email):
                        ${filterObj.email_draft}
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
            error : error.response?.data || error.message
        }
    }
})