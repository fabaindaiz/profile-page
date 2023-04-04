export interface About {
    firstName: string;
    lastName: string;
    about: string[];
    intro: string[];
}

export interface Stack {
    name: string;
    iconClasses: string;
    sourceUrl: string;
    color: { background: string, icon: string };
}