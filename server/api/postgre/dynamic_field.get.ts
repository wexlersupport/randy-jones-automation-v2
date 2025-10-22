import { defineEventHandler, getRouterParam } from 'h3'
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const { table, dynamic_field, value, isDesc } = getQuery(event)
    try {
        if (!dynamic_field) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item' })
        }
        const query = `SELECT * FROM ${table} WHERE ${dynamic_field} = $1 ORDER BY id ${isDesc ? 'DESC' : 'ASC'}`
        const rows = await sql(query, [value]);

        if (!rows) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found' })
        }
        if (rows.length === 0) {
            return { data: [] }
        }

        return { data: rows }
    } catch (error: any) {
        console.error(`Error fetching single ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to fetch ${table}`
        })
    }
})