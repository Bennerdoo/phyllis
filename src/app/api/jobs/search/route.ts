import { NextResponse } from 'next/server';
import { JobService } from '@/lib/services/jobService';

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({})); // Handle empty body
        const { keyword } = body;
        const jobs = await JobService.searchJobs(keyword);
        return NextResponse.json({ success: true, jobs });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ success: false, error: 'Failed to search jobs' }, { status: 500 });
    }
}
