import { JobApplication, ApplicationStatus, Job } from './types';

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

// Singleton instance
export const applicationStorage = new ApplicationStorage();
