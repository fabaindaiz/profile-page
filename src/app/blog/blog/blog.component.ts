import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { POSTS } from '../posts.generated';

@Component({
    selector: 'app-blog',
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.css'],
    // The post body is inserted as HTML, which emulated encapsulation would leave unstyled.
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BlogComponent {
  /** The post named by the URL, or null when no published post has that slug. */
  post$ = this.route.paramMap.pipe(
    map((params) => POSTS.find((post) => post.slug === params.get('slug')) ?? null)
  );

  constructor(private route: ActivatedRoute) { }
}
