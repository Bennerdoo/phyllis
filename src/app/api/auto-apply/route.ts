import { NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/applicationService';
import { scheduler } from '@/lib/scheduler';

// Initialize scheduler on first API call
let schedulerInitialized = false;
if (!schedulerInitialized) {
    scheduler.initialize();
    schedulerInitialized = true;
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const { keyword } = body;

        // Start the auto-apply process (runs in background)
        ApplicationService.startAutoApply(keyword).catch((error) => {
            console.error('Auto-apply background error:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'Auto-apply process started'
        });
    } catch (error) {
        console.error('Auto-apply API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to start auto-apply'
        }, { status: 500 });
    }
}
