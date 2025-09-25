'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const sendSessionToExtension = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // This is the correct, safe way for a webpage to send a message.
        // It broadcasts a message to the window, which our extension can listen for.
        window.postMessage({
          type: 'MAKEMEGUUD_SESSION', // Use a unique name for our message
          payload: { session }
        }, '*');
      }
    };
    sendSessionToExtension();
  }, [supabase]);

  const handleSignOut = async () => { 
    await supabase.auth.signOut();
    router.push('/');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome! You're All Set.</h1>
        <div className="text-left space-y-4 my-8">
          <div className="flex items-start p-4 bg-gray-700 rounded-lg">
            <span className="text-3xl mr-4">✅</span>
            <div>
              <h2 className="font-bold text-lg">Step 1: Account Created</h2>
              <p className="text-gray-300">You're successfully logged in.</p>
            </div>
          </div>
          <div className="flex items-start p-4 bg-gray-700 rounded-lg">
            <span className="text-3xl mr-4">➡️</span>
            <div>
              <h2 className="font-bold text-lg">Step 2: Install the Extension</h2>
              <p className="text-gray-300">The final step is to add our free extension to your Chrome browser.</p>
            </div>
          </div>
        </div>
        <a 
          href="https://chromewebstore.google.com/" // IMPORTANT: Replace with your actual store link later
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 font-semibold text-lg bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700"
        >
          Install Chrome Extension
        </a>
        <button 
          onClick={handleSignOut} 
          className="block mx-auto mt-8 text-gray-400 hover:text-white transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}