import { Component } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { HeaderService } from '../../core/services/header.service';
import { ProjectService } from '../../core/services/project.service';
import { StackService } from '../../core/services/stack.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent {
  filter = "";
  isHome$ = this.headerService.isHome();
  projects$ = this.isHome$.pipe(
    mergeMap(atHome => this.projectService.getProjects(atHome))
  );
  stacks$ = this.stackService.getStack();

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false, displayInColumn: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true, displayInColumn: true }
  ];

  constructor(private projectService: ProjectService, private stackService: StackService, private headerService: HeaderService) { }

  mouseEnter(filter : string) {
    this.filter = filter
  }
}