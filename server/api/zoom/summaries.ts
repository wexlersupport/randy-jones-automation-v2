

export default defineEventHandler(async (event) => {
  const supabase = useSupabaseClient()

  try {
    const query = getQuery(event)
    const meetingId = query.meetingId
    const limit = query.limit ? parseInt(query.limit as string) : 50
    const offset = query.offset ? parseInt(query.offset as string) : 0

    let queryBuilder = supabase
      .from('zoom_meeting_summaries')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by meeting ID if provided
    if (meetingId) {
      queryBuilder = queryBuilder.eq('meeting_id', meetingId)
    }

    const { data, error, count } = await queryBuilder

    if (error) {
      console.error('Supabase error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch meeting summaries',
        data: error
      })
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (data?.length || 0) === limit
      }
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
