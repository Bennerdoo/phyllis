import { Job } from '../types';
import { scrapeJobsWithAI } from '../aiScraper';
import { JOB_SITES } from '../jobSites';
import { progressTracker } from '../progressTracker';
import { JobDB, ScrapingHistoryDB } from '../database';

// Helper to run promises with concurrency limit
async function batchProcess<T>(
    items: T[],
    batchSize: number,
    processor: (item: T, index: number) => Promise<any>
): Promise<any[]> {
    const results: any[] = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
            batch.map((item, index) => processor(item, i + index))
        );
        results.push(...batchResults);
    }
    return results;
}

export class JobService {
    /**
     * Search for jobs across configured job sites
     * Uses AI-powered scraping with Gemini for intelligent extraction
     * Integrated with progress tracking and database persistence
     * @param keyword - Optional keyword filter (not used in current implementation)
     * @param sitesPerBatch - Number of sites to scrape concurrently (default: 3)
     * @param jobsPerSite - Maximum jobs to extract from each site (default: 5)
     */
    static async searchJobs(
        keyword?: string,
        sitesPerBatch: number = 3,  // Reduced from 5 for better stability
        jobsPerSite: number = 5
    ): Promise<Job[]> {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🚀 [JobService] Starting job search`);
        console.log(`📊 [JobService] Sites to scrape: ${JOB_SITES.length}`);
        console.log(`⚙️  [JobService] Concurrency: ${sitesPerBatch} sites at a time`);
        console.log(`🎯 [JobService] Target: ${jobsPerSite} jobs per site`);
        console.log(`⏱️  [JobService] Estimated time: ${Math.ceil(JOB_SITES.length / sitesPerBatch) * 1} minutes`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Initialize progress tracker
        const siteNames = JOB_SITES.map(site => site.name);
        progressTracker.startScraping(JOB_SITES.length, siteNames);

        // Start scraping history in database
        const runId = ScrapingHistoryDB.start(JOB_SITES.length, 'manual');

        let completedSites = 0;
        const totalSites = JOB_SITES.length;
        const siteDetails: any[] = [];

        // Scrape all sites with batching to avoid overwhelming the system
        const results = await batchProcess(
            JOB_SITES,
            sitesPerBatch,
            async (site, index) => {
                try {
                    console.log(`\n🔍 [${completedSites + 1}/${totalSites}] Scraping: ${site.name}`);
                    console.log(`   URL: ${site.url}`);

                    // Update progress: start scraping this site
                    progressTracker.updateSite(site.name, 'scraping');

                    const startTime = Date.now();
                    const jobs = await scrapeJobsWithAI(site.url, site.name, jobsPerSite);
                    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

                    completedSites++;

                    if (jobs.length > 0) {
                        console.log(`   ✅ Success! Found ${jobs.length} jobs in ${duration}s`);

                        // Update progress: success
                        progressTracker.updateSite(site.name, 'success', jobs.length);

                        // Save jobs to database
                        jobs.forEach(job => JobDB.save(job));

                        siteDetails.push({
                            siteName: site.name,
                            status: 'success',
                            jobsFound: jobs.length,
                            duration: parseFloat(duration),
                        });
                    } else {
                        console.log(`   ⚠️  No jobs found (${duration}s)`);

                        progressTracker.updateSite(site.name, 'success', 0);

                        siteDetails.push({
                            siteName: site.name,
                            status: 'success',
                            jobsFound: 0,
                            duration: parseFloat(duration),
                        });
                    }

                    return jobs;
                } catch (error) {
                    completedSites++;
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    console.log(`   ❌ Failed: ${errorMsg}`);

                    // Update progress: failed
                    progressTracker.updateSite(site.name, 'failed', 0, errorMsg);

                    siteDetails.push({
                        siteName: site.name,
                        status: 'failed',
                        jobsFound: 0,
                        error: errorMsg,
                    });

                    return [];
                }
            }
        );

        // Collect all successful results
        const allJobs: Job[] = [];
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                allJobs.push(...result.value);
            }
        });

        // Remove duplicates based on job URL
        const uniqueJobs = Array.from(
            new Map(allJobs.map(job => [job.url, job])).values()
        );

        // Mark progress as complete
        progressTracker.complete();

        // Save scraping history to database
        const successfulSites = siteDetails.filter(s => s.status === 'success').length;
        const failedSites = siteDetails.filter(s => s.status === 'failed').length;
        ScrapingHistoryDB.complete(runId, successfulSites, failedSites, uniqueJobs.length, siteDetails);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✨ [JobService] Search Complete!`);
        console.log(`📝 Total unique jobs found: ${uniqueJobs.length}`);
        console.log(`🌐 Sites scraped: ${completedSites}/${totalSites}`);
        console.log(`✅ Successful: ${successfulSites} | ❌ Failed: ${failedSites}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return uniqueJobs;
    }
}
