import { Component, ChangeDetectionStrategy } from '@angular/core';
import { POSTS } from '../posts.generated';

@Component({
    selector: 'app-blog-landing',
    templateUrl: './blog-landing.component.html',
    styleUrls: ['./blog-landing.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class BlogLandingComponent {
  posts = POSTS;

  respOptions = [
    { viewClasses: 'd-none d-md-flex', displayInColumn: false, titleClasses: 'display-3' },
    { viewClasses: 'd-flex d-md-none', displayInColumn: true, titleClasses: '' }
  ];
}
