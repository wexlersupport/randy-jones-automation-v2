import { createClient } from "@supabase/supabase-js";

const config = useRuntimeConfig();

const supabaseUrl = config.supabase?.url as string;
const supabaseKey = config.supabase?.key as string;

const supabase = createClient(supabaseUrl, supabaseKey);

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");

  if (!code) {
    return {
      statusCode: 400,
      body: { error: "Missing signature code parameter" },
    };
  }

  const body = await readBody(event);

  if (!body || Object.keys(body).length === 0) {
    return {
      statusCode: 400,
      body: { error: "Missing update data in request body" },
    };
  }

  const { data: existingData, error: selectError } = await supabase
    .from("signatures")
    .select()
    .eq("code", code)
    .single();

  if (selectError) {
    if (selectError.code === "PGRST116") {
      return { statusCode: 404, body: { error: "Signature not found" } };
    }
    return { statusCode: 500, body: { error: selectError.message } };
  }

  const { data, error } = await supabase
    .from("signatures")
    .update(body)
    .eq("code", code)
    .select()
    .single();

  if (error) {
    return { statusCode: 500, body: { error: error.message } };
  }

  return { statusCode: 200, body: { data } };
});
