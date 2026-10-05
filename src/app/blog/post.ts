/** A published blog post, converted from blog/<slug>.md at build time (tools/posts.mjs). */
export interface Post {
    slug: string;
    title: string;
    description: string;
    /** The post body as HTML, from the build's markdown conversion. */
    html: string;
}
