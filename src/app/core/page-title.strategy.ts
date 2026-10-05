import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import about from '../../content/about.json';
import { POSTS } from '../blog/posts.generated';

const SITE = `${about.firstName} ${about.lastName}`;
const SITE_DESCRIPTION = about.intro.join(' ');

/**
 * Sets each page's <title>, description and social tags from its route, so the prerendered HTML
 * carries them: `Route title · Site name`, and the description of the post a post route shows, or
 * the owner's introduction elsewhere. Pages marked `noindex` in their route data are kept out of
 * search results. All text comes from the content; none is written here.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title, private readonly meta: Meta) {
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
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}

function deepest(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
  return route.firstChild ? deepest(route.firstChild) : route;
}
