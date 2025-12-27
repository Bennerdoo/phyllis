
export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    url: string;
    description: string;
    postedAt: string;
    tags: string[];
    source: string;
}

export type JobFilter = {
    keyword?: string;
    location?: string;
};

export interface UserProfile {
    name: string;
    email: string;
    phone: string;
    location: string;
    links: { label: string; url: string }[];
    summary: string;
    skills: string[];
    experience: Experience[];
    education: Education[];
    projects: Project[];
}

export interface Experience {
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface Education {
    school: string;
    degree: string;
    year: string;
}

export interface Project {
    name: string;
    description: string;
    url?: string;
}
