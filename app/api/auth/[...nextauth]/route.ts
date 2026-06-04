import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Tên đăng nhập", type: "text" },
        password: { label: "Mật khẩu", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
        }
        const user = await prisma.user.findUnique({
          where: { username: credentials.username }
        });
        if (!user) {
          throw new Error("Tài khoản không tồn tại.");
        }
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Mật khẩu không chính xác.");
        }
        return {
          id: user.id,
          name: user.name,
          email: user.username,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET || "pilates-mori-mgmt-secret-key-12345"
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
