import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { neon } from '@netlify/neon';
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const { table, dynamic_field, dynamic_value } = getQuery(event)
    try {
        const id = getRouterParam(event, 'id')
        if (!id || isNaN(Number(id))) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item ID' })
        }
        const value = dynamic_value ?? id

        const body = await readBody(event)
        const values = Object.values(body);
        if (values.length < 1) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Fields is required'
            })
        }

        const setClauses = Object.keys(body)
            .map((key, i) => `${key} = $${i+1}`)
            .join(", "); // e.g., "name = $1, email = $2, age = $3"
        // console.log('setClauses ', setClauses)
        const query = `
          UPDATE ${table}
          SET ${setClauses}
          WHERE ${dynamic_field} = ${value}
          RETURNING *
        `;
        const result = await sql(query, values);
        // console.log('result ', result)

        if (result.length === 0) {
          return { error: 'Entry not found', statusCode: 404 };
        }

        return { message: 'Item updated successfully', id: Number(id), data: result }
    } catch (error: any) {
        console.error(`Error updating ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to update ${table}`
        })
    }
})