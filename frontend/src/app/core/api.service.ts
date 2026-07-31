import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthResponse { token: string; id: string; name: string; email: string; }
export interface Wallet { id: string; name: string; }
export interface Asset {
  id: string; ticker: string; name: string; category: 'ACAO' | 'FII';
  currentPrice: number; priceDate: string;
}
export interface Position {
  assetId: string; ticker: string; name: string; category: string; quantity: number;
  acquisitionCost: number; currentPrice: number; currentValue: number; profitLoss: number;
  returnPercentage: number | null; allocationPercentage: number; priceDate: string;
}
export interface Dashboard {
  acquisitionCost: number; currentValue: number; profitLoss: number;
  returnPercentage: number | null; totalIncome: number; largestPosition: string | null;
  categories: { category: string; acquisitionCost: number; currentValue: number; allocationPercentage: number }[];
  positions: Position[]; evolution: { period: string; acquisitionCost: number }[];
}
export interface LedgerItem {
  id: string; walletId: string; assetId: string; ticker: string; type: string; date: string;
  quantity?: number; totalValue?: number; newQuantity?: number; description?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', body);
  }
  register(body: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', body);
  }
  wallets(): Observable<Wallet[]> { return this.http.get<Wallet[]>('/api/wallets'); }
  createWallet(name: string): Observable<Wallet> { return this.http.post<Wallet>('/api/wallets', { name }); }
  assets(): Observable<Asset[]> { return this.http.get<Asset[]>('/api/assets'); }
  dashboard(walletId: string): Observable<Dashboard> {
    return this.http.get<Dashboard>(`/api/dashboard/${walletId}`);
  }
  records(walletId: string): Observable<LedgerItem[]> {
    return this.http.get<LedgerItem[]>('/api/records', { params: { walletId } });
  }
  createRecord(body: Record<string, unknown>): Observable<LedgerItem> {
    return this.http.post<LedgerItem>('/api/records', body);
  }
}

