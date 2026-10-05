import { TestBed } from '@angular/core/testing';
import { Routes, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import about from '../content/about.json';
import projects from '../content/projects.json';
import { routes, siteRoutes } from './app.routes';
import { Post } from './blog/post';
import { POSTS } from './blog/posts.generated';

/** Each route renders its page from the content compiled into the bundle. */
describe('routes', () => {
  async function open(url: string, config: Routes = routes): Promise<string> {
    TestBed.configureTestingModule({ providers: [provideRouter(config)] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    await harness.fixture.whenStable();
    return harness.routeNativeElement?.textContent ?? '';
  }

  it('renders the owner\'s first name on the home page', async () => {
    expect(await open('/')).toContain(about.firstName);
  });

  it('lists every project on the projects page', async () => {
    const text = await open('/project');
    for (const project of projects) expect(text).toContain(project.name);
  });

  it('hides the blog while no post is published', async () => {
    expect(await open('/blog', siteRoutes([]))).toContain('Page not found');
  });

  it('hides every post page while no post is published', async () => {
    expect(await open('/blog/any-post', siteRoutes([]))).toContain('Page not found');
  });

  it('opens the blog once a post is published', async () => {
    const post: Post = { slug: 'a-post', title: 'A post', description: 'About it', html: '<p>Its body</p>' };
    expect(await open('/blog', siteRoutes([post]))).not.toContain('Page not found');
  });

  // The blog's pages read the posts the build converted, so these run only while one is published.
  it.runIf(POSTS.length > 0)('lists every published post on the blog page', async () => {
    const text = await open('/blog');
    for (const post of POSTS) expect(text).toContain(post.title);
  });

  it.runIf(POSTS.length > 0)('renders a post at its slug', async () => {
    const html = POSTS[0].html.replace(/<[^>]+>/g, '').trim();
    expect(await open(`/blog/${POSTS[0].slug}`)).toContain(html);
  });

  it.runIf(POSTS.length > 0)('says a post is not found for an unknown slug', async () => {
    expect(await open('/blog/no-such-post')).toContain('Post not found');
  });

  it('renders the not-found page for an unknown URL', async () => {
    expect(await open('/no-such-page')).toContain('Page not found');
  });
});
