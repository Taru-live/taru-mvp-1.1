import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Or try one of these pages:</p>
            <div className="mt-2 space-x-4">
              <Link href="/login" className="hover:text-blue-500 transition-colors">
                Login
              </Link>
              <Link href="/dashboard/student" className="hover:text-blue-500 transition-colors">
                Student Dashboard
              </Link>
              <Link href="/dashboard/parent" className="hover:text-blue-500 transition-colors">
                Parent Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 