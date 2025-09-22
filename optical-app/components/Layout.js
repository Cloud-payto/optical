import Head from 'next/head';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Layout({ children, title = 'OptiProfit' }) {
  const { data: session } = useSession();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Optical Business Intelligence Platform" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                  OptiProfit
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                {session && (
                  <>
                    <span className="text-sm text-gray-700">
                      {session.user?.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main>{children}</main>
      </div>
    </>
  );
}