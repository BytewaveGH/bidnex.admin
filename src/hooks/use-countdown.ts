'use client'

import { useState, useEffect } from 'react'

export interface CountdownResult {
  display: string
  isPast: boolean
  diff: number
}

export const useCountdown = (targetIso: string | undefined): CountdownResult => {
  const [state, setState] = useState<CountdownResult>({ display: '', isPast: false, diff: Infinity })

  useEffect(() => {
    if (!targetIso) {
      setState({ display: '', isPast: false, diff: Infinity })
      return
    }

    const target = new Date(targetIso).getTime()

    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setState({ display: 'Ended', isPast: true, diff: 0 })
        return
      }
      const d = Math.floor(diff / 86_400_000)
      const h = Math.floor((diff % 86_400_000) / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      const display = d > 0 ? `${d}d ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`
      setState({ display, isPast: false, diff })
    }

    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [targetIso])

  return state
}
