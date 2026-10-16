/// <reference types="astro/client" />

interface WindowEventMap {
  toast: CustomEvent<{ message: string; tone?: 'success' | 'error' }>;
}
