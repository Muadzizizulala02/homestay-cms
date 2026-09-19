import { Injectable, signal } from '@angular/core';
import {
  getIdTokenResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../../core/firebase.config';

/**
 * Wraps Firebase Auth for the admin-only login flow. There is no guest auth and no
 * public registration — admin accounts are provisioned out-of-band
 * (see functions/scripts/create-admin.js).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _isAdmin = signal(false);
  private readonly _initialized = signal(false);

  readonly user = this._user.asReadonly();
  readonly isAdmin = this._isAdmin.asReadonly();

  private readonly initialAuthState: Promise<void>;

  constructor() {
    let resolveInitialAuthState!: () => void;
    this.initialAuthState = new Promise((resolve) => {
      resolveInitialAuthState = resolve;
    });

    onAuthStateChanged(auth, async (user) => {
      this._user.set(user);
      this._isAdmin.set(user ? (await getIdTokenResult(user)).claims['role'] === 'admin' : false);
      this._initialized.set(true);
      resolveInitialAuthState();
    });
  }

  /** Resolves once Firebase has determined the initial signed-in/out state at least once. */
  waitUntilInitialized(): Promise<void> {
    return this.initialAuthState;
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    return user ? user.getIdToken() : Promise.resolve(null);
  }
}
