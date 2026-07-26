import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, signal, effect, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Store } from '@ngrx/store';
import { LanguageOption, LANGUAGE_OPTIONS, Language } from '../../../../shared/models/execution.models';
import { selectLanguage, selectCode, selectIsDarkTheme, selectStatus } from '../../../../core/store/execution.selectors';
import { changeLanguage, updateCode, runCode, toggleTheme } from '../../../../core/store/execution.actions';

declare const require: any;
declare const monaco: any;

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editor.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef<HTMLDivElement>;

  readonly languages: LanguageOption[] = LANGUAGE_OPTIONS;
  private editor: any = null;
  private isUpdatingEditor = false;

  // Visual control states
  readonly showCopySuccess = signal<boolean>(false);

  private readonly store = inject(Store);
  private readonly platformId = inject(PLATFORM_ID);

  // Store selector signals
  readonly language = this.store.selectSignal(selectLanguage);
  readonly code = this.store.selectSignal(selectCode);
  readonly isDarkTheme = this.store.selectSignal(selectIsDarkTheme);
  readonly status = this.store.selectSignal(selectStatus);

  constructor() {
    // Dynamic theme listener
    effect(() => {
      const isDark = this.isDarkTheme();
      if (this.editor && typeof monaco !== 'undefined') {
        monaco.editor.setTheme(isDark ? 'customDark' : 'customLight');
      }
    });

    // Auto-update editor contents if changed externally (e.g. from sidebar resets)
    effect(() => {
      const codeVal = this.code();
      if (this.editor) {
        this.isUpdatingEditor = true;
        if (this.editor.getValue() !== codeVal) {
          this.editor.setValue(codeVal);
        }
        this.isUpdatingEditor = false;
      }
    });
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMonaco();
    }
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  /**
   * Action: Handles language selection changes, syncing the active Monaco editor model.
   */
  onLanguageSelect(lang: Language): void {
    this.store.dispatch(changeLanguage({ language: lang }));
    if (this.editor) {
      this.isUpdatingEditor = true;
      this.editor.setValue(this.code());
      const model = this.editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, this.mapLanguage(lang));
      }
      this.isUpdatingEditor = false;
    }
  }

  /**
   * Action: Dispatches the compile / run code trigger.
   */
  onRun(): void {
    this.store.dispatch(runCode());
  }

  /**
   * Action: Dispatches the theme toggle trigger.
   */
  onThemeToggle(): void {
    this.store.dispatch(toggleTheme());
  }

  /**
   * Action: Generates a state shareable URL and copies it to the clipboard.
   */
  onShare(): void {
    try {
      const state = {
        language: this.language(),
        code: this.code()
      };
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('share', serialized);
      const finalUrl = url.toString();

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(finalUrl).then(() => {
          this.showCopySuccess.set(true);
          setTimeout(() => this.showCopySuccess.set(false), 2000);
        });
      }
    } catch (err) {
      console.error('[EditorComponent] Failed to generate share link:', err);
    }
  }

  getActiveFilename(): string {
    const lang = this.language();
    const found = this.languages.find(l => l.value === lang);
    return found ? found.filename : 'main.cpp';
  }

  private mapLanguage(lang: Language): string {
    const map: Record<Language, string> = {
      python: 'python',
      r: 'r',
      sql: 'sql',
      html: 'html',
      java: 'java',
      kotlin: 'kotlin',
      c: 'c',
      cpp: 'cpp',
      csharp: 'csharp',
      javascript: 'javascript',
      typescript: 'typescript',
      go: 'go'
    };
    return map[lang] || 'plaintext';
  }

  private loadMonaco(): void {
    if (typeof monaco !== 'undefined') {
      this.initEditor();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.js';
    script.addEventListener('load', () => {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      require(['vs/editor/editor.main'], () => {
        this.initEditor();
      });
    });
    document.body.appendChild(script);
  }

  private initEditor(): void {
    if (!this.editorContainer) return;

    // Read theme colors dynamically from CSS variables
    const getCssVar = (name: string): string => {
      if (typeof window === 'undefined') return '';
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    };

    const darkBg = getCssVar('--monaco-dark-bg') || '#1c2130';
    const darkHighlight = getCssVar('--monaco-dark-highlight') || '#22293c';
    const lightBg = getCssVar('--monaco-light-bg') || '#faf6ee';
    const lightHighlight = getCssVar('--monaco-light-highlight') || '#f5eedc';

    // Define themes before creating the editor
    monaco.editor.defineTheme('customDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': darkBg,
        'editor.lineHighlightBackground': darkHighlight,
      }
    });

    monaco.editor.defineTheme('customLight', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': lightBg,
        'editor.lineHighlightBackground': lightHighlight,
      }
    });

    const activeTheme = this.isDarkTheme() ? 'customDark' : 'customLight';

    this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
      value: this.code(),
      language: this.mapLanguage(this.language()),
      theme: activeTheme,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "'Droid Sans Mono', 'Courier New', monospace",
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      tabSize: 4,
      insertSpaces: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 12, bottom: 12 }
    });

    this.editor.onDidChangeModelContent(() => {
      if (this.isUpdatingEditor) return;
      const val = this.editor.getValue();
      this.store.dispatch(updateCode({ code: val }));
    });
  }
}
