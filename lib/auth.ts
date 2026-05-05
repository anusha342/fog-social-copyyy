import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { upsertPlayer } from "@/lib/players"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await upsertPlayer({
          google_id: account.providerAccountId, // stable Google sub claim
          name: user.name ?? null,
          email: user.email ?? null,
          avatar_url: user.image ?? null,
        })
      }
      return true
    },

    async session({ session, token }) {
      session.user.google_id = token.sub!
      return session
    },
  },
}
