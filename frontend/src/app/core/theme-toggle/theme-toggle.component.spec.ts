import { TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ThemeToggleComponent] }).compileComponents();
  });

  it('alterna entre os temas orbital e claro', () => {
    const fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(button.getAttribute('aria-label')).toBe('Ativar tema claro');
    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-label')).toBe('Ativar tema orbital');
    expect(document.documentElement.dataset['theme']).toBe('classic');
  });
});
