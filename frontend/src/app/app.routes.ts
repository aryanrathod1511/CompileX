import { Routes } from '@angular/router';
import { ExecutorComponent } from './features/executor/executor.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cpp',
  },
  {
    path: ':lang',
    component: ExecutorComponent,
  },
  {
    path: '**',
    redirectTo: 'cpp',
  },
];
