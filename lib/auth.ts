import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

export interface User {
  id: string
  email: string
  name?: string
  image?: string
  planId: string
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  createdAt: number
  preferences?: UserPreferences
}

export interface UserPreferences {
  dietaryRestrictions: string[]
  allergies: string[]
  healthGoals: string[]
  favoriteCategories: string[]
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const user = await redis.get(`user:${email}`)
    return user as User | null
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function createUser(userData: Partial<User>): Promise<User> {
  const user: User = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    email: userData.email!,
    name: userData.name,
    image: userData.image,
    planId: "free",
    createdAt: Date.now(),
    preferences: {
      dietaryRestrictions: [],
      allergies: [],
      healthGoals: [],
      favoriteCategories: [],
    },
    ...userData,
  }

  await redis.set(`user:${user.email}`, user)
  await redis.set(`user_id:${user.id}`, user.email)

  return user
}

export async function updateUser(email: string, updates: Partial<User>): Promise<User | null> {
  const user = await getUserByEmail(email)
  if (!user) return null

  const updatedUser = { ...user, ...updates }
  await redis.set(`user:${email}`, updatedUser)

  return updatedUser
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        let user = await getUserByEmail(credentials.email)

        if (!user) {
          user = await createUser({
            email: credentials.email,
            name: credentials.email.split("@")[0],
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        let existingUser = await getUserByEmail(user.email)
        if (!existingUser) {
          await createUser({
            email: user.email,
            name: user.name || undefined,
            image: user.image || undefined,
          })
        }
      }
      return true
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const user = await getUserByEmail(session.user.email)
        if (user) {
          session.user.id = user.id
          session.user.planId = user.planId
          session.user.stripeCustomerId = user.stripeCustomerId
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
