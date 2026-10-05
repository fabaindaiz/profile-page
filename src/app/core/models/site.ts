/** The site itself, as the web knows it. */
export interface Site {
    /** The address every page is served under, with no trailing slash: canonical URLs, `og:url`, the sitemap. */
    url: string;
}
