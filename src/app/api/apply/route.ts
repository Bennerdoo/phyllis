import { NextResponse } from 'next/server';
import { ResumeService } from '@/lib/services/resumeService';
import { generateResumePDFStream } from '@/lib/services/pdfService';
import { sendApplicationEmail } from '@/lib/email';
import { dummyProfile } from '@/lib/dummyProfile';
import { Job } from '@/lib/types';
import { generateText } from '@/lib/gemini';

// Helper to convert stream to buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { job, emailOverride } = body as { job: Job; emailOverride?: string };

        // 1. Prepare Profile
        let profile = dummyProfile;
        if (job) {
            profile = await ResumeService.tailorResume(profile, job);
        }

        // 2. Generate PDF
        const pdfStream = await generateResumePDFStream(profile);
        const pdfBuffer = await streamToBuffer(pdfStream);

        // 3. Generate Cover Letter / Email Body
        const emailBody = await generateText(`
      Write a professional, short, and enthusiastic email body for applying to the position of ${job.title} at ${job.company}.
      The candidate's name is ${profile.name}.
      Mention that the resume is attached.
      Keep it direct.
    `);

        // 4. Determine Recipient (Job email or User's email to forward)
        // For this demo, we'll default to the user's email if job has no email, or use the override.
        const recipient = emailOverride || profile.email; // Sending to self for review/forwarding

        // 5. Send Email
        const result = await sendApplicationEmail(
            recipient, // Send to...
            `Application for ${job.title} - ${profile.name}`, // Subject
            emailBody, // Body
            [
                {
                    filename: `Resume_${profile.name.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBuffer,
                },
            ]
        );

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Application sent successfully (to your email for review)' });
        } else {
            return NextResponse.json({ success: false, error: 'Failed to send email' });
        }

    } catch (error) {
        console.error("Apply Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to apply' }, { status: 500 });
    }
}
