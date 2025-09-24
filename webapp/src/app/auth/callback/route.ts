import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // Log that the route was hit
  console.log(`Callback route hit. URL: ${request.url}`);

  if (code) {
    // Log the authorization code we received
    console.log(`Received authorization code: ${code}`);
    try {
      const supabase = createRouteHandlerClient({ cookies });
      // Attempt to exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
      console.log("Successfully exchanged code for session. Cookie should be set.");
    } catch (error) {
      // If there's an error, log it
      console.error("ERROR exchanging code for session:", error);
    }
  } else {
    console.log("Callback route hit, but no 'code' parameter was found in the URL.");
  }

  // We are now hardcoding the redirect to be absolutely certain.
  const redirectUrl = 'http://localhost:3000/dashboard';
  console.log(`Attempting to redirect to: ${redirectUrl}`);
  return NextResponse.redirect(redirectUrl);
}