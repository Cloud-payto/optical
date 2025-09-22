import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail, validatePassword } from '../../../lib/database';

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Missing credentials');
            return null;
          }

          console.log('Attempting to authenticate user:', credentials.email);

          // Get user from Supabase
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          console.log('User found:', user.email, 'Account:', user.accounts?.name);

          // Validate password
          const isValidPassword = await validatePassword(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          // Check if account is active (allow trial and active accounts)
          const allowedStatuses = ['active', 'trial'];
          if (!allowedStatuses.includes(user.accounts?.status)) {
            console.log('Account not active:', user.accounts?.status);
            throw new Error('Account is not active');
          }

          console.log('Authentication successful for:', credentials.email);

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            accountId: user.account_id,
            role: user.role,
            accountName: user.accounts?.name,
            accountStatus: user.accounts?.status
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accountId = user.accountId;
        token.role = user.role;
        token.accountName = user.accountName;
        token.accountStatus = user.accountStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.accountId = token.accountId;
        session.user.role = token.role;
        session.user.accountName = token.accountName;
        session.user.accountStatus = token.accountStatus;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});