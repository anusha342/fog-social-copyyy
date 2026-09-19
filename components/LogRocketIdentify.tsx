"use client"

import { useEffect } from "react"
import { logRocketManager } from "@/lib/logRocketManager"

interface Props {
  id: string | null | undefined
  name?: string | null
  email?: string | null
}

/** Mounted on pages where the signed-in user is known, to attach identity to the active recording. */
export function LogRocketIdentify({ id, name, email }: Props) {
  useEffect(() => {
    if (!id) return
    logRocketManager.identify({ id, name, email })
  }, [id, name, email])

  return null
}
