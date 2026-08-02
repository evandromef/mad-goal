import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AppComponent } from './app.component';

@Component({ template: '<main>Conteúdo principal</main>' })
class RoutedPageComponent {}

describe('AppComponent', () => {
  it('deve criar a aplicação', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: RoutedPageComponent }])]
    }).compileComponents();
    expect(TestBed.createComponent(AppComponent).componentInstance).toBeTruthy();
  });

  it('mantém apenas o landmark main fornecido pela página roteada', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: RoutedPageComponent }])]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('main')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.route-content')).toBeTruthy();
  });

  it('disponibiliza a alternância de tema em todas as rotas', async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([{ path: '', component: RoutedPageComponent }])]
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('.theme-toggle');
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-label')).toBe('Ativar tema claro');

    toggle.click();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('classic');
    expect(toggle.getAttribute('aria-label')).toBe('Ativar tema orbital');
  });
});
