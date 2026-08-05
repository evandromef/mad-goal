import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MotionOverlayDirective } from './motion-overlay.directive';

describe('MotionOverlayDirective', () => {
  function createDirective(element: HTMLElement): MotionOverlayDirective {
    TestBed.configureTestingModule({ providers: [{ provide: ElementRef, useValue: new ElementRef(element) }] });
    return TestBed.runInInjectionContext(() => new MotionOverlayDirective());
  }

  it('torna o overlay inerte e oculto para acessibilidade ao iniciar a saída', () => {
    const overlay = document.createElement('div');
    const event = {
      animationName: 'motion-fade-out',
      target: overlay,
      currentTarget: overlay,
    } as unknown as AnimationEvent;

    createDirective(overlay).onAnimationStart(event);

    expect(overlay.inert).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('mantém o overlay interativo durante a entrada', () => {
    const overlay = document.createElement('div');
    const event = {
      animationName: 'motion-fade-in',
      target: overlay,
      currentTarget: overlay,
    } as unknown as AnimationEvent;

    createDirective(overlay).onAnimationStart(event);

    expect(overlay.inert).not.toBe(true);
    expect(overlay.hasAttribute('aria-hidden')).toBe(false);
  });

  it('torna o menu inerte quando sua animação de saída começa', () => {
    const menu = document.createElement('div');
    const event = { animationName: 'motion-menu-out', target: menu, currentTarget: menu } as unknown as AnimationEvent;

    createDirective(menu).onAnimationStart(event);

    expect(menu.inert).toBe(true);
    expect(menu.getAttribute('aria-hidden')).toBe('true');
  });

  it('torna campos condicionais inertes durante a saída', () => {
    const field = document.createElement('div');
    const event = {
      animationName: 'motion-field-out',
      target: field,
      currentTarget: field,
    } as unknown as AnimationEvent;

    createDirective(field).onAnimationStart(event);

    expect(field.inert).toBe(true);
    expect(field.getAttribute('aria-hidden')).toBe('true');
  });

  it('permite desativar o overlay antes do primeiro quadro da animação', () => {
    const overlay = document.createElement('div');

    createDirective(overlay).deactivate(overlay);

    expect(overlay.inert).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('desativa o elemento quando a diretiva é destruída no início de uma saída condicional', () => {
    const overlay = document.createElement('div');
    const directive = createDirective(overlay);

    directive.ngOnDestroy();

    expect(overlay.inert).toBe(true);
    expect(overlay.getAttribute('aria-hidden')).toBe('true');
  });

  it('ignora animações iniciadas em elementos descendentes', () => {
    const overlay = document.createElement('div');
    const field = document.createElement('div');
    overlay.append(field);
    const event = {
      animationName: 'motion-field-out',
      target: field,
      currentTarget: overlay,
    } as unknown as AnimationEvent;

    createDirective(overlay).onAnimationStart(event);

    expect(overlay.inert).not.toBe(true);
    expect(overlay.hasAttribute('aria-hidden')).toBe(false);
  });
});
