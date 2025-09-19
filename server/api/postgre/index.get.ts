import { neon } from '@netlify/neon';
import { defineEventHandler, getQuery } from 'h3'; // Or directly from 'nitropack/dist/runtime/utils'

export default defineEventHandler(async (event) => {
  const { table, isDesc } = getQuery(event)
  // console.log('table ', table)
  const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL
  try {
    const query = `SELECT * FROM ${table} ORDER BY id ${isDesc ? 'DESC' : 'ASC'} LIMIT 1000`;
    const data = await sql(query);
    // console.log('data ', data)

    return { data };
  } catch (error) {
    console.error(`Error fetching ${table}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch ${table}`,
    });
  }
});