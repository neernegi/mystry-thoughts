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
              gender: user.gender,
              isVerified: user.isVerified,
              image: user.image,

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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token._id = user._id?.toString();
        token.isVerified = user.isVerified;
        token.username = user.username;
        token.email = user.email;
        token.image = user.image;
        token.isAcceptingConfessionReply = user.isAcceptingConfessionReply;
      }

      // Runs when session.update() is called
      if (trigger === "update" && session) {
        if (session.image) token.image = session.image;
      }

      return token;
    },

    async session({ session, token }) {
      session.user._id = token._id;
      session.user.isVerified = token.isVerified;
      session.user.username = token.username;
      session.user.email = token.email;
      session.user.image = token.image;
      session.user.isAcceptingConfessionReply =
        token.isAcceptingConfessionReply;

      return session;
    }
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
