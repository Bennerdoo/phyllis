import puppeteer from 'puppeteer';
import { Job } from '@/lib/types';

export async function scrapeWeWorkRemotely(limit: number = 10): Promise<Job[]> {
    const url = 'https://weworkremotely.com/categories/remote-programming-jobs';
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            userDataDir: `${process.env.TEMP || '/tmp'}/puppeteer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        const jobs = await page.evaluate((limit) => {
            const jobNodes = document.querySelectorAll('section.jobs article li');
            const results: any[] = [];

            jobNodes.forEach((node) => {
                if (results.length >= limit) return;

                // WWR specific selectors
                const linkNode = node.querySelector('a');
                if (!linkNode) return; // sometimes there are dividers

                // Skip "view all" links if any
                if (linkNode.innerText.includes('View all')) return;

                const url = linkNode.href;
                const title = node.querySelector('.title')?.textContent?.trim() || '';
                const company = node.querySelector('.company')?.textContent?.trim() || '';
                const location = node.querySelector('.region')?.textContent?.trim() || 'Remote';
                const source = 'WeWorkRemotely';

                if (title) {
                    results.push({
                        title,
                        company,
                        location,
                        url,
                        source,
                        postedAt: new Date().toISOString(), // Approximation
                        tags: ['Remote', 'Tech']
                    });
                }
            });
            return results;
        }, limit);

        // Now we need to visit each job to get the description (or we can lazily do it)
        // For "scraping the internet", usually we want the details immediately to parse with Gemini.
        // Let's iterate and fetch details.

        const detailedJobs: Job[] = [];
        for (const job of jobs) {
            try {
                await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                const description = await page.evaluate(() => {
                    return document.querySelector('#job-listing-show-container')?.textContent?.trim() || '';
                });

                detailedJobs.push({
                    ...job,
                    id: Buffer.from(job.url).toString('base64'),
                    description
                });
            } catch (e) {
                console.error(`Failed to scrape details for ${job.url}`, e);
                // Push it without description or skip? Let's push with empty desc to avoid total loss.
                detailedJobs.push({ ...job, id: Buffer.from(job.url).toString('base64'), description: '' });
            }
        }

        return detailedJobs;

    } catch (error) {
        console.error("WWR Scraping Error:", error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
