import { NextResponse } from 'next/server';
import { UserDB } from '@/lib/database';
import { UserProfile } from '@/lib/types';

/**
 * GET /api/user/profile
 * Get user profile from database
 */
export async function GET() {
    try {
        const profile = UserDB.getProfile();

        return NextResponse.json({
            success: true,
            profile,
        });
    } catch (error) {
        console.error('[API] Failed to get profile:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get profile',
            },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/user/profile
 * Update user profile in database
 */
export async function PUT(request: Request) {
    try {
        const profile: UserProfile = await request.json();

        // Validate required fields
        if (!profile.name || !profile.email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name and email are required',
                },
                { status: 400 }
            );
        }

        UserDB.saveProfile(profile);

        return NextResponse.json({
            success: true,
            message: 'Profile saved successfully',
        });
    } catch (error) {
        console.error('[API] Failed to save profile:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save profile',
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/user/profile
 * Create new user profile (alias for PUT)
 */
export async function POST(request: Request) {
    return PUT(request);
}
