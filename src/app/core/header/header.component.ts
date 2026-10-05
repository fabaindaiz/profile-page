import { Component, ElementRef, HostListener } from '@angular/core';
import { HeaderService } from '../services/header.service';
import { AboutService } from '../services/about.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    standalone: false
})
export class HeaderComponent {
  isHome$ = this.headerService.isHome();
  about$ = this.aboutService.getAbout();

  menuItems = [
    { title: 'About Me', homePath: '/', fragment: 'about', pagePath: '/about' },
    { title: 'My Projects', homePath: '/', fragment: 'project', pagePath: '/project' },
    { title: 'My Blog', homePath: '/blog', fragment: '', pagePath: '/blog' }
  ];

  /** The small-screen menu; closed by choosing an item, Escape, or a click anywhere else. */
  menuOpen = false;

  constructor(private aboutService: AboutService, private headerService: HeaderService, private host: ElementRef<HTMLElement>) { }

  @HostListener('document:keydown.escape')
  closeMenu() {
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event.target'])
  closeMenuOutside(target: EventTarget | null) {
    if (target instanceof Node && !this.host.nativeElement.contains(target)) this.menuOpen = false;
  }
}