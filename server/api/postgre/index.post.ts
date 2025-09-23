import { neon } from "@netlify/neon";
import { defineEventHandler, readBody, getQuery, createError } from "h3";

export default defineEventHandler(async (event) => {
  const { table } = getQuery(event);
  const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL
  try {
    const body = await readBody(event);
    const fields = Object.keys(body);
    const values = Object.values(body);

    // Basic validation
    if (values.length < 1) {
      throw createError({
        statusCode: 400,
        statusMessage: "Fields is required",
      });
    }
    const quotedFields = fields.map((field: string) => {
      if (field === "from" || field === "to") {
        return `"${field}"`;
      }
      return field;
    });
    const placeholders = fields
      .map((field: any, index: number) => `$${index + 1}`)
      .join(", ");

    // Add ON CONFLICT clause to handle duplicates
    const query = `INSERT INTO ${table} (${quotedFields.join(", ")})
                VALUES (${placeholders}) 
                ON CONFLICT ON CONSTRAINT ${table}_pkey 
                DO UPDATE SET ${quotedFields
                  .map((field, i) => `${field} = $${i + 1}`)
                  .join(", ")}
                RETURNING *`;

    const [data] = await sql(query, values);

    return data;
  } catch (error: any) {
    console.error(`Error creating ${table}:`, error);
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to create ${table}`,
    });
  }
});
