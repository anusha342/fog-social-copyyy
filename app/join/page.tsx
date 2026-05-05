import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { JoinFlow } from "./JoinFlow"

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { t, s } = await searchParams

  const tournamentId = Array.isArray(t) ? t[0] : t
  const sessionCode = Array.isArray(s) ? s[0] : s

  if (!tournamentId || !sessionCode) {
    return (
      <main className="flex min-h-svh items-center justify-center px-6 bg-background">
        <div className="w-full max-w-[320px] text-center">
          <p className="text-lg font-bold text-foreground">Invalid link</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Scan the QR code at the arcade machine to get a valid join link.
          </p>
        </div>
      </main>
    )
  }

  const session = await getServerSession(authOptions)

  return (
    <main>
      <JoinFlow
        tournamentId={tournamentId}
        sessionCode={sessionCode}
        session={session}
      />
    </main>
  )
}
