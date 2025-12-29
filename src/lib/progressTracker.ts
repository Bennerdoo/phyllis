/**
 * Progress Tracker for Real-Time Scraping Updates
 * Tracks progress as jobs are scraped from multiple sites
 */

export interface SiteProgress {
    siteName: string;
    status: 'pending' | 'scraping' | 'success' | 'failed';
    jobsFound: number;
    startTime?: string;
    endTime?: string;
    duration?: number; // milliseconds
    error?: string;
}

export interface ScrapingProgress {
    isActive: boolean;
    currentSite: string | null;
    sitesCompleted: number;
    totalSites: number;
    totalJobsFound: number;
    startTime: string | null;
    endTime: string | null;
    estimatedTimeRemaining: number | null; // seconds
    siteDetails: SiteProgress[];
}

class ProgressTracker {
    private progress: ScrapingProgress = {
        isActive: false,
        currentSite: null,
        sitesCompleted: 0,
        totalSites: 0,
        totalJobsFound: 0,
        startTime: null,
        endTime: null,
        estimatedTimeRemaining: null,
        siteDetails: [],
    };

    /**
     * Start a new scraping session
     */
    startScraping(totalSites: number, siteNames: string[]): void {
        this.progress = {
            isActive: true,
            currentSite: null,
            sitesCompleted: 0,
            totalSites,
            totalJobsFound: 0,
            startTime: new Date().toISOString(),
            endTime: null,
            estimatedTimeRemaining: null,
            siteDetails: siteNames.map(name => ({
                siteName: name,
                status: 'pending',
                jobsFound: 0,
            })),
        };

        console.log(`[ProgressTracker] Started scraping ${totalSites} sites`);
    }

    /**
     * Update progress for a specific site
     */
    updateSite(
        siteName: string,
        status: 'scraping' | 'success' | 'failed',
        jobsFound: number = 0,
        error?: string
    ): void {
        const siteIndex = this.progress.siteDetails.findIndex(s => s.siteName === siteName);

        if (siteIndex === -1) {
            console.warn(`[ProgressTracker] Site ${siteName} not found in progress`);
            return;
        }

        const site = this.progress.siteDetails[siteIndex];
        const now = new Date().toISOString();

        // Update site status
        if (status === 'scraping') {
            site.status = 'scraping';
            site.startTime = now;
            this.progress.currentSite = siteName;
        } else if (status === 'success' || status === 'failed') {
            site.status = status;
            site.endTime = now;
            site.jobsFound = jobsFound;
            site.error = error;

            if (site.startTime) {
                site.duration = new Date(now).getTime() - new Date(site.startTime).getTime();
            }

            this.progress.sitesCompleted++;
            this.progress.totalJobsFound += jobsFound;
            this.progress.currentSite = null;

            // Calculate estimated time remaining
            this.calculateEstimatedTime();
        }

        console.log(`[ProgressTracker] ${siteName}: ${status} (${jobsFound} jobs)`);
    }

    /**
     * Mark scraping complete
     */
    complete(): void {
        this.progress.isActive = false;
        this.progress.endTime = new Date().toISOString();
        this.progress.currentSite = null;
        this.progress.estimatedTimeRemaining = 0;

        const duration = this.progress.startTime
            ? (new Date(this.progress.endTime!).getTime() - new Date(this.progress.startTime).getTime()) / 1000
            : 0;

        console.log(`[ProgressTracker] Scraping complete in ${duration.toFixed(1)}s`);
        console.log(`[ProgressTracker] Total jobs found: ${this.progress.totalJobsFound}`);
        console.log(`[ProgressTracker] Success rate: ${this.getSuccessRate()}%`);
    }

    /**
     * Get current progress state
     */
    getProgress(): ScrapingProgress {
        return { ...this.progress };
    }

    /**
     * Reset tracker
     */
    reset(): void {
        this.progress = {
            isActive: false,
            currentSite: null,
            sitesCompleted: 0,
            totalSites: 0,
            totalJobsFound: 0,
            startTime: null,
            endTime: null,
            estimatedTimeRemaining: null,
            siteDetails: [],
        };
    }

    /**
     * Calculate estimated time remaining based on average site time
     */
    private calculateEstimatedTime(): void {
        const completedSites = this.progress.siteDetails.filter(
            s => s.status === 'success' || s.status === 'failed'
        );

        if (completedSites.length === 0) {
            this.progress.estimatedTimeRemaining = null;
            return;
        }

        // Calculate average time per site
        const totalDuration = completedSites.reduce((sum, site) => sum + (site.duration || 0), 0);
        const avgDuration = totalDuration / completedSites.length;

        // Estimate remaining time
        const remainingSites = this.progress.totalSites - this.progress.sitesCompleted;
        this.progress.estimatedTimeRemaining = Math.ceil((avgDuration * remainingSites) / 1000);
    }

    /**
     * Get success rate percentage
     */
    private getSuccessRate(): number {
        const completed = this.progress.siteDetails.filter(
            s => s.status === 'success' || s.status === 'failed'
        );

        if (completed.length === 0) return 0;

        const successful = this.progress.siteDetails.filter(s => s.status === 'success').length;
        return Math.round((successful / completed.length) * 100);
    }
}

// Singleton instance
export const progressTracker = new ProgressTracker();
