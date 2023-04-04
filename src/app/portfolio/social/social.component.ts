import { Component } from '@angular/core';
import { SocialService } from '../../core/services/social.service';

@Component({
  selector: 'app-social',
  templateUrl: './social.component.html',
  styleUrls: ['./social.component.css']
})
export class SocialComponent {
  socials$ = this.socialService.getSocial();

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true }
  ];
  
  constructor(private socialService: SocialService) { }
}