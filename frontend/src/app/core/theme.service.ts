import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type AppTheme = 'classic' | 'orbital';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'mad-theme';
  readonly theme = signal<AppTheme>(this.savedTheme());

  constructor() { this.apply(this.theme()); }

  toggle(): void {
    const nextTheme: AppTheme = this.theme() === 'orbital' ? 'classic' : 'orbital';
    this.theme.set(nextTheme);
    this.apply(nextTheme);
    this.saveTheme(nextTheme);
  }

  private savedTheme(): AppTheme {
    try {
      const saved = this.document.defaultView?.localStorage.getItem(this.storageKey);
      return saved === 'classic' || saved === 'orbital' ? saved : 'orbital';
    } catch {
      return 'orbital';
    }
  }

  private saveTheme(theme: AppTheme): void {
    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, theme);
    } catch {
      // A aparência ainda é aplicada quando o navegador bloqueia o armazenamento local.
    }
  }

  private apply(theme: AppTheme): void {
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme === 'orbital' ? 'dark' : 'light';
  }
}
