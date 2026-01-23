import { NextRequest, NextResponse } from 'next/server';
import { AnalysisService } from '@/lib/services/analysisService';

/**
 * POST /api/analyze
 * Start job analysis process (find CS jobs, analyze requirements, generate documents)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const keyword = body.keyword || 'computer science software engineer developer';

        // Start analysis in background (don't await to return quickly)
        AnalysisService.startJobAnalysis(keyword).catch(error => {
            console.error('Analysis process error:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'Job analysis process started',
        });
    } catch (error) {
        console.error('Error starting analysis:', error);
        return NextResponse.json(
            { error: 'Failed to start analysis' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/analyze
 * Get all job analyses
 */
export async function GET() {
    try {
        const analyses = AnalysisService.getAllAnalyses();
        const status = AnalysisService.getAnalysisStatus();

        return NextResponse.json({
            analyses,
            status,
        });
    } catch (error) {
        console.error('Error getting analyses:', error);
        return NextResponse.json(
            { error: 'Failed to get analyses' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/analyze
 * Clear all analyses
 */
export async function DELETE() {
    try {
        AnalysisService.clearAnalyses();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error clearing analyses:', error);
        return NextResponse.json(
            { error: 'Failed to clear analyses' },
            { status: 500 }
        );
    }
}
