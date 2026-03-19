import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase'
import { initKinde, loginWithRedirect, logout as kindeLogout, isAuthenticated, getUser as getKindeUser } from './lib/kinde'
import { Button } from './components/ui/button'
import { MessageSquare, Loader2, AlertCircle } from 'lucide-react'

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'your_supabase_project_url' && url.includes('supabase.co');
};

// Local storage helpers for fallback
const saveUserToLocal = (user: any) => {
  localStorage.setItem('teamconnect_user', JSON.stringify(user));
};

const getUserFromLocal = () => {
  const stored = localStorage.getItem('teamconnect_user');
  return stored ? JSON.parse(stored) : null;
};

const clearUserFromLocal = () => {
  localStorage.removeItem('teamconnect_user');
};

function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (connectionId?: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      await initKinde();
      loginWithRedirect(connectionId ? { connection_id: connectionId } : undefined);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Failed to initialize login. Please check your Kinde configuration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#1877F2]">TeamConnect</h1>
          <p className="text-[15px] text-[#65676B] mt-2">
            Connect with your team, share updates, and stay in sync.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-[14px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Authentication Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Google Login */}
          <Button
            className="w-full h-12 text-[16px] bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
            onClick={() => handleLogin('conn_google')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          {/* Facebook Login */}
          <Button
            className="w-full h-12 text-[16px] bg-[#1877F2] hover:bg-[#166fe5] text-white"
            onClick={() => handleLogin('conn_facebook')}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            )}
            Continue with Facebook
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Email Login */}
          <Button
            className="w-full h-12 text-[16px] bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => handleLogin()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Continue with Email
          </Button>

          <p className="text-[13px] text-[#65676B] text-center">
            Secure authentication powered by Kinde
          </p>
        </div>
      </div>
    </div>
  );
}

function Root() {
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        
        // Initialize Kinde first
        await initKinde();
        console.log('Kinde initialized');
        
        // Check if we're returning from Kinde callback
        const url = new URL(window.location.href);
        const hasAuthParams = url.searchParams.has('code') || url.searchParams.has('state');
        
        if (hasAuthParams) {
          console.log('Detected auth callback, processing...');
          // Wait a bit for Kinde to process the callback
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check if user is authenticated with Kinde
        const kindeAuth = isAuthenticated();
        console.log('Kinde auth status:', kindeAuth);
        
        if (kindeAuth) {
          // Get user from Kinde
          const kindeUser = getKindeUser();
          console.log('Kinde user:', kindeUser);
          
          if (kindeUser) {
            const userName = kindeUser.given_name && kindeUser.family_name 
              ? `${kindeUser.given_name} ${kindeUser.family_name}`
              : kindeUser.email?.split('@')[0] || 'User';
              
            const userData = {
              id: kindeUser.id,
              email: kindeUser.email,
              name: userName,
              avatar: kindeUser.picture,
              role: 'user',
              createdAt: new Date().toISOString(),
            };
            
            // Try to sync with Supabase if configured
            if (isSupabaseConfigured()) {
              try {
                const { data: existingProfile, error: fetchError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', kindeUser.id)
                  .single();

                if (fetchError && fetchError.code !== 'PGRST116') {
                  console.error('Error fetching profile from Supabase:', fetchError);
                }

                if (!existingProfile) {
                  // Create new profile in Supabase
                  const { data: newProfile, error: insertError } = await supabase
                    .from('profiles')
                    .insert(userData)
                    .select()
                    .single();

                  if (insertError) {
                    console.error('Error creating profile in Supabase:', insertError);
                  } else if (newProfile) {
                    console.log('Profile created in Supabase');
                  }
                } else {
                  console.log('Profile exists in Supabase');
                }
              } catch (supabaseError) {
                console.error('Supabase error (using localStorage fallback):', supabaseError);
              }
            } else {
              console.log('Supabase not configured, using localStorage');
            }
            
            // Save user to localStorage for persistence
            saveUserToLocal(userData);
            setUser(userData);
            setIsAuth(true);
          }
        } else {
          // Check if user is saved in localStorage (for returning users)
          const savedUser = getUserFromLocal();
          if (savedUser) {
            console.log('Found saved user in localStorage');
            setUser(savedUser);
            setIsAuth(true);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogout = async () => {
    await kindeLogout();
    clearUserFromLocal();
    setUser(null);
    setIsAuth(false);
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F7]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[#1877F2] animate-spin mb-4" />
          <p className="text-[#65676B]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuth) {
    return <LoginScreen />;
  }

  return <App user={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
