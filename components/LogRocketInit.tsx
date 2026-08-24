"use client"

import { useEffect } from "react"
import { logRocketManager } from "@/lib/logRocketManager"

/** Mounted once in the root layout so recording starts on every page, signed in or not. */
export function LogRocketInit() {
  useEffect(() => {
    logRocketManager.init()
  }, [])

  return null
}
