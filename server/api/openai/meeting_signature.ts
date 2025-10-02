// server/api/openai.post.ts
import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const openaiApiKey = config.public.openaiApiKey; // make sure it's in runtimeConfig, not public
  console.log('openaiApiKey:', openaiApiKey)
  const body = await readBody(event);

  const filterObj = body.filterObj;

  const client = new OpenAI({
    apiKey: openaiApiKey,
  });

  try {
    const response = await client.responses.create({
        model: "gpt-5-nano",
        input: "Write a one-sentence bedtime story about a unicorn."
    });

    return {
      response: response,
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return {
      error: error.response?.data || error.message,
    };
  }
});
