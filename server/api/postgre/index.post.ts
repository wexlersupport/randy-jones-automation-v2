import { neon } from '@netlify/neon';
import { defineEventHandler, readBody, getQuery, createError } from 'h3'

export default defineEventHandler(async (event) => {
    const { table } = getQuery(event)
    const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL
    try {
        const body = await readBody(event)
        // const { description } = body
        
        // Remove id field to prevent primary key conflicts when creating new records
        const { id, ...bodyWithoutId } = body;
        

        const fields = Object.keys(bodyWithoutId);
        const values = Object.values(bodyWithoutId);

        // Basic validation
        if (values.length < 1) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Fields is required'
            })
        }
        const quotedFields = fields.map((field: string) => {
            if (field === 'from' || field === 'to') {
                return `"${field}"`;
            }
            return field;
        });
        const placeholders = fields.map((field: any, index: number) => `$${index+1}`).join(", "); // e.g., '$1, $2, $3'
        // console.log('placeholders ', placeholders)

        // For tables with auto-incrementing IDs, we need to handle sequence issues
        let query;
        let queryValues;
        
        if (table === 'for_follow_up_templates') {
            // Get the next available ID to avoid sequence issues
            const maxIdResult = await sql(`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM ${table}`);
            const nextId = maxIdResult[0].next_id;
            
            // Add the ID to the fields and values
            const fieldsWithId = ['id', ...quotedFields];
            const valuesWithId = [nextId, ...values];
            const placeholdersWithId = fieldsWithId.map((field: any, index: number) => `$${index+1}`).join(", ");
            
            query = `INSERT INTO ${table} (${fieldsWithId.join(", ")})
                    VALUES (${placeholdersWithId}) RETURNING *`;
            queryValues = valuesWithId;
        } else {
            query = `INSERT INTO ${table} (${quotedFields.join(", ")})
                    VALUES (${placeholders}) RETURNING *`;
            queryValues = values;
        }
        

        const [data] = await sql(query, queryValues);

        return data;
    } catch (error: any) {
        console.error(`Error creating ${table}:`, error)
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || `Failed to create ${table}`
        })
    }
})