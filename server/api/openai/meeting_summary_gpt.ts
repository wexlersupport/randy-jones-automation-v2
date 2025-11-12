import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  // const config = useRuntimeConfig();
  // console.log("process.env:", process.env);
  const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY; // not in public runtime config!
  // console.log("OpenAI API Key:", openaiApiKey);

  const body = await readBody(event);
  const parseBody = JSON.parse(body)
  const filterObj = parseBody.filterObj

  const client = new OpenAI({
    apiKey: openaiApiKey,
  });

  const transcript = filterObj.summary_overview || "";
  let system = `
    You are an AI meeting assistant.
    Summarize the following Zoom meeting in a structured format with:

    - Overview
    - Key Points
    - Decisions
    - Action Items / Next Steps

    Transcript:
    ${transcript}
  `;

  const dbRes: any = await $fetch("/api/postgre/dynamic_field", {
    method: "GET",
    params: {
      table: 'meeting_summary_temp',
      dynamic_field: 'type',
      value: 'ai_summarize',
      isDesc: true
    },
  });
  // console.log(`DB Response for meeting_summary_temp:`, dbRes.data.length);
  if (dbRes?.data?.length > 0) {
    system = dbRes.data[0].meeting_ai_summary;
    system += `

    Transcript:
    ${transcript}
    `;
  }
  // console.log('Using AI Summarize Prompt:', system);

  try {
    
    const response: any = await client.responses.create({
      model: "gpt-4.1-mini",
      input: system,
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
