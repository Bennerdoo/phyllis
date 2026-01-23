import { NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';

export async function GET() {
    try {
        const status = scheduler.getStatus();
        const history = scheduler.getHistory();

        return NextResponse.json({
            success: true,
            status,
            history,
        });
    } catch (error) {
        console.error('Scheduler status API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to get scheduler status',
        }, { status: 500 });
    }
}
