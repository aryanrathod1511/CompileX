import { createAction, props } from '@ngrx/store';
import { Language, ExecutionStatus } from '../../shared/models/execution.models';

/**
 * Action: Changes active compiler language.
 */
export const changeLanguage = createAction(
  '[Execution] Change Language',
  props<{ language: Language }>()
);

/**
 * Action: Updates active code contents in the Monaco editor.
 */
export const updateCode = createAction(
  '[Execution] Update Code',
  props<{ code: string }>()
);

/**
 * Action: Initiates compilation/sandbox container execution.
 */
export const runCode = createAction(
  '[Execution] Run Code'
);

/**
 * Action: Updates execution lifecycle status.
 */
export const setStatus = createAction(
  '[Execution] Set Status',
  props<{ status: ExecutionStatus }>()
);

/**
 * Action: Appends standard output/error stream chunks to terminal.
 */
export const appendOutput = createAction(
  '[Execution] Append Output',
  props<{ chunk: string }>()
);

/**
 * Action: Clears terminal output buffers.
 */
export const clearOutput = createAction(
  '[Execution] Clear Output'
);

/**
 * Action: Sends raw keyboard inputs to active stdin buffer.
 */
export const sendInput = createAction(
  '[Execution] Send Input',
  props<{ input: string }>()
);

/**
 * Action: Toggles between light and dark theme variables.
 */
export const toggleTheme = createAction(
  '[Execution] Toggle Theme'
);

/**
 * Action: Loads shared state variables from query search parameters.
 */
export const loadSharedState = createAction(
  '[Execution] Load Shared State',
  props<{ language: Language; code: string }>()
);
