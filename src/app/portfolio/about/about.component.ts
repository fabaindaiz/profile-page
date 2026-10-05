import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AboutService } from '../../core/services/about.service';
import { StackService } from '../../core/services/stack.service';
import { NgStyle, AsyncPipe } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgStyle, IconComponent, AsyncPipe]
})
export class AboutComponent {
  /** The section heading's level: h1 as its own page, h2 inside the home page. */
  @Input() heading: 'h1' | 'h2' = 'h1';
  about$ = this.aboutService.getAbout();
  stacks$ = this.stackService.getStack();

  constructor(private aboutService: AboutService, private stackService: StackService) { }
}