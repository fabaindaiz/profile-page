import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import projects from '../../../content/projects.json';
import { ProjectService } from './project.service';

describe('ProjectService.getProjects', () => {
  const service = () => TestBed.inject(ProjectService);

  it('returns every project when not asked for the featured ones', async () => {
    expect((await firstValueFrom(service().getProjects())).length).toBe(projects.length);
  });

  it('returns only the featured projects when asked for them', async () => {
    const featured = await firstValueFrom(service().getProjects(true));
    expect(featured.length).toBe(projects.filter((p) => p.featured).length);
    expect(featured.every((p) => p.featured)).toBe(true);
  });
});
