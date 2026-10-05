import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { routes } from '../../app.routes';
import { POSTS } from '../../blog/posts.generated';
import { HeaderComponent } from './header.component';

describe('HeaderComponent small-screen menu', () => {
  async function setup() {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const toggle = element.querySelector<HTMLButtonElement>('button[aria-controls="site-menu"]')!;
    return { fixture, element, toggle };
  }

  it('opens with its button and says so in aria-expanded', async () => {
    const { fixture, element, toggle } = await setup();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('#site-menu')).not.toBeNull();
  });

  it('closes on Escape', async () => {
    const { fixture, element, toggle } = await setup();
    toggle.click();
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(element.querySelector('#site-menu')).toBeNull();
  });

  it('offers the blog only while a post is published', async () => {
    const { element } = await setup();
    const links = [...element.querySelectorAll('nav a')].map((a) => a.getAttribute('href'));
    expect(links.includes('/blog')).toBe(POSTS.length > 0);
  });
});
