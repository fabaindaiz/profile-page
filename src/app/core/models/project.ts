export interface Project {
    name: string;
    filter: { list: string[], color: string };
    stack: pstack[];
    description: string;
    image?: ProjectImage;
    sourceUrl?: string;
    previewUrl?: string;
    featured?: boolean;
}

export interface pstack {
    name: string,
    iconClasses: string
}

/** A project's picture, with its size in pixels, so the page reserves its space before it loads. */
export interface ProjectImage {
    url: string;
    width: number;
    height: number;
}
