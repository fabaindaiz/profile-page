import { Component } from '@angular/core';
import { HeaderService } from '../services/header.service';
import { AboutService } from '../services/about.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  isHome$ = this.headerService.isHome();
  about$ = this.aboutService.getAbout();

  constructor(private aboutService: AboutService, private headerService: HeaderService) { }
}