import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail, validatePassword } from '../../lib/database';

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
            return null;
          }

          // Get user from Supabase
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            return null;
          }

          // Validate password
          const isValidPassword = await validatePassword(credentials.password, user.password_hash);
          
          if (!isValidPassword) {
            return null;
          }

          // Check if account is active
          if (user.accounts?.status !== 'active') {
            throw new Error('Account is not active');
          }

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
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
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