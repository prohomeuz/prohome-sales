import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '@/shared/hooks/use-isomorphic-layout-effect'

export function useLatest(value) {
  const ref = useRef(value)

  useIsomorphicLayoutEffect(() => {
    ref.current = value
  })

  return ref
}
