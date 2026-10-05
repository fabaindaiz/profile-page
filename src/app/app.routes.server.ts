import { RenderMode, ServerRoute } from '@angular/ssr';
import { POSTS } from './blog/posts.generated';

/** Every route is prerendered to its own HTML file at build time; nothing renders on a server. */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => POSTS.map((post) => ({ slug: post.slug })),
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
