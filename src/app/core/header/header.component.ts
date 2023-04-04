import { Component } from '@angular/core';
import { HeaderService } from '../services/header.service';
import { AboutService } from '../services/about.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  isHome$ = this.headerService.isHome();
  about$ = this.aboutService.getAbout();

  menuItems = [
    { title: 'About Me', homePath: '/', fragment: 'about', pagePath: '/about' },
    { title: 'My Projects', homePath: '/', fragment: 'projects', pagePath: '/projects' },
    { title: 'My Blog', homePath: '/blog', fragment: '', pagePath: '/blog' }
  ];

  constructor(private aboutService: AboutService, private headerService: HeaderService) { }
}