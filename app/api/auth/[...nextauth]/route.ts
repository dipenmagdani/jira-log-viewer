import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "atlassian",
      name: "Atlassian",
      type: "oauth",
      authorization: {
        url: "https://auth.atlassian.com/authorize",
        params: {
          audience: "api.atlassian.com",
          prompt: "consent",
          response_type: "code",
          scope:
            "read:jira-work read:jira-user offline_access read:issue:jira read:project:jira",
        },
      },
      token: "https://auth.atlassian.com/oauth/token",
      userinfo: "https://api.atlassian.com/me",
      clientId: process.env.ATLASSIAN_CLIENT_ID,
      clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.account_id,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        console.log("JWT Callback - Account:", account);
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session Callback - Token:", token);
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      return session;
    },
    async signIn({ account, profile }) {
      console.log("SignIn Callback - Account:", account);
      console.log("SignIn Callback - Profile:", profile);
      return true;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
