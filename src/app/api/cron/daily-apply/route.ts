import { NextResponse } from 'next/server';
import { ApplicationService } from '@/lib/services/applicationService';

/**
 * Webhook endpoint for external cron services (Vercel Cron, GitHub Actions, cron-job.org, etc.)
 * 
 * Usage:
 * POST https://yourdomain.com/api/cron/daily-apply
 * 
 * Optional: Add authentication header
 * Authorization: Bearer YOUR_CRON_SECRET
 */
export async function POST(request: Request) {
    try {
        // Optional: Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized',
            }, { status: 401 });
        }

        // Parse optional keyword from request body
        const body = await request.json().catch(() => ({}));
        const keyword = body.keyword || process.env.SCHEDULER_KEYWORD || 'developer';

        console.log(`[Cron Webhook] Triggered daily auto-apply with keyword: ${keyword}`);

        // Start the auto-apply process (runs in background)
        ApplicationService.startAutoApply(keyword).catch((error) => {
            console.error('[Cron Webhook] Auto-apply background error:', error);
        });

        return NextResponse.json({
            success: true,
            message: 'Daily auto-apply process started',
            keyword,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[Cron Webhook] API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to start auto-apply',
        }, { status: 500 });
    }
}

// Optional: Support GET for health checks
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Cron webhook endpoint is active',
        tip: 'Send a POST request to trigger the daily auto-apply',
    });
}
