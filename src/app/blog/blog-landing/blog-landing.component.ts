import { Component, ChangeDetectionStrategy } from '@angular/core';
import { POSTS } from '../posts.generated';
import { NgClass } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-blog-landing',
    templateUrl: './blog-landing.component.html',
    styleUrls: ['./blog-landing.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, IconComponent, RouterLink]
})
export class BlogLandingComponent {
  posts = POSTS;

  respOptions = [
    { viewClasses: 'd-none d-md-flex', displayInColumn: false, titleClasses: 'display-3' },
    { viewClasses: 'd-flex d-md-none', displayInColumn: true, titleClasses: '' }
  ];
}
