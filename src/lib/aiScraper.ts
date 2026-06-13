import puppeteer from 'puppeteer';
import { generateStructuredJSON } from './gemini';
import { Job, JobRequirements, DocumentType } from './types';
import { Schema, SchemaType } from '@google/generative-ai';

/**
 * Utility to clean HTML to reduce size and remove noise
 */
export function cleanHtmlForAI(html: string): string {
    // 1. Remove script, style, and svg content
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
    
    // 2. Remove inline styles and classes to reduce size
    cleaned = cleaned.replace(/\sclass="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\sstyle="[^"]*"/gi, '');
    
    // 3. Remove header, footer, and navigation
    cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
    cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
    
    // 4. Strip base64 images/assets
    cleaned = cleaned.replace(/src="data:image\/[^;]+;base64,[^"]*"/gi, 'src=""');
    
    // 5. Replace multiple whitespaces/newlines with single ones
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    return cleaned;
}

// Define strict JSON Schema for extracting jobs list
const jobsListSchema: Schema = {
    type: SchemaType.ARRAY,
    description: "List of tech job postings extracted from the HTML",
    items: {
        type: SchemaType.OBJECT,
        properties: {
            title: { type: SchemaType.STRING, description: "Job title" },
            company: { type: SchemaType.STRING, description: "Company name" },
            location: { type: SchemaType.STRING, description: "Job location, default to 'Remote' if unspecified" },
            url: { type: SchemaType.STRING, description: "Full URL to the job posting. Construct using the base URL if relative." },
            description: { type: SchemaType.STRING, description: "Brief job description or snippet under 1000 characters" },
            requirements: {
                type: SchemaType.OBJECT,
                properties: {
                    technicalSkills: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Technical skills requested"
                    },
                    experienceLevel: {
                        type: SchemaType.STRING,
                        description: "Experience level required",
                        format: "enum",
                        enum: ["Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Executive", "Not Specified"]
                    },
                    yearsOfExperience: {
                        type: SchemaType.STRING,
                        description: "Years of experience required, or null if unspecified"
                    },
                    education: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Education degrees required"
                    },
                    certifications: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Certifications required"
                    },
                    softSkills: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Soft skills requested"
                    },
                    responsibilities: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                        description: "Main job responsibilities"
                    }
                },
                required: ["technicalSkills", "experienceLevel", "education", "softSkills", "responsibilities"]
            },
            documentsNeeded: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.STRING,
                    format: "enum",
                    enum: ["resume", "cv", "cover_letter"]
                },
                description: "What documents are required to apply"
            }
        },
        required: ["title", "company", "location", "url", "description", "requirements", "documentsNeeded"]
    }
};

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

        // Get the page HTML and sanitize it
        const rawHtml = await page.content();
        const cleanedHtml = cleanHtmlForAI(rawHtml);

        // Close browser early to free resources
        await browser.close();
        browser = undefined;

        // Use Gemini AI to extract CS/tech job listings from HTML
        const systemInstruction = "You are a professional computer science job data extraction expert. Extract only computer science, software engineering, and technical jobs.";
        const prompt = `Extract ONLY computer science, software engineering, and tech-related job listings from the following sanitized HTML content:

HTML Content:
${cleanedHtml.substring(0, 120000)} 

IMPORTANT FILTERING RULES:
- ONLY include jobs related to: software engineering, computer science, programming, web development, mobile development, data science, AI/ML, DevOps, system administration, IT, cybersecurity, QA/testing, tech support, technical roles
- EXCLUDE: non-tech jobs, marketing, sales, customer service (unless technical), management (unless technical/engineering management), design (unless UI/UX or technical design)

Extract up to ${limit} COMPUTER SCIENCE/TECH job listings.
Construct full URLs from relative URLs if needed using the base URL: ${url}`;

        const jobs = await generateStructuredJSON(prompt, jobsListSchema, systemInstruction, 0.1);

        if (!Array.isArray(jobs)) {
            console.error(`[AI Scraper] Gemini did not return an array for ${sourceName}`);
            return [];
        }

        // Transform to Job objects with enhanced fields
        const jobResults: Job[] = jobs.slice(0, limit).map((job: any, index: number) => ({
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

