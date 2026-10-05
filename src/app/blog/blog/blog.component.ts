import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { POSTS } from '../posts.generated';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-blog',
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.css'],
    // The post body is inserted as HTML, which emulated encapsulation would leave unstyled.
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [AsyncPipe]
})
export class BlogComponent {
  /** The post named by the URL; the route matches only a published post's slug (app.routes.ts). */
  post$ = this.route.paramMap.pipe(
    map((params) => POSTS.find((post) => post.slug === params.get('slug')) ?? null)
  );

  constructor(private route: ActivatedRoute) { }
}
