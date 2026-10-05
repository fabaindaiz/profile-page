import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import about from '../content/about.json';
import projects from '../content/projects.json';
import { routes } from './app.routes';
import { POSTS } from './blog/posts.generated';

/** Each route renders its page from the content compiled into the bundle. */
describe('routes', () => {
  async function open(url: string): Promise<string> {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
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

  it('lists every published post on the blog page', async () => {
    const text = await open('/blog');
    for (const post of POSTS) expect(text).toContain(post.title);
  });

  it('renders a post at its slug', async () => {
    expect(POSTS.length).toBeGreaterThan(0);
    const html = POSTS[0].html.replace(/<[^>]+>/g, '').trim();
    expect(await open(`/blog/${POSTS[0].slug}`)).toContain(html);
  });

  it('says a post is not found for an unknown slug', async () => {
    expect(await open('/blog/no-such-post')).toContain('Post not found');
  });

  it('renders the not-found page for an unknown URL', async () => {
    expect(await open('/no-such-page')).toContain('Page not found');
  });
});
