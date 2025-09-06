import { writable } from 'svelte/store';

let initialTheme = 'light';
if (typeof localStorage !== 'undefined') {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') initialTheme = stored;
}

export const theme = writable(initialTheme);

theme.subscribe((value) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', value === 'dark');
    localStorage.setItem('theme', value);
  }
});
