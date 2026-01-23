import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { generateText } from '../gemini';
import { Job, UserProfile, DocumentType, GeneratedDocument, JobRequirements } from '../types';

/**
 * Document Generation Service
 * Uses Gemini AI to generate tailored documents in DOCX format
 * Provides fallback to raw text if DOCX generation fails
 */

export class DocumentService {
    /**
     * Analyze job requirements using Gemini AI
     */
    static async analyzeJobRequirements(job: Job): Promise<JobRequirements> {
        const prompt = `Analyze the following job posting and extract detailed requirements:

Job Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

Extract and return a JSON object with:
- technicalSkills: array of technical skills required (programming languages, frameworks, tools)
- experienceLevel: one of "Entry Level", "Mid-Level", "Senior", "Lead", "Executive"
- yearsOfExperience: string describing years required (e.g., "3-5 years", "5+ years")
- education: array of education requirements
- certifications: array of certifications if mentioned
- softSkills: array of soft skills required
- responsibilities: array of main responsibilities

Return ONLY valid JSON, no markdown formatting.`;

        const response = await generateText(prompt);

        try {
            let jsonStr = response.trim();
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
            }
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('Failed to parse job requirements:', error);
            // Return default structure
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
        const prompt = `Based on this job posting, determine what documents are typically required:

Job Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

Return a JSON array of document types needed. Choose from: "resume", "cv", "cover_letter"
Most jobs need at least a resume. CV is common for academic/research/international positions. Cover letter varies.

Return ONLY a JSON array like: ["resume", "cover_letter"]`;

        const response = await generateText(prompt);

        try {
            let jsonStr = response.trim();
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
            }
            const docs = JSON.parse(jsonStr);
            return docs.map((d: string) => d.toLowerCase() as DocumentType);
        } catch (error) {
            console.error('Failed to detect required documents:', error);
            // Default to resume and cover letter
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
        const prompt = `Generate a tailored resume content for this job application:

Job: ${job.title} at ${job.company}
Job Description: ${job.description}

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- summary: tailored professional summary (2-3 sentences)
- skills: array of relevant skills from candidate's profile, ordered by relevance to job
- experience: array of experience objects with company, role, startDate, endDate, description (tailored to highlight relevant achievements)
- projects: array of relevant projects

Focus on computer science and tech skills. Emphasize achievements relevant to the job requirements.
Return ONLY valid JSON.`;

        const response = await generateText(prompt);
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
        }
        return JSON.parse(jsonStr);
    }

    /**
     * Generate CV content using AI (more detailed than resume)
     */
    private static async generateCVContent(profile: UserProfile, job: Job) {
        const prompt = `Generate a comprehensive CV content for this position:

Job: ${job.title} at ${job.company}
Job Description: ${job.description}

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Return JSON with:
- summary: comprehensive professional summary (3-4 sentences)
- skills: complete array of all technical skills
- experience: detailed experience array with full descriptions
- projects: all relevant projects with technical details

CVs are more comprehensive than resumes. Include all relevant details.
Return ONLY valid JSON.`;

        const response = await generateText(prompt);
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
        }
        return JSON.parse(jsonStr);
    }

    /**
     * Generate cover letter content using AI
     */
    private static async generateCoverLetterContent(profile: UserProfile, job: Job) {
        const prompt = `Write a professional cover letter for this job application:

Job: ${job.title} at ${job.company}
Company: ${job.company}
Job Description: ${job.description}

Candidate: ${profile.name}
Summary: ${profile.summary}
Key Skills: ${profile.skills.slice(0, 5).join(', ')}

Return JSON with:
- paragraphs: array of 3-4 paragraph strings for the cover letter body

Make it enthusiastic but professional. Highlight relevant skills and experience.
Return ONLY valid JSON.`;

        const response = await generateText(prompt);
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
        }
        return JSON.parse(jsonStr);
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
