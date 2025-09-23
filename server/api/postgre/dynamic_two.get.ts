import { defineEventHandler, getQuery } from 'h3'
import { neon } from '@netlify/neon'

const sql = neon() // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
  const { table, dynamic_field1, value1, dynamic_field2, value2 } = getQuery(event)
  // console.log('Query Parameters:', { table, dynamic_field1, value1, dynamic_field2, value2 })

  try {
    if (!table || !dynamic_field1 || !value1 || !dynamic_field2 || !value2) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid request parameters' })
    }

    // ✅ Parameterized query to prevent SQL injection
    const query = `
        SELECT * FROM ${table}
        WHERE ${dynamic_field1} = $1
        AND ${dynamic_field2} = $2
        ORDER BY created_at DESC
    `
    const rows = await sql(query, [value1, value2])

    if (!rows || rows.length === 0) {
      return { data: [] }
    }

    return { data: rows }
  } catch (error: any) {
    console.error(`Error fetching from ${table}:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to fetch ${table}`
    })
  }
})
