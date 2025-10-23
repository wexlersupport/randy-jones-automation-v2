// server/api/openai/meeting_merge_gpt.ts
import OpenAI from "openai";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const openaiApiKey = config.public.openaiApiKey as string | undefined; // not in public runtime config!

  const body = await readBody(event); // already an object if JSON
  const parseBody = JSON.parse(body)
  const {summary_overview, email_draft} = parseBody.filterObj

  const client = new OpenAI({ apiKey: openaiApiKey });

  const system = `
    You merge a meeting summary and a signature into one client-facing email.
    Keep the tone warm and professional (Randy’s style).

    Rules:
    - Write only ONE greeting at the top (e.g., "Hi Juan,") — never repeat it.
    - Merge the content naturally; do not restate or duplicate any sections or greetings from the signature.
    - Include: brief overview, key points, decisions, next steps, and then close with Randy’s full signature.
    - Keep all formatting clean and consistent with clear headings and bullet points.
    - Use specific dates/times and no em dashes.
    - Return only the complete email body (no subject line or title).
    - Ensure Randy's signature appears only once at the very end of the email.
  `;

  const user = `
    MEETING_SUMMARY:
    ${summary_overview}

    SIGNATURE:
    ${email_draft}
  `;

  try {
    const response: any = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    return {
      data: response ?? null,
      response: response ? response.output_text : summary_overview,
    };
  } catch (error: any) {
    console.error("OpenAI error:", error);
    return {
      error: true,
      message: error.response?.data || error.message,
    };
  }
});
