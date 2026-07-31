import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';
import { SystemModalComponent } from './system-modal.component';

describe('SystemModalComponent', () => {
  const mountedElements: HTMLElement[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SystemModalComponent] }).compileComponents();
  });

  afterEach(() => {
    mountedElements.splice(0).forEach(element => element.remove());
  });

  it('renderiza e confirma uma ação destrutiva personalizada', async () => {
    const fixture = TestBed.createComponent(SystemModalComponent);
    const modal = TestBed.inject(ModalService);
    const result = modal.confirm({
      title: 'Excluir carteira?', message: 'Todo o histórico será removido.',
      confirmLabel: 'Excluir carteira', cancelLabel: 'Manter carteira', danger: true
    });

    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.textContent).toContain('Excluir carteira?');
    expect(dialog.textContent).toContain('Manter carteira');
    dialog.querySelector('.danger-button').click();

    expect(await result).toBe(true);
    expect(modal.state()).toBeNull();
  });

  it('captura texto e permite cancelar pelo Escape', async () => {
    const fixture = TestBed.createComponent(SystemModalComponent);
    const component = fixture.componentInstance;
    const modal = TestBed.inject(ModalService);
    const promptResult = modal.prompt({
      title: 'Renomear carteira', message: 'Informe o novo nome.', inputLabel: 'Novo nome',
      initialValue: 'Principal', confirmLabel: 'Salvar nome'
    });
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Longo prazo'; input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.modal-actions .button:last-child').click();
    expect(await promptResult).toBe('Longo prazo');

    const confirmation = modal.confirm({ title: 'Sair?', message: 'Confirme.' });
    fixture.detectChanges();
    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await confirmation).toBe(false);
  });

  it('mantém o foco no diálogo e o devolve ao acionador ao fechar', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Excluir lançamento';
    document.body.appendChild(trigger);
    mountedElements.push(trigger);
    trigger.focus();

    const fixture = TestBed.createComponent(SystemModalComponent);
    document.body.appendChild(fixture.nativeElement);
    mountedElements.push(fixture.nativeElement);
    const modal = TestBed.inject(ModalService);
    const result = modal.confirm({
      title: 'Excluir lançamento?', message: 'O lançamento será removido.',
      confirmLabel: 'Excluir lançamento', cancelLabel: 'Manter lançamento', danger: true
    });

    fixture.detectChanges();
    await fixture.whenStable();
    const controls = (fixture.nativeElement as HTMLElement)
      .querySelectorAll<HTMLButtonElement>('.modal-actions button');
    const cancelButton = controls[0];
    const confirmButton = controls[1];
    expect(document.activeElement).toBe(cancelButton);

    confirmButton.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(cancelButton);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(confirmButton);

    cancelButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await result).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});
