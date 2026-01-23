import { NextResponse } from 'next/server';
import { scheduler } from '@/lib/scheduler';

export async function POST() {
    try {
        // Manually trigger the scheduler
        scheduler.manualTrigger().catch((error) => {
            console.error('Manual trigger background error:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'Scheduler manually triggered',
        });
    } catch (error) {
        console.error('Scheduler trigger API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to trigger scheduler',
        }, { status: 500 });
    }
}
