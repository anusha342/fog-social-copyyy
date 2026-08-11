import { Loader2 } from "lucide-react"

export default function JoinLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3.5">
        <Loader2 size={28} className="text-primary animate-spin" aria-hidden />
        <p className="text-base sm:text-lg font-bold text-zinc-955 uppercase font-sans tracking-wide">
          Loading session…
        </p>
      </div>
    </div>
  )
}
