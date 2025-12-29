
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
    // New fields for enhanced analysis
    requirements?: JobRequirements;
    documentsNeeded?: DocumentType[];
    aiAnalysis?: string;
}

export interface JobRequirements {
    technicalSkills: string[];
    experienceLevel: string; // e.g., "Entry Level", "Mid-Level", "Senior"
    yearsOfExperience?: string;
    education: string[]; // e.g., ["Bachelor's in Computer Science", "Master's preferred"]
    certifications?: string[];
    softSkills?: string[];
    responsibilities?: string[];
}

export enum DocumentType {
    RESUME = 'resume',
    CV = 'cv',
    COVER_LETTER = 'cover_letter',
}

export interface GeneratedDocument {
    type: DocumentType;
    jobId: string;
    docxBuffer?: Buffer;
    fallbackText?: string;
    generatedAt: string;
    error?: string;
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

export enum AnalysisStatus {
    PENDING = 'pending',
    ANALYZING = 'analyzing',
    GENERATING_DOCUMENTS = 'generating_documents',
    COMPLETE = 'complete',
    FAILED = 'failed',
}

export interface JobAnalysis {
    job: Job;
    status: AnalysisStatus;
    createdAt: string;
    updatedAt: string;
    error?: string;
    documents?: GeneratedDocument[];
    stageTimestamps?: Partial<Record<AnalysisStatus, string>>;
}

// Legacy types - keeping for backwards compatibility during migration
export enum ApplicationStatus {
    PENDING = 'pending',
    GENERATING_RESUME = 'generating_resume',
    RESUME_READY = 'resume_ready',
    APPLYING = 'applying',
    APPLIED = 'applied',
    FAILED = 'failed',
}

export interface JobApplication {
    job: Job;
    status: ApplicationStatus;
    createdAt: string;
    updatedAt: string;
    error?: string;
    stageTimestamps?: Partial<Record<ApplicationStatus, string>>;
    appliedAt?: string;
}

export interface SchedulerStatus {
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
    isRunning: boolean;
    schedule: string;
}

export interface SchedulerHistory {
    timestamp: string;
    success: boolean;
    jobsProcessed: number;
    error?: string;
}

