import { useEffect } from 'react'
import { createEffectWithTarget } from '@/shared/lib/create-effect-with-target'

export const useEffectWithTarget = createEffectWithTarget(useEffect)
