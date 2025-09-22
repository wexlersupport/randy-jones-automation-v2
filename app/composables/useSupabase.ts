// composables/useSupabase.ts
export const useSupabase = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Authentication methods
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  // Database methods
  const from = (table: string) => {
    return supabase.from(table)
  }

  return {
    supabase,
    user,
    signUp,
    signIn,
    signOut,
    from,
  }
}
