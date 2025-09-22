import { createClient } from "@supabase/supabase-js";

const config = useRuntimeConfig();

const supabaseUrl = config.public.supabase?.url
const supabaseKey = config.public.supabase?.key

const supabase = createClient(supabaseUrl, supabaseKey);

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");

  if (!code) {
    return {
      statusCode: 400,
      body: { error: "Missing signature code parameter" },
    };
  }

  const { data, error } = await supabase
    .from("signatures")
    .select()
    .eq("code", code)
    .single();

  if (error) {
    return { statusCode: 500, body: { error: error.message } };
  }

  return { statusCode: 200, body: { data } };
});
