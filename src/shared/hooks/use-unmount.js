import { useEffect } from 'react'
import { useLatest } from '@/shared/hooks/use-latest'

export function useUnmount(fn) {
  const fnRef = useLatest(fn)

  useEffect(() => () => {
    fnRef.current()
  }, [])
}
