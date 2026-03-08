import { useMemo } from 'react'
import useToggle from '@/shared/hooks/use-toggle'

export function useBoolean(defaultValue = false) {
  const [state, actions] = useToggle(defaultValue)

  return [state, useMemo(() => ({
    set: (value) => actions.set(value),
    setTrue: () => actions.set(true),
    setFalse: () => actions.set(false),
    toggle: () => actions.toggle(),
  }), [actions])];
}
