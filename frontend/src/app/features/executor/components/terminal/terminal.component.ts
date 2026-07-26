import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { ExecutionStatus } from '../../../../shared/models/execution.models';
import { selectStatus, selectOutput, selectIsDarkTheme } from '../../../../core/store/execution.selectors';
import { sendInput, clearOutput } from '../../../../core/store/execution.actions';

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminal.component.html',
  styles: [':host { display: block; height: 100%; }'],
})
export class TerminalComponent {
  @ViewChild('outputEl') private outputEl!: ElementRef<HTMLPreElement>;

  isFocused = false;

  private readonly store = inject(Store);

  // Store selector signals
  readonly status = this.store.selectSignal(selectStatus);
  readonly output = this.store.selectSignal(selectOutput);
  readonly isDarkTheme = this.store.selectSignal(selectIsDarkTheme);

  constructor() {
    // Autoscroll to bottom whenever output updates
    effect(() => {
      this.output(); // Access signal to register dependency
      
      // Delay slightly to allow DOM update
      setTimeout(() => {
        this.scrollToBottom();
      }, 20);
    });
  }

  /**
   * Action: Focuses the terminal output element.
   */
  focusTerminal(): void {
    if (this.outputEl) {
      this.outputEl.nativeElement.focus();
    }
  }

  /**
   * Action: Scrolls the terminal window to the bottom.
   */
  private scrollToBottom(): void {
    if (this.outputEl) {
      const el = this.outputEl.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  /**
   * Action: Captures raw keystrokes directly on the terminal output element and sends to container.
   */
  onTerminalKeydown(event: KeyboardEvent): void {
    if (!this.isInputEnabled) return;

    // Ignore modifier combinations
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    event.preventDefault(); // Prevent page scrolling, browser actions, tab switching

    let key = event.key;

    if (key === 'Enter') {
      key = '\n';
    } else if (key === 'Backspace') {
      key = '\b';
    } else if (key === 'Tab') {
      key = '\t';
    } else if (key.length > 1) {
      // Ignore keys like Escape, ArrowUp, ArrowDown, Shift, etc.
      return;
    }

    this.store.dispatch(sendInput({ input: key }));
  }

  /**
   * Action: Dispatches the clear output terminal buffer trigger.
   */
  onClearOutput(): void {
    this.store.dispatch(clearOutput());
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
