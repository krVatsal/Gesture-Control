import UserModel from '@/models/user.model';
import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth/next';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/dbConnect';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;


const authOption: NextAuthOptions = {
    session: {
      strategy: 'jwt',
    },
    providers: [
      GoogleProvider({
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
      }),
    ],
    callbacks: {
      async signIn({ account, profile }) {
        if (!profile?.email) {
          throw new Error('No profile');
        }
  
        await dbConnect();
  
        // Find or create user
        const existingUser = await UserModel.findOne({ email: profile.email });
  
        if (!existingUser) {
          // Create a new user
          await UserModel.create({
            firstName: profile.given_name || 'User',
            lastName: profile.family_name || '',
            email: profile.email,
            accessToken: account?.access_token || '',
            token: [account?.access_token || ''], // Add access token to tokens array
            svgFiles: [],
            canvasPages: [],
          });
        } else {
          // Update access token and ensure the email exists
          existingUser.accessToken = account?.access_token || '';
          if (account?.access_token) {
            existingUser.token.push(account.access_token); // Store tokens
          }
          await existingUser.save();
        }
  
        return true; // Allow sign-in
      },
  
      async jwt({ token, account, profile }) {
        if (account && profile) {
          // Include user ID and accessToken in the token payload
          const user = await UserModel.findOne({ email: profile.email });
          token.id = user?._id.toString(); // Add user ID to token
          token.accessToken = account.access_token; // Add access token to token
        }
        return token;
      },
  
      async session({ session, token }) {
        if (token) {
          // Attach additional user data to session object
          session.user = {
            ...session.user,
            id: token.id,
            accessToken: token.accessToken,
          };
        }
        return session;
      },
    },
  };
  

const handler = NextAuth(authOption);
export { handler as GET, handler as POST };
