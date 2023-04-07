export interface About {
    firstName: string;
    lastName: string;
    about: string[];
    intro: string[];
}

export interface Stack {
    name: string;
    filter: string;
    iconClasses: string;
    color: { background: string, icon: string };
}