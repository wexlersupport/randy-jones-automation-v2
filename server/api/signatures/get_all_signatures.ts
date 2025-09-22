import { createClient } from "@supabase/supabase-js";

const config = useRuntimeConfig();

const supabaseUrl = config.supabase?.url as string;
const supabaseKey = config.supabase?.key as string;

const supabase = createClient(supabaseUrl, supabaseKey);

export default defineEventHandler(async (event) => {
  if (event.method !== "GET") {
    return { statusCode: 405, body: { error: "Method not allowed" } };
  }

  const { data, error } = await supabase
    .from("signatures")
    .select()
    .order("code", { ascending: true });

  if (error) {
    return { statusCode: 500, body: { error: error.message } };
  }

  return { statusCode: 200, body: { data } };
});
