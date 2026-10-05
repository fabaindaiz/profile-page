import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';
import { PageTitleStrategy } from './core/page-title.strategy';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    provideClientHydration(),
  ],
};
