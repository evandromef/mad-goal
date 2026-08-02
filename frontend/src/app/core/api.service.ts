import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthResponse { token: string; refreshToken: string; id: string; name: string; email: string; }
export interface PendingResponse { message: string; verificationToken: string | null; }
export interface Wallet { id: string; name: string; currentValue: number | null; }
export interface Asset {
  id: string; ticker: string; name: string; category: 'ACAO' | 'FII';
  currentPrice: number | null; priceDate: string | null;
}
export interface Position {
  assetId: string; ticker: string; name: string; category: string; quantity: number;
  acquisitionCost: number; currentPrice: number | null; currentValue: number | null; profitLoss: number | null;
  returnPercentage: number | null; allocationPercentage: number | null; totalIncome: number; priceDate: string | null;
}
export interface Dashboard {
  acquisitionCost: number; currentValue: number | null; profitLoss: number | null;
  returnPercentage: number | null; totalIncome: number; largestPosition: string | null;
  categories: { category: string; acquisitionCost: number; currentValue: number | null; profitLoss: number | null; returnPercentage: number | null; allocationPercentage: number | null }[];
  positions: Position[]; evolution: { period: string; acquisitionCost: number }[];
}
export interface Note {
  id: string; walletId: string; assetId: string; ticker: string; content: string;
  createdAt: string; updatedAt: string;
}
export interface IncomeResponse {
  total: number;
  groups: { period: string; total: number }[];
  items: { id: string; assetId: string; ticker: string; category: string; type: string; date: string; totalValue: number }[];
}
export interface Profile { id: string; name: string; email: string; }
export interface LedgerItem {
  id: string; walletId: string; assetId: string; ticker: string; type: string; date: string;
  quantity?: number; unitPrice?: number; fees?: number; totalValue?: number;
  newQuantity?: number; ratio?: string; description?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', body);
  }
  register(body: { name: string; email: string; password: string }): Observable<PendingResponse> {
    return this.http.post<PendingResponse>('/api/auth/register', body);
  }
  confirmEmail(token: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/confirm-email', { token });
  }
  forgotPassword(email: string): Observable<PendingResponse> {
    return this.http.post<PendingResponse>('/api/auth/forgot-password', { email });
  }
  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', { token, password });
  }
  googleLogin(credential: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/google', { credential });
  }
  authConfig(): Observable<{ googleClientId: string }> {
    return this.http.get<{ googleClientId: string }>('/api/auth/config');
  }
  wallets(): Observable<Wallet[]> { return this.http.get<Wallet[]>('/api/wallets'); }
  createWallet(name: string): Observable<Wallet> { return this.http.post<Wallet>('/api/wallets', { name }); }
  updateWallet(id: string, name: string): Observable<Wallet> { return this.http.put<Wallet>(`/api/wallets/${id}`, { name }); }
  deleteWallet(id: string): Observable<void> {
    return this.http.delete<void>(`/api/wallets/${id}`, { params: { confirm: true } });
  }
  assets(): Observable<Asset[]> { return this.http.get<Asset[]>('/api/assets'); }
  dashboard(walletId: string, granularity: 'MONTHLY' | 'YEARLY' = 'MONTHLY'): Observable<Dashboard> {
    return this.http.get<Dashboard>(`/api/dashboard/${walletId}`, { params: { granularity } });
  }
  records(walletId: string): Observable<LedgerItem[]> {
    return this.http.get<LedgerItem[]>('/api/records', { params: { walletId } });
  }
  createRecord(body: Record<string, unknown>): Observable<LedgerItem> {
    return this.http.post<LedgerItem>('/api/records', body);
  }
  updateRecord(id: string, body: Record<string, unknown>): Observable<LedgerItem> {
    return this.http.put<LedgerItem>(`/api/records/${id}`, body);
  }
  deleteRecord(id: string): Observable<void> {
    return this.http.delete<void>(`/api/records/${id}`);
  }
  notes(walletId: string, assetId: string): Observable<Note[]> {
    return this.http.get<Note[]>('/api/notes', { params: { walletId, assetId } });
  }
  createNote(body: { walletId: string; assetId: string; content: string }): Observable<Note> {
    return this.http.post<Note>('/api/notes', body);
  }
  updateNote(id: string, body: { walletId: string; assetId: string; content: string }): Observable<Note> {
    return this.http.put<Note>(`/api/notes/${id}`, body);
  }
  deleteNote(id: string): Observable<void> { return this.http.delete<void>(`/api/notes/${id}`); }
  incomes(walletId: string, filters: Record<string, string>): Observable<IncomeResponse> {
    return this.http.get<IncomeResponse>('/api/incomes', { params: { walletId, ...filters } });
  }
  profile(): Observable<Profile> { return this.http.get<Profile>('/api/auth/me'); }
  updateProfile(body: { name: string; email: string }): Observable<Profile> {
    return this.http.put<Profile>('/api/profile', body);
  }
  deleteProfile(): Observable<void> { return this.http.delete<void>('/api/profile', { params: { confirm: true } }); }
}
