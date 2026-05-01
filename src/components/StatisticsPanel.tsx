'use client';

import { JobAnalysis, AnalysisStatus } from '@/lib/types';

interface StatisticsPanelProps {
    analyses: JobAnalysis[];
}

export default function StatisticsPanel({ analyses }: StatisticsPanelProps) {
    const totalAnalyses = analyses.length;
    const completeCount = analyses.filter(a => a.status === AnalysisStatus.COMPLETE).length;
    const failedCount = analyses.filter(a => a.status === AnalysisStatus.FAILED).length;
    const inProgressCount = totalAnalyses - completeCount - failedCount;

    const totalDocs = analyses.reduce((sum, a) => sum + (a.documents?.length || 0), 0);

    const successfulDocx = analyses.reduce((sum, a) => {
        return sum + (a.documents?.filter(d => d.docxBuffer).length || 0);
    }, 0);

    const siteBreakdown = analyses.reduce((acc, a) => {
        const site = a.job.source;
        acc[site] = (acc[site] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const successRate = totalAnalyses > 0 ? ((completeCount / totalAnalyses) * 100).toFixed(0) : '0';
    const docGenRate = totalDocs > 0 ? ((successfulDocx / totalDocs) * 100).toFixed(0) : '0';

    if (totalAnalyses === 0) return null;

    const stats = [
        { label: 'Total jobs', value: totalAnalyses },
        { label: 'Complete', value: completeCount },
        { label: 'In progress', value: inProgressCount },
        { label: 'Failed', value: failedCount },
        { label: 'Documents', value: totalDocs },
        { label: 'Success rate', value: `${successRate}%` },
        { label: 'DOCX rate', value: `${docGenRate}%` },
        { label: 'Sources', value: Object.keys(siteBreakdown).length },
    ];

    return (
        <div className="mb-6">
            {/* Stats grid — 2-col tight layout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border border-[#262626] rounded bg-[#171717]">
                {stats.map((stat, i) => (
                    <div
                        key={stat.label}
                        className={`px-4 py-3 ${
                            i < stats.length - (stats.length % 4 || 4) ? 'border-b border-[#262626]' : ''
                        } ${i % 4 !== 3 ? 'border-r border-[#262626]' : ''}`}
                    >
                        <p className="text-lg font-semibold text-[#e5e5e5]">{stat.value}</p>
                        <p className="text-xs text-[#525252]">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Site breakdown — compact */}
            {Object.keys(siteBreakdown).length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(siteBreakdown)
                        .sort(([, a], [, b]) => b - a)
                        .map(([site, count]) => (
                            <span
                                key={site}
                                className="bg-[#1f1f1f] text-[#a3a3a3] text-xs px-2 py-0.5 rounded"
                            >
                                {site} {count}
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
}
