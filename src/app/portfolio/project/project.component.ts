import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { HeaderService } from '../../core/services/header.service';
import { ProjectService } from '../../core/services/project.service';
import { StackService } from '../../core/services/stack.service';
import { NgClass, NgStyle, AsyncPipe } from '@angular/common';
import { IconComponent } from '../../core/icon/icon.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgClass, NgStyle, IconComponent, RouterLink, AsyncPipe]
})
export class ProjectComponent {
  /** The section heading's level: h1 as its own page, h2 inside the home page. */
  @Input() heading: 'h1' | 'h2' = 'h1';
  filter = "";
  isHome$ = this.headerService.isHome();
  projects$ = this.isHome$.pipe(
    mergeMap(atHome => this.projectService.getProjects(atHome))
  );
  stacks$ = this.stackService.getStack();

  constructor(private projectService: ProjectService, private stackService: StackService, private headerService: HeaderService) { }

  mouseEnter(filter : string) {
    this.filter = filter
  }
}