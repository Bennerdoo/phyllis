import { JobApplication, ApplicationStatus, Job, JobAnalysis, AnalysisStatus, GeneratedDocument } from './types';

// Simple in-memory storage (can be replaced with database later)
class ApplicationStorage {
    private applications: Map<string, JobApplication> = new Map();

    add(job: Job): JobApplication {
        const now = new Date().toISOString();
        const application: JobApplication = {
            job,
            status: ApplicationStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            stageTimestamps: {
                [ApplicationStatus.PENDING]: now,
            },
        };
        this.applications.set(job.id, application);
        return application;
    }

    update(jobId: string, updates: Partial<JobApplication>): JobApplication | null {
        const application = this.applications.get(jobId);
        if (!application) return null;

        const now = new Date().toISOString();
        const updated = {
            ...application,
            ...updates,
            updatedAt: now,
        };

        // Track stage timestamps when status changes
        if (updates.status && updates.status !== application.status) {
            updated.stageTimestamps = {
                ...application.stageTimestamps,
                [updates.status]: now,
            };

            // Set appliedAt when status becomes APPLIED
            if (updates.status === ApplicationStatus.APPLIED) {
                updated.appliedAt = now;
            }
        }

        this.applications.set(jobId, updated);
        return updated;
    }

    get(jobId: string): JobApplication | null {
        return this.applications.get(jobId) || null;
    }

    getAll(): JobApplication[] {
        return Array.from(this.applications.values());
    }

    clear(): void {
        this.applications.clear();
    }
}

// New storage for job analysis system
class AnalysisStorage {
    private analyses: Map<string, JobAnalysis> = new Map();

    add(job: Job): JobAnalysis {
        const now = new Date().toISOString();
        const analysis: JobAnalysis = {
            job,
            status: AnalysisStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            documents: [],
            stageTimestamps: {
                [AnalysisStatus.PENDING]: now,
            },
        };
        this.analyses.set(job.id, analysis);
        return analysis;
    }

    update(jobId: string, updates: Partial<JobAnalysis>): JobAnalysis | null {
        const analysis = this.analyses.get(jobId);
        if (!analysis) return null;

        const now = new Date().toISOString();
        const updated = {
            ...analysis,
            ...updates,
            updatedAt: now,
        };

        // Track stage timestamps when status changes
        if (updates.status && updates.status !== analysis.status) {
            updated.stageTimestamps = {
                ...analysis.stageTimestamps,
                [updates.status]: now,
            };
        }

        this.analyses.set(jobId, updated);
        return updated;
    }

    addDocument(jobId: string, document: GeneratedDocument): JobAnalysis | null {
        const analysis = this.analyses.get(jobId);
        if (!analysis) return null;

        const updated = {
            ...analysis,
            documents: [...(analysis.documents || []), document],
            updatedAt: new Date().toISOString(),
        };

        this.analyses.set(jobId, updated);
        return updated;
    }

    get(jobId: string): JobAnalysis | null {
        return this.analyses.get(jobId) || null;
    }

    getAll(): JobAnalysis[] {
        return Array.from(this.analyses.values());
    }

    clear(): void {
        this.analyses.clear();
    }
}

// Singleton instances
export const applicationStorage = new ApplicationStorage();
export const analysisStorage = new AnalysisStorage();
