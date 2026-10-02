// Used by `ng serve`. Everything here talks to local emulators, so the Firebase values
// don't need to be real — only `projectId` matters, and it must match the project the
// running `firebase emulators:start` instance is serving (.firebaserc's default).
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:5001/homestay-cms/us-central1/api/v1',
  firebase: {
    apiKey: 'demo-api-key',
    authDomain: 'homestay-cms.firebaseapp.com',
    projectId: 'homestay-cms',
    storageBucket: 'homestay-cms.appspot.com',
    messagingSenderId: 'demo-sender-id',
    appId: 'demo-app-id',
  },
};
