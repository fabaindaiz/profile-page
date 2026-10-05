import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Any URL no route matches; prerendered to /404 and copied to 404.html for the host. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="text-center">
      <h1>Page not found</h1>
      <p><a routerLink="/">Back to the home page</a></p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent { }
