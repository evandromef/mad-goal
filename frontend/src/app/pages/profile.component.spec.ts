import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { SessionService } from '../core/session.service';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  const api = { profile: vi.fn(), updateProfile: vi.fn(), deleteProfile: vi.fn() };
  const session = { clear: vi.fn() };
  beforeEach(async () => {
    api.profile.mockReturnValue(of({ id: 'u1', name: 'Ana', email: 'ana@example.com' }));
    api.updateProfile.mockReturnValue(of({ id: 'u1', name: 'Ana Nova', email: 'ana@example.com' }));
    api.deleteProfile.mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({ imports: [ProfileComponent], providers: [
      provideRouter([]), { provide: ApiService, useValue: api }, { provide: SessionService, useValue: session }
    ] }).compileComponents();
  });
  it('carrega, atualiza e exclui o perfil confirmado', () => {
    const fixture = TestBed.createComponent(ProfileComponent); const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.form.getRawValue().name).toBe('Ana');
    component.form.setValue({ name: 'Ana Nova', email: 'ana@example.com' }); component.save();
    expect(component.message()).toContain('sucesso');
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true); component.remove();
    expect(api.deleteProfile).toHaveBeenCalled(); expect(session.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
