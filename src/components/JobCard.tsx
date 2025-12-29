'use client';

import { JobApplication, ApplicationStatus } from '@/lib/types';
import ProgressTimeline from './ProgressTimeline';

interface JobCardProps {
    application: JobApplication;
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PENDING]: '🔍 Found',
    [ApplicationStatus.GENERATING_RESUME]: '📝 Generating Resume',
    [ApplicationStatus.RESUME_READY]: '✅ Resume Ready',
    [ApplicationStatus.APPLYING]: '📧 Applying',
    [ApplicationStatus.APPLIED]: '✅ Applied',
    [ApplicationStatus.FAILED]: '❌ Failed',
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.PENDING]: 'bg-gray-700 text-gray-300',
    [ApplicationStatus.GENERATING_RESUME]: 'bg-blue-600 text-white',
    [ApplicationStatus.RESUME_READY]: 'bg-green-600 text-white',
    [ApplicationStatus.APPLYING]: 'bg-purple-600 text-white',
    [ApplicationStatus.APPLIED]: 'bg-green-500 text-white',
    [ApplicationStatus.FAILED]: 'bg-red-600 text-white',
};

const SITE_COLORS: Record<string, string> = {
    'We Work Remotely': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'RemoteOK': 'bg-green-500/20 text-green-400 border-green-500/30',
    'Remote.co': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'FlexJobs': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function JobCard({ application }: JobCardProps) {
    const { job, status, error, stageTimestamps } = application;
    const siteColor = SITE_COLORS[job.source] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';

    // Calculate time elapsed
    const getTimeElapsed = () => {
        const created = new Date(application.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours}h ago`;
    };

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-1">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-2">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 hover:line-clamp-none transition-all" title={job.title}>
                        {job.title}
                    </h3>
                    <p className="text-blue-400 font-medium text-sm">{job.company}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border ${siteColor}`}>
                    {job.source}
                </span>
            </div>

            {/* Location & Time */}
            <div className="flex items-center justify-between mb-4 text-xs">
                <p className="text-gray-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {job.location}
                </p>
                <p className="text-gray-500">{getTimeElapsed()}</p>
            </div>

            {/* Progress Timeline */}
            <div className="mb-4">
                <ProgressTimeline currentStatus={status} stageTimestamps={stageTimestamps} />
            </div>

            {/* Current Status Badge */}
            <div className="mb-4">
                <span
                    className={`inline-block px-3 py-2 rounded-lg text-xs font-bold ${STATUS_COLORS[status]} shadow-lg`}
                >
                    {STATUS_LABELS[status]}
                </span>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs">
                        <span className="font-bold">Error:</span> {error}
                    </p>
                </div>
            )}

            {/* Description Preview */}
            {job.description && (
                <p className="text-gray-400 text-xs mb-4 line-clamp-2">
                    {job.description}
                </p>
            )}

            {/* Action Button */}
            <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                View Job Posting →
            </a>
        </div>
    );
}
