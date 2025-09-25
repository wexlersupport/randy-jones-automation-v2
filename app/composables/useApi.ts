// composables/useApi.ts
export function useApi() {
  const call = <T>(endpoint: string, method: any = 'POST', body: object = {}) => {
    // console.log(`API Call - ${method} ${endpoint} ${body}`)
    return $fetch<T>(endpoint, { method, body })
  }
  return { call }
}
