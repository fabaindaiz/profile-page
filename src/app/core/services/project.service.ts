import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import projects from '../../../assets/json/projects.json';
import { Project } from '../models/project';

/** Compiled into the bundle: typed against the model at build time, and never fetched. */
const PROJECTS: Project[] = projects;

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  getProjects(featured?: boolean): Observable<Project[]> {
    return of(featured ? PROJECTS.filter((project) => project.featured) : PROJECTS);
  }
}
