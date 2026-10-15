// Lee y valida la configuración pública del frontend (variables VITE_).
// Estas variables NO son secretas: terminan dentro del JavaScript del navegador.

const required = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** Variables faltantes; si hay alguna, la app muestra un mensaje en lugar de fallar en silencio. */
export const missingConfig = Object.entries(required)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const config = {
  apiUrl: (required.VITE_API_URL ?? '').replace(/\/$/, ''),
  firebase: {
    apiKey: required.VITE_FIREBASE_API_KEY,
    authDomain: required.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: required.VITE_FIREBASE_PROJECT_ID,
    appId: required.VITE_FIREBASE_APP_ID,
  },
  authEmulatorUrl: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL,
};
