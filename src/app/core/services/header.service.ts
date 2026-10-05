import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { defer } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HeaderService {

  constructor(private router: Router) { }

  /** Whether the current page is the home page; each subscriber starts from the URL at that moment. */
  isHome() {
    return defer(() => this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => {
        if (event instanceof NavigationEnd) {
          if (this.checkForHomeUrl(event.url)) {
            return true;
          }
        }

        return false;
      }),
      startWith(this.checkForHomeUrl(this.router.url))
    ));
  }

  private checkForHomeUrl(url: string): boolean {
    return url.startsWith('/#') || url == '/';
  }
}
