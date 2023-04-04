import { Component } from '@angular/core';
import { mergeMap } from 'rxjs/operators';
import { HeaderService } from '../../core/services/header.service';
import { ProjectsService } from '../../core/services/projects.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent {
  isHome$ = this.headerService.isHome();
  projects$ = this.isHome$.pipe(
    mergeMap(atHome => this.projectsService.getProjects(atHome))
  );

  respOptions = [
    { viewClasses: 'd-none d-md-flex', headingClass: 'display-3', useSmallerHeadings: false, displayInColumn: false },
    { viewClasses: 'd-flex d-md-none', headingClass: '', useSmallerHeadings: true, displayInColumn: true }
  ];

  constructor(private projectsService: ProjectsService, private headerService: HeaderService) { }
}