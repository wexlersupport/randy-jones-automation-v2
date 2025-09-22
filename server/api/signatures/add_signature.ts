import { createClient } from "@supabase/supabase-js";
const config = useRuntimeConfig();

const supabaseUrl = config.supabase?.url as string;
const supabaseKey = config.supabase?.key as string;

const supabase = createClient(supabaseUrl, supabaseKey);

export default defineEventHandler(async (event) => {
  if (event.method !== "POST") {
    return { statusCode: 405, body: { error: "Method not allowed" } };
  }

  const body = await readBody(event);
  const { code, name, html_template } = body;

  if (!name || !html_template || !code) {
    return { statusCode: 400, body: { error: "Missing required fields" } };
  }

  const { data: existingData } = await supabase
    .from("signatures")
    .select()
    .eq("code", code)
    .single();

  if (existingData) {
    return {
      statusCode: 409,
      body: { error: "Signature with this code already exists" },
    };
  }

  const { data, error } = await supabase
    .from("signatures")
    .insert([{ code, name, html_template }])
    .select();

  if (error) {
    return { statusCode: 500, body: { error: error.message } };
  }

  return { statusCode: 201, body: { data } };
});
