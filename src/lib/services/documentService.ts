import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { generateText, generateStructuredJSON } from '../gemini';
import { Job, UserProfile, DocumentType, GeneratedDocument, JobRequirements } from '../types';
import { scrapeJobContent } from '../scraper';
import { Schema, Type } from '@google/generative-ai';

// ─── AI SCHEMAS ──────────────────────────────────────────────

const jobRequirementsSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        technicalSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Technical skills, languages, frameworks, or tools required"
        },
        experienceLevel: {
            type: Type.STRING,
            description: "Required experience level",
            enum: ["Entry Level", "Junior", "Mid-Level", "Senior", "Lead", "Executive", "Not Specified"]
        },
        yearsOfExperience: {
            type: Type.STRING,
            description: "Years of experience required, or null if unspecified"
        },
        education: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Education or degrees requested"
        },
        certifications: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Certifications requested"
        },
        softSkills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Soft skills requested"
        },
        responsibilities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Key responsibilities of the role"
        }
    },
    required: ["technicalSkills", "experienceLevel", "education", "softSkills", "responsibilities"]
};

const documentsSchema: Schema = {
    type: Type.ARRAY,
    items: {
        type: Type.STRING,
        enum: ["resume", "cv", "cover_letter"]
    },
    description: "What documents are required to apply"
};

const resumeContentSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Tailored professional summary (2-3 sentences)" },
        skills: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "List of relevant skills from candidate's profile, ordered by relevance to the job" 
        },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING, description: "Tailored bullet points highlighting relevant achievements" }
                },
                required: ["company", "role", "startDate", "endDate", "description"]
            }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
            }
        }
    },
    required: ["summary", "skills", "experience", "projects"]
};

const cvContentSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING, description: "Comprehensive tailored summary (3-4 sentences)" },
        skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        experience: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    role: { type: Type.STRING },
                    startDate: { type: Type.STRING },
                    endDate: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["company", "role", "startDate", "endDate", "description"]
            }
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
            }
        }
    },
    required: ["summary", "skills", "experience", "projects"]
};

const coverLetterContentSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        paragraphs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 paragraphs of the cover letter body"
        }
    },
    required: ["paragraphs"]
};

/**
 * Document Generation Service
 * Uses Gemini AI to generate tailored documents in DOCX format
 * Provides fallback to raw text if DOCX generation fails
 */

export class DocumentService {
    /**
     * Analyze job requirements using Gemini AI
     * Fetches details from job URL if available for richer context
     */
    static async analyzeJobRequirements(job: Job): Promise<JobRequirements> {
        // Fetch detailed page if URL is present and not yet fetched
        if (job.url && job.url.startsWith('http') && job.description.length < 1500) {
            try {
                console.log(`   🌐 [DocumentService] Fetching job details from URL: ${job.url}`);
                const details = await scrapeJobContent(job.url);
                if (details && details.trim().length > 150) {
                    job.description = details;
                }
            } catch (err) {
                console.warn(`   ⚠️ [DocumentService] Failed to fetch job detail page:`, err);
            }
        }

        const systemInstruction = "You are an expert technical recruiter and job analyst. Analyze job descriptions and extract precise, factual requirements.";
        const prompt = `Analyze the following job description and extract detailed requirements:

Job Title: ${job.title}
Company: ${job.company}
Description:
${job.description}`;

        try {
            return await generateStructuredJSON(prompt, jobRequirementsSchema, systemInstruction, 0.1);
        } catch (error) {
            console.error('Failed to analyze job requirements with structured AI:', error);
            return {
                technicalSkills: [],
                experienceLevel: 'Not Specified',
                education: [],
                softSkills: [],
                responsibilities: [],
            };
        }
    }

    /**
     * Detect what documents are needed for the job
     */
    static async detectRequiredDocuments(job: Job): Promise<DocumentType[]> {
        const systemInstruction = "Determine which documents are typically required based on the job details provided. Most jobs require a resume at minimum.";
        const prompt = `Identify required application documents (resume, cv, cover_letter) from the job details below:

Job Title: ${job.title}
Company: ${job.company}
Description:
${job.description}`;

        try {
            const docs = await generateStructuredJSON(prompt, documentsSchema, systemInstruction, 0.1);
            return docs.map((d: string) => d.toLowerCase() as DocumentType);
        } catch (error) {
            console.error('Failed to detect required documents:', error);
            return [DocumentType.RESUME, DocumentType.COVER_LETTER];
        }
    }

    /**
     * Generate Resume in DOCX format
     */
    static async generateResumeDOCX(profile: UserProfile, job: Job): Promise<GeneratedDocument> {
        try {
            // First, get tailored content from Gemini
            const content = await this.generateResumeContent(profile, job);

            // Create DOCX document
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // Header with name
                        new Paragraph({
                            text: profile.name,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: profile.email, size: 20 }),
                                new TextRun({ text: ' | ', size: 20 }),
                                new TextRun({ text: profile.phone, size: 20 }),
                                new TextRun({ text: ' | ', size: 20 }),
                                new TextRun({ text: profile.location, size: 20 }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: '' }), // Spacing

                        // Professional Summary
                        new Paragraph({
                            text: 'PROFESSIONAL SUMMARY',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({
                            text: content.summary,
                        }),
                        new Paragraph({ text: '' }),

                        // Technical Skills
                        new Paragraph({
                            text: 'TECHNICAL SKILLS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({
                            text: content.skills.join(' • '),
                        }),
                        new Paragraph({ text: '' }),

                        // Experience
                        new Paragraph({
                            text: 'PROFESSIONAL EXPERIENCE',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createExperienceSection(content.experience),
                        new Paragraph({ text: '' }),

                        // Education
                        new Paragraph({
                            text: 'EDUCATION',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createEducationSection(profile.education),
                        new Paragraph({ text: '' }),

                        // Projects
                        new Paragraph({
                            text: 'PROJECTS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createProjectsSection(content.projects),
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);

            return {
                type: DocumentType.RESUME,
                jobId: job.id,
                docxBuffer: buffer as Buffer,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Failed to generate resume DOCX:', error);
            // Fallback to text
            const fallbackText = await this.generateDocumentFallback(DocumentType.RESUME, profile, job);
            return {
                type: DocumentType.RESUME,
                jobId: job.id,
                fallbackText,
                generatedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generate CV in DOCX format
     */
    static async generateCVDOCX(profile: UserProfile, job: Job): Promise<GeneratedDocument> {
        try {
            const content = await this.generateCVContent(profile, job);

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: 'CURRICULUM VITAE',
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            text: profile.name,
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: profile.email, size: 20 }),
                                new TextRun({ text: ' | ', size: 20 }),
                                new TextRun({ text: profile.phone, size: 20 }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                        new Paragraph({ text: '' }),

                        new Paragraph({
                            text: 'SUMMARY',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({ text: content.summary }),
                        new Paragraph({ text: '' }),

                        new Paragraph({
                            text: 'EDUCATION',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createEducationSection(profile.education),
                        new Paragraph({ text: '' }),

                        new Paragraph({
                            text: 'PROFESSIONAL EXPERIENCE',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createExperienceSection(content.experience),
                        new Paragraph({ text: '' }),

                        new Paragraph({
                            text: 'SKILLS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        new Paragraph({ text: content.skills.join(', ') }),
                        new Paragraph({ text: '' }),

                        new Paragraph({
                            text: 'PROJECTS & PUBLICATIONS',
                            heading: HeadingLevel.HEADING_2,
                        }),
                        ...this.createProjectsSection(content.projects),
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);

            return {
                type: DocumentType.CV,
                jobId: job.id,
                docxBuffer: buffer as Buffer,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Failed to generate CV DOCX:', error);
            const fallbackText = await this.generateDocumentFallback(DocumentType.CV, profile, job);
            return {
                type: DocumentType.CV,
                jobId: job.id,
                fallbackText,
                generatedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generate Cover Letter in DOCX format
     */
    static async generateCoverLetterDOCX(profile: UserProfile, job: Job): Promise<GeneratedDocument> {
        try {
            const content = await this.generateCoverLetterContent(profile, job);

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            text: profile.name,
                            alignment: AlignmentType.LEFT,
                        }),
                        new Paragraph({ text: profile.email }),
                        new Paragraph({ text: profile.phone }),
                        new Paragraph({ text: profile.location }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: new Date().toLocaleDateString() }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: `Hiring Manager` }),
                        new Paragraph({ text: job.company }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: `Dear Hiring Manager,` }),
                        new Paragraph({ text: '' }),
                        ...content.paragraphs.map((p: string) => new Paragraph({ text: p })),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: 'Sincerely,' }),
                        new Paragraph({ text: '' }),
                        new Paragraph({ text: profile.name }),
                    ],
                }],
            });

            const buffer = await Packer.toBuffer(doc);

            return {
                type: DocumentType.COVER_LETTER,
                jobId: job.id,
                docxBuffer: buffer as Buffer,
                generatedAt: new Date().toISOString(),
            };
        } catch (error) {
            console.error('Failed to generate cover letter DOCX:', error);
            const fallbackText = await this.generateDocumentFallback(DocumentType.COVER_LETTER, profile, job);
            return {
                type: DocumentType.COVER_LETTER,
                jobId: job.id,
                fallbackText,
                generatedAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Generate resume content using AI
     */
    private static async generateResumeContent(profile: UserProfile, job: Job) {
        const systemInstruction = `You are an expert Resume Writer and ATS Optimizer. 
CRITICAL RULE: Do NOT invent or fabricate any job roles, companies, projects, dates, or skills. 
Use only the actual work history, projects, and skills present in the candidate profile. 
You may rephrase, prioritize, and emphasize the candidate's existing achievements to highlight skills relevant to the job, but everything must remain 100% factual.`;

        const prompt = `Generate tailored resume content based on this candidate profile and job description:

Job: ${job.title} at ${job.company}
Job Description:
${job.description}

Candidate Profile:
${JSON.stringify(profile, null, 2)}`;

        try {
            return await generateStructuredJSON(prompt, resumeContentSchema, systemInstruction, 0.7);
        } catch (error) {
            console.error("Failed to generate tailored resume content with structured AI:", error);
            throw error;
        }
    }

    /**
     * Generate CV content using AI (more detailed than resume)
     */
    private static async generateCVContent(profile: UserProfile, job: Job) {
        const systemInstruction = `You are an expert CV Writer and Academic Recruiter. 
CRITICAL RULE: Do NOT invent or fabricate any job roles, companies, projects, education details, dates, or skills. 
Use only the actual history and details present in the candidate profile. 
You may rephrase and optimize existing achievements to align with the job requirements, but everything must remain 100% factual.`;

        const prompt = `Generate a comprehensive CV content for this position:

Job: ${job.title} at ${job.company}
Job Description:
${job.description}

Candidate Profile:
${JSON.stringify(profile, null, 2)}`;

        try {
            return await generateStructuredJSON(prompt, cvContentSchema, systemInstruction, 0.7);
        } catch (error) {
            console.error("Failed to generate tailored CV content with structured AI:", error);
            throw error;
        }
    }

    /**
     * Generate cover letter content using AI
     */
    private static async generateCoverLetterContent(profile: UserProfile, job: Job) {
        const systemInstruction = `You are a professional cover letter writer. Write an enthusiastic, professional cover letter body based on the candidate's profile and the job posting. Do NOT invent new qualifications. Use 3 to 4 paragraphs.`;

        const prompt = `Write a professional cover letter for this job application:

Job: ${job.title} at ${job.company}
Company: ${job.company}
Job Description:
${job.description}

Candidate Name: ${profile.name}
Summary: ${profile.summary}
Key Skills: ${profile.skills.slice(0, 5).join(', ')}`;

        try {
            return await generateStructuredJSON(prompt, coverLetterContentSchema, systemInstruction, 0.7);
        } catch (error) {
            console.error("Failed to generate cover letter content with structured AI:", error);
            throw error;
        }
    }

    /**
     * Generate fallback text document if DOCX generation fails
     */
    static async generateDocumentFallback(
        type: DocumentType,
        profile: UserProfile,
        job: Job
    ): Promise<string> {
        const prompt = `Generate a ${type} in plain text format for:

Job: ${job.title} at ${job.company}
Description: ${job.description}

Candidate:
${JSON.stringify(profile, null, 2)}

Create a professional, well-formatted ${type} in plain text that can be copied into a word processor.
Use proper spacing and formatting. Make it ATS-friendly and tailored to the job.`;

        return await generateText(prompt);
    }

    /**
     * Helper to create experience section paragraphs
     */
    private static createExperienceSection(experiences: any[]): Paragraph[] {
        const paragraphs: Paragraph[] = [];

        for (const exp of experiences) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: exp.role, bold: true }),
                        new TextRun({ text: ' | ' }),
                        new TextRun({ text: exp.company, italics: true }),
                    ],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, italics: true }),
                    ],
                }),
                new Paragraph({ text: exp.description }),
                new Paragraph({ text: '' })
            );
        }

        return paragraphs;
    }

    /**
     * Helper to create education section paragraphs
     */
    private static createEducationSection(education: any[]): Paragraph[] {
        const paragraphs: Paragraph[] = [];

        for (const edu of education) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: edu.degree, bold: true }),
                        new TextRun({ text: ' | ' }),
                        new TextRun({ text: edu.school, italics: true }),
                    ],
                }),
                new Paragraph({ text: edu.year }),
                new Paragraph({ text: '' })
            );
        }

        return paragraphs;
    }

    /**
     * Helper to create projects section paragraphs
     */
    private static createProjectsSection(projects: any[]): Paragraph[] {
        const paragraphs: Paragraph[] = [];

        for (const proj of projects) {
            paragraphs.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: proj.name, bold: true }),
                    ],
                }),
                new Paragraph({ text: proj.description }),
                new Paragraph({ text: '' })
            );
        }

        return paragraphs;
    }
}
