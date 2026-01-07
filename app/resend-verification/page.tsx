'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResendVerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('You must be logged in to resend verification email');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/email-verification/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      setIsSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      // If unauthorized, redirect to login
      if (error instanceof Error && error.message.includes('logged in')) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Link>
        </div>

        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto text-blue-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Resend Verification Email</h2>
          
          {!isSuccess ? (
            <>
              <p className="mt-2 text-gray-600">
                If you haven't received your verification email or the link has expired, you can request a new one.
              </p>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <button
                onClick={handleResendVerification}
                disabled={isLoading}
                className="mt-6 w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Sending...
                  </>
                ) : (
                  'Resend Verification Email'
                )}
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                Verification email sent successfully! Please check your inbox.
              </div>
              
              <div className="mt-6 space-y-3">
                <Link 
                  href="/login" 
                  className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
