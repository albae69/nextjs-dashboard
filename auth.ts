import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { getUser } from './app/lib/data'
import type { User } from '@/app/lib/definitions'
import bcrypt from 'bcrypt'
import { use } from 'react'

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string(),
            password: z.string().min(6),
          })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          const user = await getUser(email)
          if (!user) return null

          const passwordMatch = await bcrypt.compare(password, user.password)

          if (passwordMatch) return user

          console.log('Invalid credentials')
          return null
        }
      },
    }),
  ],
})
