import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" }
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;
        const role = (credentials?.role as string) || "citizen";

        // Enforce password check for write-capable and admin roles
        if (["officer", "collector", "admin"].includes(role)) {
          if (password !== "nevil@207") {
            return null;
          }
        }

        return {
          id: role === "officer" ? "SR-BLR-092" : role === "collector" ? "DC-BLR-001" : "1",
          name: username || "demo_user",
          role: role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
})
