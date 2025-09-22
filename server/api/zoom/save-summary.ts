import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabase.url,
    config.public.supabase.key
  )

  try {
    const body = await readBody(event)
    const parseBody =  JSON.parse(body)
    const summaryData = parseBody.summaryData
    // Validate required fields
    if (!parseBody.summaryData.meeting_id || !parseBody.summaryData.meeting_uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Meeting ID and UUID are required'
      })
    }

    // Prepare data for insertion
    const insertData = {
      meeting_id: summaryData.meeting_id,
      meeting_uuid: summaryData.meeting_uuid,
      meeting_host_id: summaryData.meeting_host_id,
      meeting_host_email: summaryData.meeting_host_email,
      meeting_topic: summaryData.meeting_topic,
      meeting_start_time: summaryData.meeting_start_time,
      meeting_end_time: summaryData.meeting_end_time,
      summary_title: summaryData.summary_title,
      summary_overview: summaryData.summary_overview,
      summary_start_time: summaryData.summary_start_time,
      summary_end_time: summaryData.summary_end_time,
      summary_doc_url: summaryData.summary_doc_url,
      summary_details: summaryData.summary_details,
      next_steps: summaryData.next_steps,
      summary_content: summaryData.summary_content,
    }
    console.log(insertData)

    // Insert or update the summary
    const { data, error } = await supabase
      .from('zoom_meeting_summaries')
      .insert(insertData)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save meeting summary',
        data: error
      })
    }

    return {
      success: true,
      data: data?.[0] || null,
      message: 'Meeting summary saved successfully'
    }

  } catch (error: any) {
    console.error('Save summary error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to save meeting summary',
      data: error.data || error.message
    })
  }
})
