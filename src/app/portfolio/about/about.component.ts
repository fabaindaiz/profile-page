import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AboutService } from '../../core/services/about.service';
import { StackService } from '../../core/services/stack.service';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, NgStyle, IconComponent, AsyncPipe]
})
export class AboutComponent {
  about$ = this.aboutService.getAbout();
  stacks$ = this.stackService.getStack();

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true }
  ];

  constructor(private aboutService: AboutService, private stackService: StackService) { }
}