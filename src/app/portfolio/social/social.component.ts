import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SocialService } from '../../core/services/social.service';
import { NgStyle, AsyncPipe } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';

@Component({
    selector: 'app-social',
    templateUrl: './social.component.html',
    styleUrls: ['./social.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgStyle, IconComponent, AsyncPipe]
})
export class SocialComponent {
  socials$ = this.socialService.getSocial();
  
  constructor(private socialService: SocialService) { }
}