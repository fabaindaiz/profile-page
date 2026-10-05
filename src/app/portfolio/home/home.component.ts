import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutService } from '../../core/services/about.service';
import { AsyncPipe } from '@angular/common';
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
    imports: [RouterLink, IconComponent, AboutComponent, ProjectComponent, SocialComponent, AsyncPipe]
})
export class HomeComponent {
  about$ = this.aboutService.getAbout();

  constructor(private aboutService: AboutService) { }
}