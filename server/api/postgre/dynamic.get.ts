import { defineEventHandler, getQuery } from 'h3'
import { neon } from '@netlify/neon'

const sql = neon() // uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
  const queryParams = getQuery(event)
  const { table, isDesc } = queryParams

  try {
    if (!table) {
      throw createError({ statusCode: 400, statusMessage: 'Table name is required' })
    }

    // Extract all dynamic fields and values (e.g., dynamic_field1=value1, dynamic_field2=value2...)
    const conditions: string[] = []
    const values: any[] = []

    Object.keys(queryParams).forEach((key) => {
      const match = key.match(/^dynamic_field(\d+)$/)
      if (match) {
        const index = match[1]
        const field = queryParams[`dynamic_field${index}`]
        const value = queryParams[`value${index}`]
        if (field && value !== undefined) {
          conditions.push(`${field} = $${conditions.length + 1}`)
          values.push(value)
        }
      }
    })

    if (conditions.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'At least one dynamic field and value pair is required' })
    }

    const query = `
      SELECT * FROM ${table}
      WHERE ${conditions.join(' AND ')}
      ORDER BY id ${isDesc ? 'DESC' : 'ASC'}
    `

    const rows = await sql(query, values)

    if (!rows || rows.length === 0) {
      return { data: [] }
    }

    return { data: rows }
  } catch (error: any) {
    console.error(`Error fetching from ${queryParams.table}:`, error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || `Failed to fetch ${queryParams.table}`
    })
  }
})
