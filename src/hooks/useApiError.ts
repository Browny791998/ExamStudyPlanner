import axios from 'axios'

export function useApiError() {
  return (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error ?? error.message ?? 'Something went wrong'
    }
    if (error instanceof Error) return error.message
    return 'An unexpected error occurred'
  }
}
