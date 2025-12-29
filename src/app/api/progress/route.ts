import { NextResponse } from 'next/server';
import { progressTracker } from '@/lib/progressTracker';

/**
 * GET /api/progress
 * Returns real-time scraping progress
 */
export async function GET() {
    try {
        const progress = progressTracker.getProgress();

        return NextResponse.json({
            success: true,
            progress,
        });
    } catch (error) {
        console.error('[API] Failed to get progress:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get progress',
            },
            { status: 500 }
        );
    }
}
