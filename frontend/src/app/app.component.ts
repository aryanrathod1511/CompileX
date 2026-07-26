import { Component, Inject, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { LANGUAGE_OPTIONS } from './shared/models/execution.models';
import { selectLanguage, selectStatus, selectIsDarkTheme } from './core/store/execution.selectors';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent {
  private readonly store = inject(Store);

  readonly language = this.store.selectSignal(selectLanguage);
  readonly status = this.store.selectSignal(selectStatus);
  readonly isDarkTheme = this.store.selectSignal(selectIsDarkTheme);

  constructor() {
    // Dynamic theme effect applying class to document body for full viewport inheritance
    effect(() => {
      const isDark = this.isDarkTheme();
      if (typeof document !== 'undefined') {
        if (isDark) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
    });
  }

  get currentLanguageLabel(): string {
    const lang = this.language();
    const found = LANGUAGE_OPTIONS.find(l => l.value === lang);
    return found ? found.label : 'C++';
  }

  get statusLabel(): string {
    const status = this.status();
    const map: Record<typeof status, string> = {
      idle: 'Worker Idle',
      connecting: 'Connecting...',
      running: 'Running Code',
      finished: 'Completed',
      error: 'Worker Error',
    };
    return map[status];
  }

  get statusBadgeClass(): string {
    const status = this.status();
    const map: Record<typeof status, string> = {
      idle: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      connecting: 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse',
      running: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      finished: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      error: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return map[status];
  }

  get statusDotClass(): string {
    const status = this.status();
    const map: Record<typeof status, string> = {
      idle: 'bg-zinc-500',
      connecting: 'bg-amber-400 animate-ping',
      running: 'bg-emerald-400 animate-pulse',
      finished: 'bg-blue-400',
      error: 'bg-red-400',
    };
    return map[status];
  }
}
