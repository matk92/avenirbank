'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function VerifyEmailTokenPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        // Check if token is already in localStorage as verified
        const verifiedTokens = JSON.parse(localStorage.getItem('verifiedTokens') || '[]');
        if (verifiedTokens.includes(token)) {
          setVerificationState('success');
          // Redirect to login after 2 seconds
          setTimeout(() => router.push('/login'), 2000);
          return;
        }

        // Call the backend API endpoint with token in path
        const response = await fetch(`/api/auth/verify-email/${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const responseData = await response.json();
        
        // Handle both success and "already confirmed" as success cases
        if (!response.ok) {
          throw new Error(responseData.message || 'Failed to verify email');
        }

        // Store verified token in localStorage
        const updatedTokens = [...verifiedTokens, token];
        localStorage.setItem('verifiedTokens', JSON.stringify(updatedTokens));
        
        setVerificationState('success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => router.push('/login'), 2000);
      } catch (error) {
        setVerificationState('error');
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        {verificationState === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {verificationState === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-gray-600">
              Your email has been successfully verified. Redirecting to login...
            </p>
            <div className="mt-6">
              <Link 
                href="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {verificationState === 'error' && (
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Verification Failed</h2>
            <p className="mt-2 text-gray-600">
              {errorMessage || 'We could not verify your email address. The link may have expired or is invalid.'}
            </p>
            <div className="mt-6 space-y-3">
              <Link 
                href="/login" 
                className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </Link>
              <Link 
                href="/resend-verification" 
                className="block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Resend Verification Email
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
