"use client"

import { useEffect, useState } from "react"

// Render dates/times in local timezone client-side to prevent Next.js SSR timezone mismatch
interface LocalTimeProps {
  isoString: string
  type: "time" | "date"
}

export function LocalTime({ isoString, type }: LocalTimeProps) {
  const [formatted, setFormatted] = useState<string>("")

  useEffect(() => {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return

    if (type === "time") {
      setFormatted(
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    } else {
      setFormatted(
        date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      )
    }
  }, [isoString, type])

  return <span className="tabular-nums">{formatted}</span>
}
