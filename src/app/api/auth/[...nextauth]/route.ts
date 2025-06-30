import NextAuth from "next-auth";
import { authOptions } from "./option";




const handler = NextAuth(authOptions);


export {handler as GET, handler as POST};
// This file handles the NextAuth authentication requests for both GET and POST methods.
// It imports the NextAuth function and the authentication options from the options file.

// The handler is then exported for use in the Next.js API routes, allowing for user authentication and session management.
