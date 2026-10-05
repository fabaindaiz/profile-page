import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import about from '../../content/about.json';
import siteContent from '../../content/site.json';
import socialContent from '../../content/social.json';
import { POSTS } from '../blog/posts.generated';
import { Site } from './models/site';
import { Social } from './models/social';

const SITE = `${about.firstName} ${about.lastName}`;
const SITE_DESCRIPTION = about.intro.join(' ');
const ADDRESS: Site = siteContent;
const SOCIAL: Social[] = socialContent;

/**
 * Sets each page's <title>, description and social tags from its route, so the prerendered HTML
 * carries them: `Route title · Site name`, and the description of the post a post route shows, or
 * the owner's introduction elsewhere. An indexable page names its address on the site as its
 * canonical URL and `og:url`; pages marked `noindex` in their route data are kept out of search
 * results and name none. A route marked `profilePage` carries the owner as schema.org structured
 * data. All text comes from the content; none is written here.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const leaf = deepest(snapshot.root);
    const post = POSTS.find((p) => p.slug === leaf.paramMap.get('slug'));
    const pageTitle = post?.title ?? this.buildTitle(snapshot);
    const title = pageTitle ? `${pageTitle} · ${SITE}` : SITE;
    const description = post?.description ?? SITE_DESCRIPTION;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: post ? 'article' : 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    if (leaf.data['noindex']) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      this.meta.removeTag('property="og:url"');
      this.setCanonical(null);
    } else {
      // The path alone: the host serves every page without a trailing slash (wrangler.jsonc).
      const url = `${ADDRESS.url}${snapshot.url.split(/[?#]/)[0]}`;
      this.meta.removeTag('name="robots"');
      this.meta.updateTag({ property: 'og:url', content: url });
      this.setCanonical(url);
    }
    this.setStructuredData(leaf.data['profilePage'] ? profilePage() : null);
  }

  private setCanonical(url: string | null): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!url) return link?.remove();
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setStructuredData(data: object | null): void {
    let script = this.document.head.querySelector('script[type="application/ld+json"]');
    if (!data) return script?.remove();
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}

/** schema.org's ProfilePage, whose required parts are a Person as `mainEntity` and its `name`. */
function profilePage(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: SITE,
      url: `${ADDRESS.url}/`,
      sameAs: SOCIAL.map((s) => s.sourceUrl),
    },
  };
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}
