import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const [user] = await sql`
          SELECT
            u.id,
            u.email,
            u.name,
            a.password AS password_hash
          FROM neon_auth."user" u
          INNER JOIN neon_auth.account a ON a."userId" = u.id
          WHERE u.email = ${credentials.email}
            AND a."providerId" = 'credential'
          LIMIT 1
        `;
        if (!user || !user.password_hash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.password_hash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }

      return session;
    },
  },
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
});

export const { GET, POST } = handlers;
