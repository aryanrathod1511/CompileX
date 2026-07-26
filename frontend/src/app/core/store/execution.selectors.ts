import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExecutionState } from './execution.reducer';

export const selectExecutionState = createFeatureSelector<ExecutionState>('execution');

export const selectLanguage = createSelector(
  selectExecutionState,
  state => state.language
);

export const selectCode = createSelector(
  selectExecutionState,
  state => state.code
);

export const selectStatus = createSelector(
  selectExecutionState,
  state => state.status
);

export const selectOutput = createSelector(
  selectExecutionState,
  state => state.output
);

export const selectIsDarkTheme = createSelector(
  selectExecutionState,
  state => state.isDarkTheme
);
