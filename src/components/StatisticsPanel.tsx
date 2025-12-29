'use client';

import { JobApplication, ApplicationStatus } from '@/lib/types';

interface StatisticsPanelProps {
    applications: JobApplication[];
}

export default function StatisticsPanel({ applications }: StatisticsPanelProps) {
    // Calculate statistics
    const totalApps = applications.length;
    const appliedCount = applications.filter(app => app.status === ApplicationStatus.APPLIED).length;
    const failedCount = applications.filter(app => app.status === ApplicationStatus.FAILED).length;
    const inProgressCount = totalApps - appliedCount - failedCount;

    // Site breakdown
    const siteBreakdown = applications.reduce((acc, app) => {
        const site = app.job.source;
        acc[site] = (acc[site] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Status breakdown
    const statusBreakdown = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as Record<ApplicationStatus, number>);

    const successRate = totalApps > 0 ? ((appliedCount / totalApps) * 100).toFixed(1) : '0';

    if (totalApps === 0) return null;

    return (
        <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                📊 Application Statistics
            </h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-white mb-1">{totalApps}</div>
                    <div className="text-gray-400 text-sm">Total Applications</div>
                </div>
                <div className="bg-green-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400 mb-1">{appliedCount}</div>
                    <div className="text-gray-400 text-sm">✅ Applied</div>
                </div>
                <div className="bg-blue-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{inProgressCount}</div>
                    <div className="text-gray-400 text-sm">⏳ In Progress</div>
                </div>
                <div className="bg-purple-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{successRate}%</div>
                    <div className="text-gray-400 text-sm">Success Rate</div>
                </div>
            </div>

            {/* Site Breakdown */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-300 mb-3">📍 By Job Site</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(siteBreakdown).map(([site, count]) => (
                        <div key={site} className="bg-gray-700/30 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-gray-300 font-medium">{site}</span>
                            <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {count}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Breakdown */}
            <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">📈 By Status</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    {Object.entries(statusBreakdown).map(([status, count]) => {
                        const statusLabels = {
                            [ApplicationStatus.PENDING]: '🔍 Found',
                            [ApplicationStatus.GENERATING_RESUME]: '📝 Resume',
                            [ApplicationStatus.RESUME_READY]: '✅ Ready',
                            [ApplicationStatus.APPLYING]: '📧 Sending',
                            [ApplicationStatus.APPLIED]: '✅ Applied',
                            [ApplicationStatus.FAILED]: '❌ Failed',
                        };
                        return (
                            <div key={status} className="bg-gray-700/30 rounded-lg p-2 text-center">
                                <div className="text-gray-400 text-xs mb-1">{statusLabels[status as ApplicationStatus]}</div>
                                <div className="text-white font-bold">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
