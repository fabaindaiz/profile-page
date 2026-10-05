import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { routes } from '../../app.routes';
import { HeaderService } from './header.service';

describe('HeaderService.isHome', () => {
  let router: Router;
  let service: HeaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    router = TestBed.inject(Router);
    service = TestBed.inject(HeaderService);
  });

  it('is true on the home page and its fragments', async () => {
    await router.navigateByUrl('/#about');
    expect(await firstValueFrom(service.isHome())).toBe(true);
  });

  it('starts a subscriber made after leaving home from the current page, not the first one', async () => {
    const isHome = service.isHome();
    await router.navigateByUrl('/about');
    expect(await firstValueFrom(isHome)).toBe(false);
  });
});
