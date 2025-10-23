import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  console.log("Runtime Config:", config.public);
  const openaiApiKey = process.env.NUXT_PUBLIC_OPENAI_API_KEY || config.public.openaiApiKey; // not in public runtime config!
  console.log("OpenAI API Key:", openaiApiKey);

  const body = await readBody(event);
  const parseBody = JSON.parse(body)
  const filterObj = parseBody.filterObj

  const client = new OpenAI({
    apiKey: openaiApiKey,
  });

  try {
    const transcript = filterObj.summary_overview || "";
    const response: any = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
            You are an AI meeting assistant.
            Summarize the following Zoom meeting in a structured format with:

            - Overview
            - Key Points
            - Decisions
            - Action Items / Next Steps

            Transcript:
            ${transcript}
        `,
    });

    return {
      data: response ?? null,
      response: response ? response.output_text : transcript,
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return {
      error: error.response?.data || error.message,
    };
  }
});
