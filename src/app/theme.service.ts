import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('dark');

  constructor() {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) this.theme.set(savedTheme);
    }

    effect(() => {
      const currentTheme = this.theme();
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', currentTheme);
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }
}
