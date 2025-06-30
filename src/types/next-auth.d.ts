import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    _id?: string;
    username?: string;
    image:string
    isVerified?: boolean;
    isAcceptingConfessionReply?: boolean;
  }

  interface Session {
    user: {
      _id?: string;
      image:string;
      username?: string;
      isVerified?: boolean;
      isAcceptingConfessionReply?: boolean;
    } & DefaultSession["user"];
  }
}


declare module "next-auth/jwt" {
  interface JWT {
    _id?: string;
    image:string;
    username?: string;
    isVerified?: boolean;
    isAcceptingConfessionReply?: boolean;
  }
}
