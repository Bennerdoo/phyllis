import puppeteer from 'puppeteer';
import { generateText } from './gemini';
import { Job, JobRequirements, DocumentType } from './types';

/**
 * AI-Powered Job Scraper for Computer Science Positions
 * Uses Gemini AI to intelligently extract CS/tech job listings from any website's HTML
 * Extracts detailed requirements and detects needed documents
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

        // Use Gemini AI to extract CS/tech job listings from HTML
        const prompt = `You are a computer science job data extraction expert. Extract ONLY computer science, software engineering, and tech-related job listings from the following HTML page.

HTML Content:
${html.substring(0, 50000)} 

IMPORTANT FILTERING RULES:
- ONLY include jobs related to: software engineering, computer science, programming, web development, mobile development, data science, AI/ML, DevOps, system administration, IT, cybersecurity, QA/testing, tech support, technical roles
- EXCLUDE: non-tech jobs, marketing, sales, customer service (unless technical), management (unless technical/engineering management), design (unless UI/UX or technical design)

Extract up to ${limit} COMPUTER SCIENCE/TECH job listings and return them as a JSON array. Each job should have:
- title: string (job title)
- company: string (company name)
- location: string (job location, default to "Remote" if not specified)
- url: string (full URL to the job posting, construct from relative URLs if needed using base URL: ${url})
- description: string (job description including requirements, maximum 1000 characters)
- requirements: object with:
  - technicalSkills: array of required technical skills (languages, frameworks, tools)
  - experienceLevel: one of "Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Not Specified"
  - yearsOfExperience: string like "3-5 years" or "5+ years" or null
  - education: array of education requirements (e.g., ["Bachelor's in Computer Science"])
  - certifications: array of certifications if mentioned, or empty array
  - softSkills: array of soft skills mentioned, or empty array
  - responsibilities: array of main job responsibilities
- documentsNeeded: array of strings from ["resume", "cv", "cover_letter"] - what documents the job requires

Return ONLY valid JSON array, no markdown formatting, no explanations. Example format:
[{
  "title":"Software Engineer",
  "company":"Acme Corp",
  "location":"Remote",
  "url":"https://example.com/job/123",
  "description":"We are looking for a software engineer...",
  "requirements":{
    "technicalSkills":["JavaScript","React","Node.js"],
    "experienceLevel":"Mid-Level",
    "yearsOfExperience":"3-5 years",
    "education":["Bachelor's in Computer Science or related field"],
    "certifications":[],
    "softSkills":["Communication","Teamwork"],
    "responsibilities":["Develop web applications","Code reviews","Collaborate with team"]
  },
  "documentsNeeded":["resume","cover_letter"]
}]

If no computer science/tech jobs are found, return an empty array: []`;

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

        // Transform to Job objects with enhanced fields
        const jobResults: Job[] = jobs.slice(0, limit).map((job, index) => ({
            id: Buffer.from(`${sourceName}-${job.url || index}-${Date.now()}`).toString('base64'),
            title: job.title || 'Unknown Title',
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            url: job.url || url,
            description: job.description || '',
            postedAt: new Date().toISOString(),
            tags: ['Computer Science', 'Tech', ...(job.requirements?.technicalSkills?.slice(0, 3) || [])],
            source: sourceName,
            requirements: job.requirements || {
                technicalSkills: [],
                experienceLevel: 'Not Specified',
                education: [],
                softSkills: [],
                responsibilities: [],
            },
            documentsNeeded: job.documentsNeeded?.map((d: string) => d.toLowerCase() as DocumentType) ||
                [DocumentType.RESUME, DocumentType.COVER_LETTER],
            aiAnalysis: `Job requires ${job.requirements?.experienceLevel || 'unspecified'} level candidate with skills in ${job.requirements?.technicalSkills?.slice(0, 3).join(', ') || 'various technologies'}.`,
        }));

        console.log(`[AI Scraper] Extracted ${jobResults.length} CS/tech jobs from ${sourceName}`);
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
