import { createReducer, on } from '@ngrx/store';
import { Language, ExecutionStatus, LANGUAGE_OPTIONS } from '../../shared/models/execution.models';
import * as ExecutionActions from './execution.actions';

export interface ExecutionState {
  language: Language;
  code: string;
  status: ExecutionStatus;
  output: string;
  isDarkTheme: boolean;
}

// Helper: resets code template for selected language
function getTemplateForLanguage(lang: Language): string {
  const option = LANGUAGE_OPTIONS.find(l => l.value === lang);
  return option ? option.defaultCode : '';
}

export const initialState: ExecutionState = {
  language: 'cpp',
  code: getTemplateForLanguage('cpp'),
  status: 'idle',
  output: '',
  isDarkTheme: false,
};

function processTerminalOutput(prev: string, chunk: string): string {
  // 1. Strip ANSI escape codes
  const ansiRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
  const cleanChunk = chunk.replace(ansiRegex, '');

  // 2. Process backspace (\b or \x08 or \x7f delete)
  let output = prev;
  for (let i = 0; i < cleanChunk.length; i++) {
    const char = cleanChunk[i];
    if (char === '\b' || char === '\x7f') {
      if (output.length > 0) {
        if (output.endsWith('\n')) {
          continue;
        }
        output = output.slice(0, -1);
      }
    } else {
      output += char;
    }
  }
  return output;
}

export const executionReducer = createReducer(
  initialState,
  on(ExecutionActions.changeLanguage, (state, { language }) => {
    // Only reset code if the language actually changes
    if (state.language === language) {
      return state;
    }
    return {
      ...state,
      language,
      code: getTemplateForLanguage(language),
      status: 'idle' as ExecutionStatus,
      output: ''
    };
  }),
  on(ExecutionActions.updateCode, (state, { code }) => ({
    ...state,
    code
  })),
  on(ExecutionActions.setStatus, (state, { status }) => ({
    ...state,
    status
  })),
  on(ExecutionActions.appendOutput, (state, { chunk }) => ({
    ...state,
    output: processTerminalOutput(state.output, chunk)
  })),
  on(ExecutionActions.clearOutput, state => ({
    ...state,
    output: ''
  })),
  on(ExecutionActions.toggleTheme, state => ({
    ...state,
    isDarkTheme: !state.isDarkTheme
  })),
  on(ExecutionActions.loadSharedState, (state, { language, code }) => ({
    ...state,
    language,
    code,
    status: 'idle' as ExecutionStatus,
    output: ''
  }))
);
