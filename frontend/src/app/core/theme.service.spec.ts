import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
  });

  it('inicia com o tema orbital e o aplica ao documento', () => {
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('orbital');
    expect(document.documentElement.dataset['theme']).toBe('orbital');
  });

  it('alterna e persiste a preferência', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();

    expect(service.theme()).toBe('classic');
    expect(document.documentElement.dataset['theme']).toBe('classic');
    expect(localStorage.getItem('mad-theme')).toBe('classic');
  });
});
