import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { DashboardComponent } from './pages/dashboard.component';
import { authGuard } from './core/auth.guard';
import { AssetDetailComponent } from './pages/asset-detail.component';
import { ProfileComponent } from './pages/profile.component';
import { RecordsComponent } from './pages/records.component';
import { PositionsComponent } from './pages/positions.component';
import { IncomesComponent } from './pages/incomes.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'assets/:walletId/:assetId', component: AssetDetailComponent, canActivate: [authGuard] },
  { path: 'wallets/:walletId/records', component: RecordsComponent, canActivate: [authGuard] },
  { path: 'wallets/:walletId/positions', component: PositionsComponent, canActivate: [authGuard] },
  { path: 'wallets/:walletId/incomes', component: IncomesComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
