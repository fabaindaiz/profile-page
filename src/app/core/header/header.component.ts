import { Component, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { HeaderService } from '../services/header.service';
import { AboutService } from '../services/about.service';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { AsyncPipe } from '@angular/common';
import { POSTS } from '../../blog/posts.generated';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, IconComponent, AsyncPipe]
})
export class HeaderComponent {
  isHome$ = this.headerService.isHome();
  about$ = this.aboutService.getAbout();

  menuItems = [
    { title: 'About Me', homePath: '/', fragment: 'about', pagePath: '/about' },
    { title: 'My Projects', homePath: '/', fragment: 'project', pagePath: '/project' },
    { title: 'My Blog', homePath: '/blog', fragment: '', pagePath: '/blog' }
  ].filter((item) => item.pagePath !== '/blog' || POSTS.length > 0);  // the blog's routes need a post

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