import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import about from '../content/about.json';
import { AppComponent } from './app.component';
import { routes } from './app.routes';

describe('AppComponent', () => {
  it('frames every page with the header and the footer', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-header')?.textContent).toContain(about.lastName);
    expect(element.querySelector('app-footer')?.textContent).toContain('GPL-3.0');
  });
});
