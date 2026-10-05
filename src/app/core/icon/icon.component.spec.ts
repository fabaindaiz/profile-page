import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  async function render(name: string): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentRef.setInput('name', name);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws a generated icon in the current colour', async () => {
    const svg = (await render('fa-solid-bars')).querySelector('svg');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
  });

  it('ignores the old icon fonts\' extra class words', async () => {
    expect((await render('devicon-debian-plain colored')).querySelector('svg')).not.toBeNull();
  });

  it('draws nothing for a name that was not generated', async () => {
    expect((await render('fa-solid-no-such-icon')).innerHTML).toBe('');
  });
});
