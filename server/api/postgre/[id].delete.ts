import { neon } from '@netlify/neon';
import { defineEventHandler, getRouterParam } from 'h3'
const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

export default defineEventHandler(async (event) => {
    const { table } = getQuery(event)
    try {
        const id = getRouterParam(event, 'id')
        if (!id || isNaN(Number(id))) {
            throw createError({ statusCode: 400, statusMessage: 'Invalid item ID' })
        }

        const query = `
          DELETE FROM ${table}
          WHERE id = ${id}
          RETURNING *
        `;
        const [deletedItem] = await sql(query);
        // console.log('deletedItem ', deletedItem)

        if (!deletedItem) {
          return { error: 'ID not found', statusCode: 404 };
        }

        return { message: 'Item deleted successfully', id: Number(id), data: deletedItem }
    } catch (error: any) {
        console.error(`Error deleting ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to delete ${table}`
        })
    }
})