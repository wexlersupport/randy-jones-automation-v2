

import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabase.url,
    config.public.supabase.key
  )

  try {
    const query = getQuery(event)
    const meetingUuid = query.meeting_uuid

    let queryBuilder = supabase
      .from('zoom_meeting_summaries')
      .select('*')

    if (meetingUuid) {
      queryBuilder = queryBuilder.eq('meeting_uuid', meetingUuid)
    }

    const { data, error } = await queryBuilder.single()

    if (error) {
      console.error('Supabase error:', error)

      // Check if no rows were found
      if (error.code === 'PGRST116' || error.message?.includes('JSON object requested, multiple (or no) rows returned')) {
        return {
          success: false,
          response: null,
          message: meetingUuid
            ? `No record found for this meeting`
            : 'No meeting summaries found in the database'
        }
      }

      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch meeting summaries',
        data: error
      })
    }

    return {
      success: true,
      response: data || null,
      message: data ? 'Meeting summary found' : 'No meeting summary found'
    }

  } catch (error: any) {
    console.error('Fetch summaries error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch meeting summaries',
      data: error.data || error.message
    })
  }
})
