import { scrapeWeWorkRemotely } from "@/lib/sites/weworkremotely";
import { Job } from "@/lib/types";

export class JobService {
    static async searchJobs(keyword?: string): Promise<Job[]> {
        console.log(`Searching for jobs with keyword: ${keyword}`);
        // Future: Use keyword to filter or pass to scraper
        // For now, just fetching WWR recent jobs
        const jobs = await scrapeWeWorkRemotely(5); // Fetch 5 for speed during dev
        return jobs;
    }
}
