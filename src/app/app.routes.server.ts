import { RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './blog/posts.generated';

/** Every route is prerendered to its own HTML file at build time; nothing renders on a server. */
export const serverRoutes: ServerRoute[] = [
  // Only while the blog's routes exist (app.routes.ts): a server route naming no route fails the build.
  ...(POSTS.length ? [{
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender as const,
    getPrerenderParams: async () => POSTS.map((post) => ({ slug: post.slug })),
  }] : []),
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
