'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const supabase = createClientComponentClient();

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // This is the crucial part. We are explicitly telling Supabase
        // where to redirect the user after they authenticate with Google.
        redirectTo: 'http://localhost:3000/auth/callback',
      },
    });
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Sign In</h1>
      <button 
        onClick={handleGoogleLogin} 
        style={{ padding: '10px 20px', fontSize: '1rem', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}
      >
        Sign in with Google
      </button>
      {/* We are temporarily removing the email/password form to isolate the Google issue */}
    </div>
  );
}