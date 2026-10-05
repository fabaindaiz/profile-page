import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SocialService } from '../../core/services/social.service';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';

@Component({
    selector: 'app-social',
    templateUrl: './social.component.html',
    styleUrls: ['./social.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, NgStyle, IconComponent, AsyncPipe]
})
export class SocialComponent {
  socials$ = this.socialService.getSocial();

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true }
  ];
  
  constructor(private socialService: SocialService) { }
}