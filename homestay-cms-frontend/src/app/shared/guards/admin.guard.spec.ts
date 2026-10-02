import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, type UrlTree } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

function runGuard() {
  return TestBed.runInInjectionContext(() => Promise.resolve(adminGuard({} as never, {} as never)));
}

describe('adminGuard', () => {
  it('allows navigation when the current user is an admin', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { waitUntilInitialized: () => Promise.resolve(), isAdmin: () => true },
        },
      ],
    });

    const result = await runGuard();
    expect(result).toBe(true);
  });

  it('redirects to /admin/login when the current user is not an admin', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { waitUntilInitialized: () => Promise.resolve(), isAdmin: () => false },
        },
      ],
    });

    const result = await runGuard();
    expect(result).not.toBe(true);

    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as UrlTree)).toBe('/admin/login');
  });
});
