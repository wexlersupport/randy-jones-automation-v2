export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Basic configuration check
  const supabaseUrl = config.public.supabase?.url
  const supabaseKey = config.public.supabase?.key

  if (!supabaseUrl || !supabaseKey) {
    return {
      success: false,
      error: 'Supabase configuration missing',
      config: {
        url: supabaseUrl ? 'configured' : 'missing',
        key: supabaseKey ? 'configured' : 'missing'
      }
    }
  }

  try {
    // Test basic connection by making a simple request
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })

    if (response.ok) {
      return {
        success: true,
        message: 'Supabase connection successful',
        status: response.status
      }
    } else {
      return {
        success: false,
        error: 'Supabase connection failed',
        status: response.status,
        statusText: response.statusText
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})
