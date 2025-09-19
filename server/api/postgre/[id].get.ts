import { defineEventHandler, getRouterParam } from 'h3'
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const { table } = getQuery(event)
    try {
        const id = getRouterParam(event, 'id')
        if (!id || isNaN(Number(id))) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item ID' })
        }

        const query = `SELECT * FROM ${table} WHERE id = $1`
        const rows = await sql(query, [id]);
        // console.log('rows ', rows)

        if (rows.length === 0) {
            throw createError({ statusCode: 404, statusMessage: 'Item not found' })
        }

        return { data: rows[0] }
    } catch (error: any) {
        console.error(`Error fetching single ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to fetch ${table}`
        })
    }
})