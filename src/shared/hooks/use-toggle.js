import { useMemo, useReducer } from 'react'

function useToggle(defaultValue = false, reverseValue) {
  const [state, dispatch] = useReducer((
    state,
    action,
  ) => {
    const reverseValueOrigin = (reverseValue === undefined ? !defaultValue : reverseValue)

    switch (action.type) {
      case 'toggle':
        return state === defaultValue ? reverseValueOrigin : defaultValue
      case 'set':
        return action.payload
      case 'setLeft':
        return defaultValue
      case 'setRight':
        return reverseValueOrigin
      default:
        return state
    }
  }, defaultValue)

  return [
    state,
    useMemo(() => {
      return {
        toggle: () => dispatch({ type: 'toggle' }),
        set: (value) => dispatch({ type: 'set', payload: value }),
        setLeft: () => dispatch({ type: 'setLeft' }),
        setRight: () => dispatch({ type: 'setRight' }),
      };
    }, [dispatch]),
  ];
}

export default useToggle
