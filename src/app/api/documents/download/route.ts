import { NextRequest, NextResponse } from 'next/server';
import { AnalysisService } from '@/lib/services/analysisService';
import { DocumentType } from '@/lib/types';

/**
 * GET /api/documents/download?jobId=xxx&type=resume
 * Download a generated document
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const jobId = searchParams.get('jobId');
        const type = searchParams.get('type') as DocumentType;

        if (!jobId || !type) {
            return NextResponse.json(
                { error: 'Missing jobId or type parameter' },
                { status: 400 }
            );
        }

        const analysis = AnalysisService.getAnalysis(jobId);
        if (!analysis) {
            return NextResponse.json(
                { error: 'Analysis not found' },
                { status: 404 }
            );
        }

        const document = analysis.documents?.find(d => d.type === type);
        if (!document) {
            return NextResponse.json(
                { error: 'Document not found' },
                { status: 404 }
            );
        }

        // Return DOCX if available
        if (document.docxBuffer) {
            const fileName = `${type}_${analysis.job.company.replace(/[^a-z0-9]/gi, '_')}_${analysis.job.title.replace(/[^a-z0-9]/gi, '_')}.docx`;

            // Convert Buffer to Uint8Array for web-compatible response
            const uint8Array = new Uint8Array(document.docxBuffer);

            return new NextResponse(uint8Array, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                },
            });
        }

        // Return fallback text as plain text
        if (document.fallbackText) {
            const fileName = `${type}_${analysis.job.company.replace(/[^a-z0-9]/gi, '_')}_${analysis.job.title.replace(/[^a-z0-9]/gi, '_')}.txt`;

            return new NextResponse(document.fallbackText, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename="${fileName}"`,
                },
            });
        }

        return NextResponse.json(
            { error: 'Document has no content' },
            { status: 404 }
        );

    } catch (error) {
        console.error('Error downloading document:', error);
        return NextResponse.json(
            { error: 'Failed to download document' },
            { status: 500 }
        );
    }
}
