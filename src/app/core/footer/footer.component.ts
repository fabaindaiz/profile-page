import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderService } from '../services/header.service';
import { AboutService } from '../services/about.service';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, AsyncPipe]
})
export class FooterComponent {
  isHome$ = this.headerService.isHome();
  about$ = this.aboutService.getAbout();

  constructor(private aboutService: AboutService, private headerService: HeaderService) { }
}