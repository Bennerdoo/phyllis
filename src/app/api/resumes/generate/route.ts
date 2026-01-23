import { NextResponse } from 'next/server';
import { ResumeService } from '@/lib/services/resumeService';
import { generateResumePDFStream } from '@/lib/services/pdfService';
import { dummyProfile } from '@/lib/dummyProfile';
import { Job } from '@/lib/types';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { job } = body as { job: Job };

        // In a real app, we'd fetch the user's saved profile. Using dummy for now.
        let profile = dummyProfile;

        if (job) {
            console.log("Tailoring resume for:", job.title);
            profile = await ResumeService.tailorResume(profile, job);
        }

        const pdfStream = await generateResumePDFStream(profile);

        // Convert stream to buffer to return (NextResponse support for node streams is tricky if not just returning the stream)
        // Actually, we can return the stream directly with the right headers.

        // @ts-ignore - React-PDF stream is compatible with Node stream which Next.js supports
        return new NextResponse(pdfStream, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Resume_${profile.name.replace(/\s+/g, '_')}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Resume Generation Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to generate resume' }, { status: 500 });
    }
}
