# HOMESTAY BOOKING CMS - PROJECT PLAN

## PROJECT OVERVIEW

**Project Name:** Homestay CMS (SPA)
**Scope:** Simple property booking platform with 2 user roles (Admin/Host, Guest)
**Tech Stack:** Angular + Firebase (serverless)
**Deployment:** Vercel + Firebase
**Estimated Cost:** $0-5/month

---

## TECH STACK CONFIRMATION

```
Frontend:        Angular 15+ (TypeScript)
Hosting:         Vercel (auto-deploy from GitHub)
Backend:         Firebase Cloud Functions (Node.js/TypeScript)
Database:        Firestore (NoSQL)
Authentication:  Firebase Auth
File Storage:    Cloudinary (images with CDN)
Payments:        Stripe (2.9% + $0.30 per transaction)
Email:           SendGrid / Firebase Email (free tier)
Package Manager: npm / yarn
Version Control: Git/GitHub
```

---

## FIRESTORE DATABASE SCHEMA

### Collection: `properties`
```
/properties/{propertyId}
{
  propertyId: string (auto-generated)
  name: string
  description: string
  hostId: string (reference to users collection)
  price: number (per night in RM/USD)
  currency: string ("MYR" | "USD")
  location: {
    address: string
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }
  images: string[] (Cloudinary URLs)
  amenities: string[] (["wifi", "kitchen", "ac", "parking"])
  maxGuests: number
  bedrooms: number
  bathrooms: number
  availability: {
    "2024-01-15": true,
    "2024-01-16": false
  }
  rules: string
  cancellationPolicy: string
  rating: number (0-5)
  reviewCount: number
  createdAt: timestamp
  updatedAt: timestamp
  isActive: boolean
}
```

### Collection: `bookings`
```
/bookings/{bookingId}
{
  bookingId: string (auto-generated)
  guestId: string (reference to users)
  hostId: string (reference to users)
  propertyId: string (reference to properties)
  checkInDate: string (YYYY-MM-DD)
  checkOutDate: string (YYYY-MM-DD)
  numberOfGuests: number
  numberOfNights: number
  pricePerNight: number
  totalPrice: number
  status: string ("pending" | "confirmed" | "cancelled" | "completed")
  paymentStatus: string ("unpaid" | "paid" | "refunded")
  paymentId: string (Stripe charge ID)
  guestNotes: string
  hostNotes: string
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Collection: `users`
```
/users/{userId}
{
  userId: string (Firebase Auth UID)
  email: string (unique, from Firebase Auth)
  name: string
  phone: string
  avatar: string (Cloudinary URL)
  role: string ("guest" | "host" | "admin")
  createdAt: timestamp
  
  // Host-specific fields
  hostProfile: {
    bio: string
    verificationStatus: string ("pending" | "verified" | "rejected")
    bankDetails: {
      accountHolder: string
      bankName: string
      accountNumber: string
      routingNumber: string
    }
    totalEarnings: number
    totalBookings: number
    averageRating: number
  }
  
  // Guest-specific fields
  guestProfile: {
    totalBookings: number
    averageRating: number
  }
}
```

### Collection: `payments`
```
/payments/{paymentId}
{
  paymentId: string (auto-generated)
  bookingId: string (reference)
  userId: string (guest who paid)
  amount: number
  currency: string
  stripeChargeId: string (unique Stripe ID)
  status: string ("pending" | "succeeded" | "failed" | "refunded")
  paymentMethod: string ("card" | "bank_transfer")
  failureReason: string (if status === "failed")
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Collection: `reviews`
```
/reviews/{reviewId}
{
  reviewId: string (auto-generated)
  bookingId: string (reference)
  guestId: string
  hostId: string
  propertyId: string
  rating: number (1-5)
  title: string
  comment: string
  cleanliness: number (1-5)
  communication: number (1-5)
  accuracy: number (1-5)
  createdAt: timestamp
  updatedAt: timestamp
}
```

---

## REST API ENDPOINTS (Cloud Functions)

### Authentication
```
POST   /api/v1/auth/register
       Body: { email, password, name, phone, role }
       Returns: { userId, token, user }

POST   /api/v1/auth/login
       Body: { email, password }
       Returns: { userId, token, user }

POST   /api/v1/auth/logout
       Returns: { success: true }

POST   /api/v1/auth/refresh-token
       Returns: { token }

GET    /api/v1/auth/me
       Headers: Authorization: Bearer {token}
       Returns: { user }
```

### Properties
```
GET    /api/v1/properties
       Query: ?city=KL&checkIn=2024-01-15&checkOut=2024-01-17&maxPrice=200
       Returns: { properties: [...], total, page }

GET    /api/v1/properties/{propertyId}
       Returns: { property, reviews, host }

POST   /api/v1/properties
       Auth: Bearer {token} (host only)
       Body: { name, description, price, location, amenities, ... }
       Returns: { propertyId, property }

PUT    /api/v1/properties/{propertyId}
       Auth: Bearer {token} (host only)
       Body: { name, description, price, ... }
       Returns: { property }

DELETE /api/v1/properties/{propertyId}
       Auth: Bearer {token} (host only)
       Returns: { success: true }

PUT    /api/v1/properties/{propertyId}/availability
       Auth: Bearer {token} (host only)
       Body: { availability: {"2024-01-15": true, "2024-01-16": false} }
       Returns: { property }
```

### Bookings
```
GET    /api/v1/bookings
       Auth: Bearer {token}
       Query: ?role=guest&status=pending
       Returns: { bookings: [...] }

GET    /api/v1/bookings/{bookingId}
       Auth: Bearer {token}
       Returns: { booking, property, guest, host }

POST   /api/v1/bookings
       Auth: Bearer {token} (guest only)
       Body: { propertyId, checkInDate, checkOutDate, numberOfGuests, notes }
       Returns: { bookingId, booking }

PUT    /api/v1/bookings/{bookingId}
       Auth: Bearer {token}
       Body: { status, hostNotes }
       Returns: { booking }

PUT    /api/v1/bookings/{bookingId}/status
       Auth: Bearer {token} (host only)
       Body: { status: "confirmed" | "cancelled" }
       Returns: { booking }
```

### Payments
```
POST   /api/v1/payments/intent
       Auth: Bearer {token} (guest only)
       Body: { bookingId, amount }
       Returns: { clientSecret, paymentIntentId }

POST   /api/v1/payments/confirm
       Auth: Bearer {token}
       Body: { paymentIntentId, paymentMethodId }
       Returns: { status: "succeeded" | "failed", payment }

GET    /api/v1/payments/{paymentId}
       Auth: Bearer {token}
       Returns: { payment }

POST   /api/v1/payments/{paymentId}/refund
       Auth: Bearer {token} (admin only)
       Body: { amount, reason }
       Returns: { refund }
```

### Reviews
```
POST   /api/v1/reviews
       Auth: Bearer {token} (guest only)
       Body: { bookingId, rating, title, comment, cleanliness, communication, accuracy }
       Returns: { reviewId, review }

GET    /api/v1/reviews
       Query: ?propertyId=prop123
       Returns: { reviews: [...] }
```

### Admin
```
GET    /api/v1/admin/dashboard
       Auth: Bearer {token} (admin only)
       Returns: { totalUsers, totalBookings, totalRevenue, activeProperties }

GET    /api/v1/admin/users
       Auth: Bearer {token} (admin only)
       Query: ?role=host&status=verified
       Returns: { users: [...] }

PUT    /api/v1/admin/users/{userId}/role
       Auth: Bearer {token} (admin only)
       Body: { role: "admin" | "host" | "guest" }
       Returns: { user }

DELETE /api/v1/admin/users/{userId}
       Auth: Bearer {token} (admin only)
       Returns: { success: true }
```

---

## ANGULAR PROJECT STRUCTURE

```
homestay-cms-frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.css
│   │   │   ├── register/
│   │   │   └── auth.service.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── firestore.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── role.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   └── models/
│   │   │       ├── user.model.ts
│   │   │       ├── property.model.ts
│   │   │       ├── booking.model.ts
│   │   │       └── payment.model.ts
│   │   │
│   │   ├── guest/
│   │   │   ├── property-list/
│   │   │   │   ├── property-list.component.ts
│   │   │   │   └── property-list.component.html
│   │   │   ├── property-detail/
│   │   │   │   ├── property-detail.component.ts
│   │   │   │   └── property-detail.component.html
│   │   │   ├── booking-form/
│   │   │   │   ├── booking-form.component.ts
│   │   │   │   └── booking-form.component.html
│   │   │   ├── my-bookings/
│   │   │   │   ├── my-bookings.component.ts
│   │   │   │   └── my-bookings.component.html
│   │   │   └── guest-layout/
│   │   │       ├── guest-layout.component.ts
│   │   │       └── guest-layout.component.html
│   │   │
│   │   ├── host/
│   │   │   ├── host-dashboard/
│   │   │   │   ├── host-dashboard.component.ts
│   │   │   │   └── host-dashboard.component.html
│   │   │   ├── create-property/
│   │   │   │   ├── create-property.component.ts
│   │   │   │   └── create-property.component.html
│   │   │   ├── manage-properties/
│   │   │   │   ├── manage-properties.component.ts
│   │   │   │   └── manage-properties.component.html
│   │   │   ├── manage-bookings/
│   │   │   │   ├── manage-bookings.component.ts
│   │   │   │   └── manage-bookings.component.html
│   │   │   └── host-layout/
│   │   │       ├── host-layout.component.ts
│   │   │       └── host-layout.component.html
│   │   │
│   │   ├── admin/
│   │   │   ├── admin-dashboard/
│   │   │   │   ├── admin-dashboard.component.ts
│   │   │   │   └── admin-dashboard.component.html
│   │   │   ├── manage-users/
│   │   │   │   ├── manage-users.component.ts
│   │   │   │   └── manage-users.component.html
│   │   │   ├── manage-reports/
│   │   │   └── admin-layout/
│   │   │
│   │   ├── core/
│   │   │   └── app.config.ts (Firebase config)
│   │   │
│   │   ├── app.module.ts
│   │   ├── app.component.ts
│   │   └── app-routing.module.ts
│   │
│   ├── assets/
│   │   ├── images/
│   │   └── styles/
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── main.ts
│   ├── index.html
│   └── styles.css
│
├── package.json
├── angular.json
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## FIREBASE FUNCTIONS STRUCTURE

```
functions/
├── src/
│   ├── index.ts                (entry point)
│   ├── config/
│   │   ├── firebase.ts         (Firebase init)
│   │   └── stripe.ts           (Stripe config)
│   │
│   ├── middleware/
│   │   ├── auth.ts             (JWT verification)
│   │   └── errorHandler.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts       (login, register, logout)
│   │   ├── properties.routes.ts (CRUD properties)
│   │   ├── bookings.routes.ts   (CRUD bookings)
│   │   ├── payments.routes.ts   (Stripe integration)
│   │   ├── reviews.routes.ts    (Create/read reviews)
│   │   └── admin.routes.ts      (Admin endpoints)
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── property.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── review.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      (Firebase Auth)
│   │   ├── firestore.service.ts (Database queries)
│   │   ├── stripe.service.ts    (Payment processing)
│   │   └── email.service.ts     (SendGrid)
│   │
│   └── types/
│       ├── User.ts
│       ├── Property.ts
│       ├── Booking.ts
│       ├── Payment.ts
│       └── Review.ts
│
├── package.json
├── tsconfig.json
└── .env.example
```

---

## IMPLEMENTATION ROADMAP

### PHASE 1: Setup & Authentication (Week 1)
- [ ] Create GitHub repo
- [ ] Initialize Angular project
- [ ] Set up Firebase project & Firestore
- [ ] Configure Firebase SDK in Angular
- [ ] Implement Firebase Auth (login/register)
- [ ] Create auth guard & interceptor
- [ ] Deploy frontend to Vercel
- [ ] Initialize Firebase Functions

### PHASE 2: Core Features - Guest Side (Week 2)
- [ ] Property listing page (GET /properties)
- [ ] Property detail page with images
- [ ] Search/filter functionality
- [ ] Booking form component
- [ ] My bookings page
- [ ] Booking cancellation

### PHASE 3: Core Features - Host Side (Week 3)
- [ ] Host dashboard
- [ ] Create/edit property
- [ ] Manage availability calendar
- [ ] View bookings
- [ ] Accept/reject bookings
- [ ] View earnings

### PHASE 4: Payment Integration (Week 4)
- [ ] Integrate Stripe SDK (frontend)
- [ ] Create payment intent Cloud Function
- [ ] Confirm payment endpoint
- [ ] Payment success/failure pages
- [ ] Automated payout to host
- [ ] Refund handling

### PHASE 5: Admin Panel (Week 5)
- [ ] Admin dashboard with stats
- [ ] Manage users
- [ ] View all bookings
- [ ] Manage reports
- [ ] User verification (host)

### PHASE 6: Polish & Deploy (Week 6)
- [ ] Reviews system
- [ ] Email notifications
- [ ] Error handling
- [ ] Performance optimization
- [ ] Security review
- [ ] Deploy to production

---

## KEY IMPLEMENTATION TASKS (Ready to Code)

### Task 1: Setup Angular Project
```bash
ng new homestay-cms-frontend
cd homestay-cms-frontend
npm install firebase @angular/fire
ng add @angular/material
```

### Task 2: Firebase Configuration
Create `src/app/core/app.config.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### Task 3: Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public collections
    match /properties/{propertyId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.hostId;
      allow create: if request.auth != null && request.auth.token.role == 'host';
    }
    
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    
    // User data
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || request.auth.token.role == 'admin');
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bookings
    match /bookings/{bookingId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.guestId || 
         request.auth.uid == resource.data.hostId ||
         request.auth.token.role == 'admin');
      allow write: if request.auth != null;
    }
    
    // Payments
    match /payments/{paymentId} {
      allow read: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

### Task 4: Auth Service (Angular)
Create `src/app/shared/services/auth.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { Firestore, collection, doc, setDoc } from 'firebase/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

interface User {
  uid: string;
  email: string;
  name: string;
  role: 'guest' | 'host' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private auth: Auth, private firestore: Firestore) {
    this.checkAuthStatus();
  }

  async register(email: string, password: string, name: string, role: 'guest' | 'host') {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;
    
    // Create user document
    await setDoc(doc(this.firestore, 'users', user.uid), {
      userId: user.uid,
      email: user.email,
      name,
      role,
      createdAt: new Date()
    });
    
    return user;
  }

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    return signOut(this.auth);
  }

  private checkAuthStatus() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch user details from Firestore
        const userDoc = await this.getUserFromFirestore(firebaseUser.uid);
        this.currentUserSubject.next(userDoc);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  private async getUserFromFirestore(uid: string): Promise<User> {
    // TODO: Implement Firestore fetch
    return {} as User;
  }
}
```

### Task 5: API Service (Angular)
Create `src/app/shared/services/api.service.ts`:
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Properties
  getProperties(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.baseUrl}/properties`, { params });
  }

  getProperty(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/properties/${id}`);
  }

  createProperty(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/properties`, data);
  }

  updateProperty(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/properties/${id}`, data);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/properties/${id}`);
  }

  // Bookings
  getBookings(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${this.baseUrl}/bookings`, { params });
  }

  createBooking(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/bookings`, data);
  }

  updateBookingStatus(id: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/bookings/${id}/status`, { status });
  }

  // Payments
  createPaymentIntent(bookingId: string, amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/intent`, { bookingId, amount });
  }

  confirmPayment(paymentIntentId: string, paymentMethodId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/payments/confirm`, { paymentIntentId, paymentMethodId });
  }
}
```

### Task 6: Firebase Cloud Functions - Auth
Create `functions/src/routes/auth.routes.ts`:
```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { generateToken } from '../middleware/auth';

const router = express.Router();
const db = admin.firestore();

router.post('/register', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create Firestore user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      email,
      name,
      phone,
      role,
      avatar: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      hostProfile: role === 'host' ? {
        bio: '',
        verificationStatus: 'pending',
        bankDetails: {},
        totalEarnings: 0,
        totalBookings: 0,
        averageRating: 0
      } : null,
      guestProfile: role === 'guest' ? {
        totalBookings: 0,
        averageRating: 0
      } : null
    });

    const token = await generateToken(userRecord.uid, role);

    res.status(201).json({
      userId: userRecord.uid,
      email,
      token,
      user: { uid: userRecord.uid, email, name, role }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    // Verify email and password (frontend should handle this with Firebase Auth)
    // This endpoint is for backend token generation
    const user = await db.collection('users').where('email', '==', email).limit(1).get();

    if (user.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = user.docs[0].data();
    const token = await generateToken(userDoc.userId, userDoc.role);

    res.json({
      userId: userDoc.userId,
      token,
      user: { uid: userDoc.userId, email: userDoc.email, name: userDoc.name, role: userDoc.role }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
```

---

## DEPLOYMENT CHECKLIST

### Firebase Setup
- [ ] Create Firebase project
- [ ] Enable Firestore Database
- [ ] Enable Authentication (Email/Password)
- [ ] Create Cloud Functions project
- [ ] Set environment variables for Stripe key

### Cloudinary Setup
- [ ] Create Cloudinary account
- [ ] Get API key
- [ ] Set upload preset

### Stripe Setup
- [ ] Create Stripe account
- [ ] Get publishable & secret keys
- [ ] Create webhook endpoint
- [ ] Test payment flow

### Vercel Setup
- [ ] Connect GitHub repository
- [ ] Set environment variables
- [ ] Configure build settings
- [ ] Set up custom domain

### Before Going Live
- [ ] All security rules configured
- [ ] Payment testing completed
- [ ] Email notifications working
- [ ] Error handling in place
- [ ] Rate limiting enabled
- [ ] Backup strategy configured
- [ ] Monitoring setup (Firebase alerts)

---

## ENVIRONMENT VARIABLES

### Frontend (.env / environment.ts)
```
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx

STRIPE_PUBLIC_KEY=pk_test_xxx
CLOUDINARY_CLOUD_NAME=xxx
API_URL=https://your-functions-url.cloudfunctions.net/api/v1
```

### Backend (.env in functions/)
```
STRIPE_SECRET_KEY=sk_test_xxx
FIREBASE_PROJECT_ID=xxx
SENDGRID_API_KEY=xxx
```

---

## TESTING CREDENTIALS

### Stripe Test Cards
```
4242 4242 4242 4242 - Success
5555 5555 5555 4444 - Decline
3782 822463 10005  - Amex
```

### Test Accounts
```
Admin: admin@test.com / password123
Host:  host@test.com / password123
Guest: guest@test.com / password123
```

---

## QUICK START COMMANDS

```bash
# Frontend
ng new homestay-cms-frontend
cd homestay-cms-frontend
npm install firebase @angular/fire @angular/material @stripe/stripe-js
ng serve

# Backend (Functions)
npm install -g firebase-tools
firebase init functions
cd functions
npm install express cors firebase-admin stripe
npm run deploy

# Deploy to Vercel
npm install -g vercel
vercel --prod
```

---

## NOTES

- Start with Firebase free tier (very generous)
- Use Firestore security rules to handle authorization
- Implement Stripe webhook for payment confirmations
- Send emails via SendGrid (free tier: 100/day)
- Use Cloudinary free tier for images (5GB storage)
- Monitor costs using Firebase console
- Scale up gradually as user base grows

---

## NEXT STEPS

1. Copy this plan into Claude Code
2. Ask Claude to generate specific components you want to build
3. Provide your Firebase config when needed
4. Build one feature at a time (auth → properties → bookings → payments)
5. Test thoroughly before deployment

---

**Last Updated:** 2024
**Status:** Ready for Implementation
**Estimated Timeline:** 6 weeks
