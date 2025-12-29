import puppeteer from 'puppeteer';
import { generateText } from './gemini';
import { Job } from './types';

/**
 * AI-Powered Generic Job Scraper
 * Uses Gemini AI to intelligently extract job listings from any website's HTML
 */
export async function scrapeJobsWithAI(
    url: string,
    sourceName: string,
    limit: number = 10
): Promise<Job[]> {
    let browser;
    try {
        console.log(`[AI Scraper] Scraping ${sourceName}: ${url}`);

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            userDataDir: `${process.env.TEMP || '/tmp'}/puppeteer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        });

        const page = await browser.newPage();
        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );

        // Navigate to the page
        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // Wait a bit for dynamic content to load
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get the page HTML
        const html = await page.content();

        // Close browser early to free resources
        await browser.close();
        browser = undefined;

        // Use Gemini AI to extract job listings from HTML
        const prompt = `You are a job data extraction expert. Extract job listings from the following HTML page.

HTML Content:
${html.substring(0, 50000)} 

Extract up to ${limit} job listings and return them as a JSON array. Each job should have:
- title: string (job title)
- company: string (company name)
- location: string (job location, default to "Remote" if not specified)
- url: string (full URL to the job posting, construct from relative URLs if needed using base URL: ${url})
- description: string (brief job description or requirements, maximum 500 characters)

Return ONLY valid JSON array, no markdown formatting, no explanations. Example format:
[{"title":"Software Engineer","company":"Acme Corp","location":"Remote","url":"https://example.com/job/123","description":"We are looking for..."}]

If no jobs are found, return an empty array: []`;

        const aiResponse = await generateText(prompt);

        // Parse AI response
        let jobs: any[] = [];
        try {
            // Remove markdown code blocks if present
            let jsonStr = aiResponse.trim();
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
            }
            jobs = JSON.parse(jsonStr);
        } catch (parseError) {
            console.error(`[AI Scraper] Failed to parse AI response for ${sourceName}:`, parseError);
            console.error('AI Response:', aiResponse.substring(0, 500));
            return [];
        }

        // Transform to Job objects
        const jobResults: Job[] = jobs.slice(0, limit).map((job, index) => ({
            id: Buffer.from(`${sourceName}-${job.url || index}`).toString('base64'),
            title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            url: job.url || url,
            description: job.description || '',
            postedAt: new Date().toISOString(),
            tags: ['Remote', 'Tech'],
            source: sourceName,
        }));

        console.log(`[AI Scraper] Extracted ${jobResults.length} jobs from ${sourceName}`);
        return jobResults;

    } catch (error) {
        console.error(`[AI Scraper] Error scraping ${sourceName}:`, error);
        return [];
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
