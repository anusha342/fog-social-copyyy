'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'

export function MockToggle({ initialMock }: { initialMock: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [enabled, setEnabled] = useState(initialMock)

  // Keep internal state synced if URL changes externally
  useEffect(() => {
    setEnabled(initialMock)
  }, [initialMock])

  const handleToggle = () => {
    const nextVal = !enabled
    setEnabled(nextVal)
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextVal) {
        params.set('mock', 'true')
      } else {
        params.set('mock', 'false')
      }
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/20 ${
        enabled ? 'bg-orange-500' : 'bg-zinc-300'
      } ${isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
      aria-label="Toggle mock data"
    >
      <span
        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${
          enabled ? 'translate-x-5.5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
