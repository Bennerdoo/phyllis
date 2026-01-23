import { NextResponse } from 'next/server';
import { ScrapingHistoryDB } from '@/lib/database';

/**
 * GET /api/history
 * Returns scraping history from database
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        const history = ScrapingHistoryDB.getHistory(limit);

        return NextResponse.json({
            success: true,
            history,
        });
    } catch (error) {
        console.error('[API] Failed to get history:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get history',
            },
            { status: 500 }
        );
    }
}
