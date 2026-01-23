import { NextResponse } from 'next/server';
import { applicationStorage } from '@/lib/storage';

export async function GET() {
    try {
        const applications = applicationStorage.getAll();
        return NextResponse.json({
            success: true,
            applications
        });
    } catch (error) {
        console.error('Applications API error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch applications'
        }, { status: 500 });
    }
}
