'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react'; // <<< THE FIX: Import useState from React

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const showToken = async () => {
    const { data } = await supabase.auth.getSession();
    setAccessToken(data.session?.access_token || 'No token found');
  };

  return (
    <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>
      <h1>Welcome to Your Dashboard!</h1>
      <p>This is a protected page. Your next step is to install the browser extension.</p>

      <button 
        onClick={showToken} 
        style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}
      >
        Show My Access Token
      </button>
      
      {accessToken && <p style={{ wordBreak: 'break-all', marginTop: '15px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>{accessToken}</p>}

      <button 
        onClick={handleSignOut} 
        style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
      >
        Sign Out
      </button>
    </div>
  );
}