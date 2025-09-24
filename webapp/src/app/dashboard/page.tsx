'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>
      <h1>Welcome to Your Dashboard!</h1>
      <p>This is a protected page. Your next step is to install the browser extension.</p>
      <button 
        onClick={handleSignOut} 
        style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}
      >
        Sign Out
      </button>
    </div>
  );
}