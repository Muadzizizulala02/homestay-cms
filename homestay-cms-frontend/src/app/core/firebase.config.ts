import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

const app = initializeApp(environment.firebase);
export const auth = getAuth(app);

// environment.development.ts (used by `ng serve`) is the only place production is false —
// this must never run against real Firebase Auth.
if (!environment.production) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}
