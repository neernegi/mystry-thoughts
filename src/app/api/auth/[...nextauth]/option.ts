import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" }, // Changed from 'email' to 'identifier'
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Please provide both email/username and password");
        }

        await dbConnect();

        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });

          if (!user) {
            throw new Error("No user found with the given credentials");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your account before logging in");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (isPasswordValid) {
            return {
              _id: user._id,
              username: user.username,
              email: user.email,
              gender:user.gender,
              isVerified: user.isVerified,
              image:user.image,
              isAcceptingConfessionReply: user.isAcceptingConfessionReply,
            };
          } else {
            throw new Error("Invalid password");
          }
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.image=user.image,
        token.isAcceptingConfessionReply = user.isAcceptingConfessionReply;
        token.username = user.username;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingConfessionReply =
          token.isAcceptingConfessionReply;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.image=token.image
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly to avoid loops
      console.log("NextAuth redirect:", { url, baseUrl });

      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      // If it's the same origin, return as is
      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // Default to base URL for external URLs
      return baseUrl;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
