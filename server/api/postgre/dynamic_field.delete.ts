import { neon } from '@netlify/neon';
import { defineEventHandler, getRouterParam } from 'h3'
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const { table, dynamic_field, value } = getQuery(event)
    try {
        if (!dynamic_field) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item' })
        }

        const query = `
          DELETE FROM ${table}
          WHERE ${dynamic_field} = ${value}
          RETURNING *
        `;
        const deletedItem = await sql(query);
        // console.log('deletedItem ', deletedItem)

        if (!deletedItem) {
          return { error: 'ID not found', statusCode: 404 };
        }

        return { message: 'Item deleted successfully', dynamic_field, value, data: deletedItem }
    } catch (error: any) {
        console.error(`Error deleting ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to delete ${table}`
        })
    }
})