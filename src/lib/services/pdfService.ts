import { renderToStream, DocumentProps } from '@react-pdf/renderer';
import { ResumePDF } from '@/components/ResumePDF';
import { UserProfile } from '@/lib/types';
import React from 'react';

export async function generateResumePDFStream(profile: UserProfile) {
    // Cast to any to avoid strict type checking on the root element props
    // @react-pdf/renderer expects DocumentProps but we are passing a wrapper component
    return await renderToStream(React.createElement(ResumePDF, { profile }) as any);
}
