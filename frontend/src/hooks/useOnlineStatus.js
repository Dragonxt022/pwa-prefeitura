import { useEffect, useState } from 'react'

export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const ficouOnline = () => setOnline(true)
    const ficouOffline = () => setOnline(false)

    window.addEventListener('online', ficouOnline)
    window.addEventListener('offline', ficouOffline)

    return () => {
      window.removeEventListener('online', ficouOnline)
      window.removeEventListener('offline', ficouOffline)
    }
  }, [])

  return online
}
