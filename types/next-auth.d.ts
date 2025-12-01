import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      planId: string
      stripeCustomerId?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    planId?: string
    stripeCustomerId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
