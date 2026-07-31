import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { authGuard } from './core/auth.guard';
import { AssetDetailComponent } from './pages/asset-detail.component';
import { ProfileComponent } from './pages/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'assets/:walletId/:assetId', component: AssetDetailComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
