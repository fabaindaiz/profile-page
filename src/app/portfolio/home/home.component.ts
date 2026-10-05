import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutService } from '../../core/services/about.service';
import { NgClass, AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../core/icon/icon.component';
import { AboutComponent } from '../about/about.component';
import { ProjectComponent } from '../project/project.component';
import { SocialComponent } from '../social/social.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, RouterLink, IconComponent, AboutComponent, ProjectComponent, SocialComponent, AsyncPipe]
})
export class HomeComponent {
  about$ = this.aboutService.getAbout();

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true }
  ];

  constructor(private aboutService: AboutService) { }
}