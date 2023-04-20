export interface Project {
    name: string;
    filter: { list: string[], color: string };
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