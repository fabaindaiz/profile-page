export interface Project {
    name: string;
    filter: string[];
    stack: pstack[];
    description: string;
    imageUrl?: string;
    sourceUrl: string;
    previewUrl: string;
    featured?: boolean;
}

export interface pstack {
    name: string,
    iconClasses: string
}