import { Component, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { EditorComponent } from './components/editor/editor.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { LANGUAGE_OPTIONS, LanguageOption, Language } from '../../shared/models/execution.models';
import { changeLanguage } from '../../core/store/execution.actions';
import { selectLanguage, selectIsDarkTheme } from '../../core/store/execution.selectors';

@Component({
  selector: 'app-executor',
  standalone: true,
  imports: [CommonModule, EditorComponent, TerminalComponent],
  templateUrl: './executor.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class ExecutorComponent implements OnDestroy {
  readonly languages = LANGUAGE_OPTIONS;

  // Modal control states
  readonly showModal = signal<boolean>(false);
  readonly attemptedLanguage = signal<LanguageOption | null>(null);

  private readonly store = inject(Store);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Store selector signals
  readonly language = this.store.selectSignal(selectLanguage);
  readonly isDarkTheme = this.store.selectSignal(selectIsDarkTheme);

  private routeSub: Subscription | null = null;

  constructor() {
    // Action: Listen to language route parameter and dispatch theme actions
    this.routeSub = this.route.paramMap.subscribe(params => {
      const langParam = params.get('lang');
      if (langParam) {
        const matchedLang = this.languages.find(l => l.value === langParam);
        if (matchedLang) {
          if (matchedLang.isSupported) {
            this.store.dispatch(changeLanguage({ language: matchedLang.value }));
          } else {
            this.attemptedLanguage.set(matchedLang);
            this.showModal.set(true);
          }
        } else {
          this.router.navigate(['/cpp'], { replaceUrl: true });
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  /**
   * Action: Sanitizes SVG markup for safe browser rendering.
   */
  getSafeSvg(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  /**
   * Action: Navigates path routing to a newly selected language.
   */
  onSelectLanguage(lang: LanguageOption): void {
    this.router.navigate(['/', lang.value]);
  }

  /**
   * Action: Closes the sandbox warning modal and returns route path back to current active language.
   */
  closeModal(): void {
    this.showModal.set(false);
    this.attemptedLanguage.set(null);
    this.router.navigate(['/', this.language()]);
  }

  /**
   * Action: Dispatches navigation route switch to another active language, closing the modal.
   */
  switchToLanguage(langValue: Language): void {
    this.router.navigate(['/', langValue]);
    this.showModal.set(false);
    this.attemptedLanguage.set(null);
  }
}
