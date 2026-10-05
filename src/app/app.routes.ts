import { Routes } from '@angular/router';
import { BlogLandingComponent } from './blog/blog-landing/blog-landing.component';
import { BlogComponent } from './blog/blog/blog.component';
import { Post } from './blog/post';
import { POSTS } from './blog/posts.generated';
import { NotFoundComponent } from './not-found/not-found.component';
import { AboutComponent } from './portfolio/about/about.component';
import { HomeComponent } from './portfolio/home/home.component';
import { ProjectComponent } from './portfolio/project/project.component';

/**
 * Every page, loaded with the app: one bundle, so a first visit fetches no route chunk. The blog's
 * pages exist only while a post is published, so an empty blog is never shown (i-115f49-d63585).
 */
export function siteRoutes(posts: readonly Post[]): Routes {
  return [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent, title: 'About Me' },
    { path: 'project', component: ProjectComponent, title: 'My Projects' },
    ...(posts.length ? [
      { path: 'blog', component: BlogLandingComponent, title: 'Blog' },
      { path: 'blog/:slug', component: BlogComponent, title: 'Post not found' },
    ] : []),
    { path: '404', component: NotFoundComponent, title: 'Page not found', data: { noindex: true } },
    { path: '**', component: NotFoundComponent, title: 'Page not found', data: { noindex: true } }
  ];
}

export const routes = siteRoutes(POSTS);
