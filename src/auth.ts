import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "");
        const password = String(credentials?.password ?? "");
        const adminEmail = process.env.ADMIN_EMAIL || "admin@transfermarket.local";
        const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
        if (email === adminEmail && password === adminPassword) {
          return { id: "admin", email, name: "Auction Admin", role: "ADMIN" };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role?: string }).role ?? "PUBLIC";
      return token;
    },
    session({ session, token }) {
      if (session.user) (session.user as { role?: string }).role = String(token.role ?? "PUBLIC");
      return session;
    },
  },
  pages: {
    signIn: "/admin",
  },
});
