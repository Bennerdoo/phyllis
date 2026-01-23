import { Job, ApplicationStatus } from '../types';
import { JobService } from './jobService';
import { ResumeService } from './resumeService';
import { generateResumePDFStream } from './pdfService';
import { sendApplicationEmail } from '../email';
import { dummyProfile } from '../dummyProfile';
import { generateText } from '../gemini';
import { applicationStorage } from '../storage';

// Helper to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export class ApplicationService {
    static async startAutoApply(keyword?: string): Promise<void> {
        try {
            // Step 1: Search for jobs
            const jobs = await JobService.searchJobs(keyword);

            // Step 2: Add all jobs to storage with PENDING status
            for (const job of jobs) {
                applicationStorage.add(job);
            }

            // Step 3: Process each job sequentially
            for (const job of jobs) {
                await this.processJobApplication(job);
            }
        } catch (error) {
            console.error('Auto-apply error:', error);
            throw error;
        }
    }

    private static async processJobApplication(job: Job): Promise<void> {
        try {
            // Update status: Generating resume
            applicationStorage.update(job.id, {
                status: ApplicationStatus.GENERATING_RESUME,
            });

            // Generate tailored resume
            const tailoredProfile = await ResumeService.tailorResume(dummyProfile, job);

            // Update status: Resume ready
            applicationStorage.update(job.id, {
                status: ApplicationStatus.RESUME_READY,
            });

            // Generate PDF
            const pdfStream = await generateResumePDFStream(tailoredProfile);
            const pdfBuffer = await streamToBuffer(pdfStream);

            // Update status: Applying
            applicationStorage.update(job.id, {
                status: ApplicationStatus.APPLYING,
            });

            // Generate cover letter
            const emailBody = await generateText(`
                Write a professional, short, and enthusiastic email body for applying to the position of ${job.title} at ${job.company}.
                The candidate's name is ${tailoredProfile.name}.
                Mention that the resume is attached.
                Keep it direct and professional.
            `);

            // Send application email to user's email (for review/forwarding)
            const result = await sendApplicationEmail(
                tailoredProfile.email,
                `Application for ${job.title} - ${tailoredProfile.name}`,
                emailBody,
                [
                    {
                        filename: `Resume_${tailoredProfile.name.replace(/\s+/g, '_')}_${job.company.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                    },
                ]
            );

            // Update status: Applied or Failed
            if (result.success) {
                applicationStorage.update(job.id, {
                    status: ApplicationStatus.APPLIED,
                });
            } else {
                applicationStorage.update(job.id, {
                    status: ApplicationStatus.FAILED,
                    error: 'Failed to send email',
                });
            }
        } catch (error) {
            console.error(`Failed to process application for ${job.title}:`, error);
            applicationStorage.update(job.id, {
                status: ApplicationStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
}
