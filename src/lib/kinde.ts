import createKindeClient from "@kinde-oss/kinde-auth-pkce-js";

const kindeClientId = import.meta.env.VITE_KINDE_CLIENT_ID || '517daa7ee99746e69b6da5e2081e1be9';
const kindeDomain = import.meta.env.VITE_KINDE_DOMAIN || 'https://teamconnect.kinde.com';
const redirectUri = import.meta.env.VITE_KINDE_REDIRECT_URI || window.location.origin;

export let kinde: any = null;
export let kindeInitError: Error | null = null;

export async function initKinde() {
  if (!kinde) {
    try {
      console.log('Initializing Kinde with:', {
        client_id: kindeClientId?.substring(0, 10) + '...',
        domain: kindeDomain,
        redirect_uri: redirectUri,
      });
      
      kinde = await createKindeClient({
        client_id: kindeClientId,
        domain: kindeDomain,
        redirect_uri: redirectUri,
      });
      
      console.log('Kinde initialized successfully');
      kindeInitError = null;
    } catch (error) {
      console.error('Kinde initialization failed:', error);
      kindeInitError = error as Error;
      throw error;
    }
  }
  return kinde;
}

export function getKindeInitError() {
  return kindeInitError;
}

export function loginWithRedirect(params?: { connection_id?: string }) {
  if (kinde) {
    kinde.login(params);
  } else {
    console.error('Kinde not initialized');
  }
}

export function registerWithRedirect(params?: { connection_id?: string }) {
  if (kinde) {
    kinde.register(params);
  } else {
    console.error('Kinde not initialized');
  }
}

export function logout() {
  if (kinde) {
    kinde.logout();
  }
}

export function getUser() {
  return kinde?.getUser() || null;
}

export function isAuthenticated() {
  return kinde?.isAuthenticated() || false;
}

export async function getToken() {
  return kinde?.getToken() || null;
}


