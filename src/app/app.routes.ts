import { Routes } from '@angular/router';
import { BlogLandingComponent } from './blog/blog-landing/blog-landing.component';
import { BlogComponent } from './blog/blog/blog.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { AboutComponent } from './portfolio/about/about.component';
import { HomeComponent } from './portfolio/home/home.component';
import { ProjectComponent } from './portfolio/project/project.component';

/** Every page, loaded with the app: one bundle, so a first visit fetches no route chunk. */
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'project', component: ProjectComponent },
  { path: 'blog', component: BlogLandingComponent },
  { path: 'blog/:slug', component: BlogComponent },
  { path: '404', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent }
];
