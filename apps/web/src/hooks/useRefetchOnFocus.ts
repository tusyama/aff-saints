import { useEffect } from 'react'

export function useRefetchOnFocus(reexecute: () => void): void {
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reexecute()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [reexecute])
}
