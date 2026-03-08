import { useEffectWithTarget } from '@/shared/hooks/use-effect-with-target'
import { useLatest } from '@/shared/hooks/use-latest'
import { getTargetElement } from '@/shared/lib/create-effect-with-target'

function useEventListener(
  eventName,
  handler,
  options = {},
) {
  const { enable = true } = options

  const handlerRef = useLatest(handler)

  useEffectWithTarget(() => {
    if (!enable) {
      return
    }

    const targetElement = getTargetElement(options.target, window)
    if (!targetElement?.addEventListener) {
      return
    }

    const eventListener = (event) => {
      return handlerRef.current(event);
    }

    const eventNameArray = Array.isArray(eventName) ? eventName : [eventName]

    eventNameArray.forEach((event) => {
      targetElement.addEventListener(event, eventListener, {
        capture: options.capture,
        once: options.once,
        passive: options.passive,
      })
    })

    return () => {
      eventNameArray.forEach((event) => {
        targetElement.removeEventListener(event, eventListener, {
          capture: options.capture,
        })
      })
    };
  }, [eventName, options.capture, options.once, options.passive, enable], options.target)
}

export { useEventListener }
