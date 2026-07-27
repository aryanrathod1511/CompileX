import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  AfterViewInit,
  DestroyRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ExecutionStatus } from '../../../../shared/models/execution.models';
import { selectStatus, selectOutput, selectIsDarkTheme } from '../../../../core/store/execution.selectors';
import { sendInput, clearOutput } from '../../../../core/store/execution.actions';
import * as ExecutionActions from '../../../../core/store/execution.actions';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class TerminalComponent implements AfterViewInit {
  @ViewChild('terminalContainer') private terminalContainer!: ElementRef<HTMLDivElement>;

  private terminal!: Terminal;
  private fitAddon!: FitAddon;
  private isInitialized = false;
  private echoQueue: string[] = [];

  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);

  // Store selector signals
  readonly status = this.store.selectSignal(selectStatus);
  readonly output = this.store.selectSignal(selectOutput);
  readonly isDarkTheme = this.store.selectSignal(selectIsDarkTheme);

  constructor() {
    // Dynamic theme adjustment effect
    effect(() => {
      const isDark = this.isDarkTheme();
      if (this.terminal) {
        this.applyTheme(isDark);
      }
    });

    // Dynamic status indicator effect
    effect(() => {
      const currentStatus = this.status();
      if (this.terminal && this.isInitialized) {
        if (currentStatus === 'finished') {
          this.terminal.write('\r\n\x1b[1;32m=== Code Execution Successful ===\x1b[0m\r\n');
        } else if (currentStatus === 'error') {
          this.terminal.write('\r\n\x1b[1;31m=== Code Execution Failed ===\x1b[0m\r\n');
        } else if (currentStatus === 'connecting') {
          this.echoQueue = [];
        }
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    // Initialize Terminal instance
    this.terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'underline',
      fontSize: 13.5,
      fontFamily: 'monospace',
      rows: 20,
      convertEol: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);

    // Apply the active theme
    this.applyTheme(this.isDarkTheme());

    // Open terminal inside container element
    this.terminal.open(this.terminalContainer.nativeElement);

    // Fit to container dimensions
    setTimeout(() => {
      this.fitAddon.fit();
    }, 50);

    // Write initial output buffer if any exists in store
    const initialOutput = this.output();
    if (initialOutput) {
      this.terminal.write(initialOutput);
    }

    // Connect NgRx actions to terminal output updates with echo canceling
    this.actions$.pipe(
      ofType(ExecutionActions.appendOutput),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({ chunk }) => {
      let processedChunk = '';
      let i = 0;

      while (i < chunk.length) {
        // Match and skip ANSI escape sequences so we don't block them
        const ansiMatch = chunk.slice(i).match(/^[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/);
        if (ansiMatch) {
          processedChunk += ansiMatch[0];
          i += ansiMatch[0].length;
          continue;
        }

        // Match and filter out the expected keystroke echoes
        if (this.echoQueue.length > 0) {
          const nextEcho = this.echoQueue[0];
          if (chunk.slice(i).startsWith(nextEcho)) {
            this.echoQueue.shift();
            i += nextEcho.length;
            continue;
          }
        }

        // Keep standard output characters
        processedChunk += chunk[i];
        i++;
      }

      if (processedChunk.length > 0) {
        this.terminal.write(processedChunk);
      }
    });

    this.actions$.pipe(
      ofType(ExecutionActions.clearOutput),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.terminal.clear();
      this.echoQueue = [];
    });

    // Capture input keystrokes from xterm and dispatch to active container stdin
    this.terminal.onData((data) => {
      if (this.isInputEnabled) {
        // Optimistic local echo: render character instantly
        if (data === '\u007f') {
          this.terminal.write('\b \b'); // backspace, space, backspace to delete on screen
          this.echoQueue.push('\b \b');  // expect backspace echo sequence
        } else if (data === '\r') {
          this.terminal.write('\r\n');
          this.echoQueue.push('\r\n');  // expect newline echo sequence
        } else {
          this.terminal.write(data);
          this.echoQueue.push(data);
        }
        this.store.dispatch(sendInput({ input: data }));
      }
    });

    this.isInitialized = true;
  }

  /**
   * Action: Focuses the terminal.
   */
  focusTerminal(): void {
    if (this.terminal) {
      this.terminal.focus();
    }
  }

  /**
   * Action: Dispatches the clear output action.
   */
  onClearOutput(): void {
    this.store.dispatch(clearOutput());
  }

  /**
   * Window resize handler to fit terminal canvas
   */
  @HostListener('window:resize')
  onResize(): void {
    if (this.fitAddon) {
      this.fitAddon.fit();
    }
  }

  private applyTheme(isDark: boolean): void {
    this.terminal.options.theme = isDark ? {
      background: '#1c2130',
      foreground: '#f4f4f5',
      cursor: '#818cf8',
      selectionBackground: 'rgba(129, 140, 248, 0.3)'
    } : {
      background: '#faf6ee',
      foreground: '#3e382f',
      cursor: '#6c5f4c',
      selectionBackground: 'rgba(108, 95, 76, 0.3)'
    };
  }

  get statusLabel(): string {
    const status = this.status();
    const map: Record<ExecutionStatus, string> = {
      idle: 'Idle',
      connecting: 'Connecting…',
      running: 'Running',
      finished: 'Finished',
      error: 'Error',
    };
    return map[status];
  }

  get statusClass(): string {
    return `status-${this.status()}`;
  }

  get isInputEnabled(): boolean {
    return this.status() === 'running';
  }
}
