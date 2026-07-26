import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, EMPTY, Observable, Observer, defer } from 'rxjs';
import { switchMap, withLatestFrom, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import * as ExecutionActions from './execution.actions';
import { selectCode, selectLanguage } from './execution.selectors';

@Injectable()
export class ExecutionEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private socket: WebSocket | null = null;

  /**
   * Effect: Handles websocket creation and reactive stream lifecycle upon runCode trigger.
   */
  runCode$ = createEffect(() => this.actions$.pipe(
    ofType(ExecutionActions.runCode),
    withLatestFrom(
      this.store.select(selectLanguage),
      this.store.select(selectCode)
    ),
    switchMap(([action, lang, code]) => {
      return this.connectWebSocket(lang, code);
    })
  ));

  /**
   * Effect: Dispatches inputs directly to active docker stdin buffers.
   */
  sendInput$ = createEffect(() => this.actions$.pipe(
    ofType(ExecutionActions.sendInput),
    tap(({ input }) => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        const packet = { type: 'input', input };
        this.socket.send(JSON.stringify(packet));
      }
    })
  ), { dispatch: false });

  /**
   * Effect: Automatically terminates active docker containers when the compiler language is changed.
   */
  closeOnLanguageChange$ = createEffect(() => this.actions$.pipe(
    ofType(ExecutionActions.changeLanguage),
    tap(() => {
      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }
    })
  ), { dispatch: false });

  /**
   * Effect: Parses shared workspace snapshots from base64 URL query params on startup.
   */
  init$ = createEffect(() => defer(() => {
    if (typeof window === 'undefined') return EMPTY;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const shareData = urlParams.get('share');
      if (shareData) {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(shareData))));
        if (decoded.language && typeof decoded.code === 'string') {
          return of(ExecutionActions.loadSharedState({ language: decoded.language, code: decoded.code }));
        }
      }
    } catch (err) {
      console.error('[ExecutionEffects] Failed to load share data from URL:', err);
    }
    return EMPTY;
  }));

  /**
   * Helper: Connects the websocket stream reactively, wrapping lifetime hooks inside an Observable.
   */
  private connectWebSocket(lang: string, code: string): Observable<any> {
    return new Observable((observer: Observer<any>) => {
      try {
        const socket = new WebSocket(environment.wsUrl);
        this.socket = socket;

        socket.onopen = () => {
          observer.next(ExecutionActions.setStatus({ status: 'running' }));
          const initPacket = { type: 'init', language: lang, code };
          socket.send(JSON.stringify(initPacket));
        };

        socket.onmessage = (event) => {
          const data = typeof event.data === 'string' ? event.data : event.data.toString();
          observer.next(ExecutionActions.appendOutput({ chunk: data }));
        };

        socket.onerror = () => {
          observer.next(ExecutionActions.setStatus({ status: 'error' }));
          observer.next(ExecutionActions.appendOutput({ 
            chunk: '\n[Connection Error] The backend is unreachable. Make sure the server is running.\n' 
          }));
        };

        socket.onclose = () => {
          observer.next(ExecutionActions.setStatus({ status: 'finished' }));
          observer.complete();
        };

        return () => {
          if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
            socket.close();
          }
          if (this.socket === socket) {
            this.socket = null;
          }
        };

      } catch (err: any) {
        observer.next(ExecutionActions.setStatus({ status: 'error' }));
        observer.next(ExecutionActions.appendOutput({ 
          chunk: `\n[System Error] Failed to initialize WebSocket: ${err.message}\n` 
        }));
        observer.complete();
      }
    });
  }
}
