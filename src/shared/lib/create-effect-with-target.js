import { isBrowser, isEqual, isFunction } from 'es-toolkit'
import { useRef } from 'react'
import { useUnmount } from '@/shared/hooks/use-unmount'

export function getTargetElement(target, defaultElement) {
  if (!isBrowser) {
    return undefined
  }

  if (!target) {
    return defaultElement
  }

  let targetElement

  if (isFunction(target)) {
    targetElement = target()
  } else if ('current' in target) {
    targetElement = target.current
  } else {
    targetElement = target
  }

  return targetElement
}

export function createEffectWithTarget(
  useEffectType,
) {
  /**
   *
   * @param effect
   * @param deps
   * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
   */
  const useEffectWithTarget = (
    effect,
    deps,
    target,
  ) => {
    const hasInitRef = useRef(false)

    const lastElementRef = useRef([])
    const lastDepsRef = useRef([])

    const unLoadRef = useRef(undefined)

    useEffectType(() => {
      const targets = Array.isArray(target) ? target : [target]
      const els = targets.map((item) => getTargetElement(item))

      // init run
      if (!hasInitRef.current) {
        hasInitRef.current = true
        lastElementRef.current = els
        lastDepsRef.current = deps

        unLoadRef.current = effect()
        return
      }

      if (
        els.length !== lastElementRef.current.length ||
        !isEqual(lastElementRef.current, els) ||
        !isEqual(lastDepsRef.current, deps)
      ) {
        unLoadRef.current?.()

        lastElementRef.current = els
        lastDepsRef.current = deps
        unLoadRef.current = effect()
      }
    })

    useUnmount(() => {
      unLoadRef.current?.()
      // for react-refresh
      hasInitRef.current = false
    })
  }

  return useEffectWithTarget
}
