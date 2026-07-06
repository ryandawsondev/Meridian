import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      toast.success('Back online')
      void queryClient.refetchQueries({ type: 'active' })
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])

  return isOnline
}
