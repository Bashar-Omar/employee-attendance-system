"use client"

import { useState, useEffect } from "react"

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const target = new Date()
      target.setHours(20, 0, 0, 0) // 8:00 PM

      // If already past 8 PM, target tomorrow? 
      // Requirement says "Countdown goes from check-in time -> shift end (8:00 PM)"
      // If it's 9 PM, we probably shouldn't show negative or tomorrow. 
      // Let's assume standard shift logic: Show 00:00:00 if past.

      const diff = target.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("00:00:00")
        return
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      )
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!timeLeft) return null // loading state

  return (
    <div className="flex flex-col items-center justify-center p-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Time Remaining</span>
        <div className="font-mono text-4xl font-bold tracking-wider text-primary tabular-nums">
            {timeLeft}
        </div>
        <span className="text-xs text-muted-foreground mt-1">until 8:00 PM</span>
    </div>
  )
}
