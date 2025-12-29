import cron from 'node-cron';
import { ApplicationService } from './services/applicationService';
import { SchedulerStatus, SchedulerHistory } from './types';

class Scheduler {
    private task: cron.ScheduledTask | null = null;
    private isRunning = false;
    private lastRun?: string;
    private history: SchedulerHistory[] = [];
    private readonly maxHistorySize = 10;

    // Default configuration
    private config = {
        enabled: process.env.SCHEDULER_ENABLED === 'true',
        schedule: process.env.SCHEDULER_CRON || '0 9 * * *', // Daily at 9 AM
        keyword: process.env.SCHEDULER_KEYWORD || 'developer',
    };

    initialize(): void {
        if (!this.config.enabled) {
            console.log('[Scheduler] Scheduler is disabled via SCHEDULER_ENABLED');
            return;
        }

        if (this.task) {
            console.log('[Scheduler] Already initialized');
            return;
        }

        try {
            // Validate cron expression
            if (!cron.validate(this.config.schedule)) {
                console.error(`[Scheduler] Invalid cron expression: ${this.config.schedule}`);
                return;
            }

            this.task = cron.schedule(this.config.schedule, async () => {
                await this.runAutoApply();
            });

            console.log(`[Scheduler] Initialized with schedule: ${this.config.schedule}`);
            console.log(`[Scheduler] Next run: ${this.getNextRunTime()}`);
        } catch (error) {
            console.error('[Scheduler] Failed to initialize:', error);
        }
    }

    async runAutoApply(): Promise<void> {
        if (this.isRunning) {
            console.log('[Scheduler] Auto-apply already running, skipping...');
            return;
        }

        this.isRunning = true;
        const startTime = new Date().toISOString();
        console.log(`[Scheduler] Starting scheduled auto-apply at ${startTime}`);

        try {
            // Run the auto-apply process
            await ApplicationService.startAutoApply(this.config.keyword);

            // Record success
            this.lastRun = startTime;
            this.addHistory({
                timestamp: startTime,
                success: true,
                jobsProcessed: 0, // We don't track exact count yet
            });

            console.log('[Scheduler] Auto-apply completed successfully');
        } catch (error) {
            console.error('[Scheduler] Auto-apply failed:', error);

            // Record failure
            this.addHistory({
                timestamp: startTime,
                success: false,
                jobsProcessed: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            this.isRunning = false;
        }
    }

    async manualTrigger(): Promise<void> {
        console.log('[Scheduler] Manual trigger requested');
        await this.runAutoApply();
    }

    getStatus(): SchedulerStatus {
        return {
            enabled: this.config.enabled,
            lastRun: this.lastRun,
            nextRun: this.getNextRunTime(),
            isRunning: this.isRunning,
            schedule: this.config.schedule,
        };
    }

    getHistory(): SchedulerHistory[] {
        return [...this.history];
    }

    private getNextRunTime(): string | undefined {
        if (!this.task) return undefined;

        try {
            // Parse the cron expression to calculate next run
            // This is a simplified version - for production, use a library like cron-parser
            const now = new Date();
            const [minute, hour] = this.config.schedule.split(' ');

            if (minute === '*' || hour === '*') {
                // For frequently running tasks, just show "soon"
                return 'Soon';
            }

            // Create next run date
            const nextRun = new Date(now);
            nextRun.setHours(parseInt(hour) || 0, parseInt(minute) || 0, 0, 0);

            // If time has passed today, schedule for tomorrow
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }

            return nextRun.toISOString();
        } catch (error) {
            return undefined;
        }
    }

    private addHistory(entry: SchedulerHistory): void {
        this.history.unshift(entry);
        if (this.history.length > this.maxHistorySize) {
            this.history.pop();
        }
    }

    stop(): void {
        if (this.task) {
            this.task.stop();
            this.task = null;
            console.log('[Scheduler] Stopped');
        }
    }
}

// Singleton instance
export const scheduler = new Scheduler();
