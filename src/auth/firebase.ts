import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { config, missingConfig } from '../config';

// Si falta configuración no inicializamos Firebase (la app muestra el error).
const app = missingConfig.length === 0 ? initializeApp(config.firebase) : null;

export const firebaseAuth = app ? getAuth(app) : null;

if (firebaseAuth) {
  firebaseAuth.languageCode = 'es';
  if (config.authEmulatorUrl) {
    connectAuthEmulator(firebaseAuth, config.authEmulatorUrl, { disableWarnings: true });
  }
}
