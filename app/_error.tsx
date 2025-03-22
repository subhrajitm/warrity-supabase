import { useEffect } from 'react'
import { NextPage } from 'next'

interface ErrorProps {
  statusCode: number
  errorMessage: string
  hasGetInitialPropsRun: boolean
  err: Error
}

const isDependencyError = (error: string): boolean => {
  return error.includes("Module not found: Can't resolve") || 
         error.includes("Cannot find module") || 
         error.includes("Failed to resolve import")
}

const parseMissingDependency = (error: string): string | null => {
  // Match "Can't resolve 'package-name'" pattern
  const match = error.match(/Can't resolve '([^']+)'/) || 
                error.match(/Cannot find module '([^']+)'/) ||
                error.match(/Failed to resolve import "([^"]+)"/)
  
  return match ? match[1] : null
}

const ErrorPage: NextPage<ErrorProps> = ({ statusCode, errorMessage, err }) => {
  useEffect(() => {
    // Log detailed error info in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error details:', { statusCode, errorMessage, err })
    }
  }, [statusCode, errorMessage, err])

  const missingPackage = errorMessage ? parseMissingDependency(errorMessage) : null
  const isMissingDependency = errorMessage ? isDependencyError(errorMessage) : false

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-red-600">
          {statusCode ? `Error ${statusCode}` : 'Client-side Error'}
        </h1>
        
        {isMissingDependency && missingPackage ? (
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Missing npm package: <code className="rounded bg-gray-100 px-2 py-1 font-mono dark:bg-gray-700">{missingPackage}</code>
            </p>
            <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/30">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This error is likely caused by a missing dependency. Run the following command to fix it:
              </p>
              <pre className="mt-2 overflow-x-auto rounded bg-gray-800 p-3 text-left text-sm text-white">
                <code>{`npm install ${missingPackage}`}</code>
              </pre>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                After installation, restart your development server with <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">npm run dev</code>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">{errorMessage || 'An unexpected error occurred'}</p>
        )}
        
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}

ErrorPage.getInitialProps = async ({ res, err, asPath }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode ?? 500 : 404
  const errorMessage = err?.message || 'An unexpected error occurred'
  
  return {
    statusCode,
    errorMessage,
    hasGetInitialPropsRun: true,
    err: err as Error,
  }
}

export default ErrorPage 