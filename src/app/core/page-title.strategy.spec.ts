import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { Router, Routes, TitleStrategy, provideRouter } from '@angular/router';
import about from '../../content/about.json';
import siteContent from '../../content/site.json';
import social from '../../content/social.json';
import { routes, siteRoutes } from '../app.routes';
import { POSTS } from '../blog/posts.generated';
import { PageTitleStrategy } from './page-title.strategy';

describe('PageTitleStrategy', () => {
  const site = `${about.firstName} ${about.lastName}`;

  async function open(url: string, config: Routes = routes) {
    TestBed.configureTestingModule({
      providers: [provideRouter(config), { provide: TitleStrategy, useClass: PageTitleStrategy }],
    });
    await TestBed.inject(Router).navigateByUrl(url);
    const meta = TestBed.inject(Meta);
    const head = TestBed.inject(DOCUMENT).head;
    const jsonLd = head.querySelector('script[type="application/ld+json"]')?.textContent;
    return {
      canonical: head.querySelector('link[rel="canonical"]')?.getAttribute('href'),
      ogUrl: meta.getTag('property="og:url"')?.content,
      structured: jsonLd ? JSON.parse(jsonLd) : undefined,
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

  it('names each page\'s address on the site as its canonical and og:url', async () => {
    const page = await open('/about#stack');
    expect(page.canonical).toBe(`${siteContent.url}/about`);
    expect(page.ogUrl).toBe(`${siteContent.url}/about`);
  });

  it('names the site\'s root as the home page\'s canonical', async () => {
    expect((await open('/')).canonical).toBe(`${siteContent.url}/`);
  });

  it('gives the not-found page no canonical', async () => {
    const page = await open('/no-such-page');
    expect(page.canonical).toBeUndefined();
    expect(page.ogUrl).toBeUndefined();
  });

  it('describes the owner as a ProfilePage on the about page', async () => {
    expect((await open('/about')).structured).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: `${about.firstName} ${about.lastName}`,
        url: `${siteContent.url}/`,
        sameAs: social.map((s) => s.sourceUrl),
      },
    });
  });

  it('carries no structured data on other pages', async () => {
    expect((await open('/project')).structured).toBeUndefined();
  });

  it('keeps a slug no published post has out of search results, with no canonical', async () => {
    const post = { slug: 'a-post', title: 'A post', description: 'About it', html: '<p>Its body</p>' };
    const page = await open('/blog/no-such-post', siteRoutes([post]));
    expect(page.robots).toBe('noindex');
    expect(page.canonical).toBeUndefined();
  });
});
