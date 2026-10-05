import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import about from '../../content/about.json';
import { routes } from '../app.routes';
import { POSTS } from '../blog/posts.generated';
import { PageTitleStrategy } from './page-title.strategy';

describe('PageTitleStrategy', () => {
  const site = `${about.firstName} ${about.lastName}`;

  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), { provide: TitleStrategy, useClass: PageTitleStrategy }],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const meta = TestBed.inject(Meta);
    return {
      title: TestBed.inject(Title).getTitle(),
      description: meta.getTag('name="description"')?.content,
      robots: meta.getTag('name="robots"')?.content,
    };
  }

  it('titles the home page with the site name alone', async () => {
    expect((await open('/')).title).toBe(site);
  });

  it('titles a page by its route and the site name', async () => {
    expect((await open('/about')).title).toBe(`About Me · ${site}`);
  });

  it.runIf(POSTS.length > 0)('titles and describes a post from its front matter', async () => {
    const page = await open(`/blog/${POSTS[0].slug}`);
    expect(page.title).toBe(`${POSTS[0].title} · ${site}`);
    expect(page.description).toBe(POSTS[0].description);
  });

  it('keeps the not-found page out of search results', async () => {
    expect((await open('/no-such-page')).robots).toBe('noindex');
  });
});
