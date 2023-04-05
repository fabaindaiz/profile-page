export interface Project {
    name: string;
    stack: { iconClasses: string, name: string };
    description: string;
    imageUrl?: string;
    sourceUrl: string;
    previewUrl: string;
    featured?: boolean;
}