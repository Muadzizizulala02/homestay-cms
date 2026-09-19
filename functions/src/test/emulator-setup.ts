// Ensures tests always talk to the local Firestore emulator, never real infrastructure.
// `firebase emulators:exec` sets these automatically; the fallbacks below cover running
// `vitest run` directly against an emulator already started in another terminal.
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.GCLOUD_PROJECT ??= 'demo-test';
