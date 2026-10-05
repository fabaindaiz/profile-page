import { Component, ChangeDetectionStrategy } from '@angular/core';
import { POSTS } from '../posts.generated';
import { IconComponent } from '../../core/icon/icon.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-blog-landing',
    templateUrl: './blog-landing.component.html',
    styleUrls: ['./blog-landing.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IconComponent, RouterLink]
})
export class BlogLandingComponent {
  posts = POSTS;
}
