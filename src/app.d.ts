// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// PWA Type Declarations
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }

  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};
