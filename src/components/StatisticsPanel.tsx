'use client';

import { JobAnalysis, AnalysisStatus } from '@/lib/types';

interface StatisticsPanelProps {
    analyses: JobAnalysis[];
}

export default function StatisticsPanel({ analyses }: StatisticsPanelProps) {
    // Calculate statistics
    const totalAnalyses = analyses.length;
    const completeCount = analyses.filter(a => a.status === AnalysisStatus.COMPLETE).length;
    const failedCount = analyses.filter(a => a.status === AnalysisStatus.FAILED).length;
    const inProgressCount = totalAnalyses - completeCount - failedCount;

    // Count total documents generated
    const totalDocs = analyses.reduce((sum, a) => sum + (a.documents?.length || 0), 0);

    // Count successful DOCX generations
    const successfulDocx = analyses.reduce((sum, a) => {
        return sum + (a.documents?.filter(d => d.docxBuffer).length || 0);
    }, 0);

    // Site breakdown
    const siteBreakdown = analyses.reduce((acc, a) => {
        const site = a.job.source;
        acc[site] = (acc[site] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Status breakdown
    const statusBreakdown = analyses.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
    }, {} as Record<AnalysisStatus, number>);

    const successRate = totalAnalyses > 0 ? ((completeCount / totalAnalyses) * 100).toFixed(1) : '0';
    const docGenRate = totalDocs > 0 ? ((successfulDocx / totalDocs) * 100).toFixed(1) : '0';

    if (totalAnalyses === 0) return null;

    return (
        <div className="mb-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                📊 Analysis Statistics
            </h2>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-xl p-4 text-center backdrop-blur-sm">
                    <div className="text-3xl font-bold text-white mb-1">{totalAnalyses}</div>
                    <div className="text-gray-400 text-sm">Total Jobs Analyzed</div>
                </div>
                <div className="bg-green-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400 mb-1">{completeCount}</div>
                    <div className="text-gray-400 text-sm">✅ Complete</div>
                </div>
                <div className="bg-blue-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{totalDocs}</div>
                    <div className="text-gray-400 text-sm">📄 Documents Generated</div>
                </div>
                <div className="bg-purple-600/20 rounded-xl p-4 text-center backdrop-blur-sm border border-purple-500/30">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{docGenRate}%</div>
                    <div className="text-gray-400 text-sm">DOCX Success Rate</div>
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {Object.entries(statusBreakdown).map(([status, count]) => {
                        const statusLabels = {
                            [AnalysisStatus.PENDING]: '⏳ Pending',
                            [AnalysisStatus.ANALYZING]: '🔬 Analyzing',
                            [AnalysisStatus.GENERATING_DOCUMENTS]: '📝 Generating',
                            [AnalysisStatus.COMPLETE]: '✅ Complete',
                            [AnalysisStatus.FAILED]: '❌ Failed',
                        };
                        return (
                            <div key={status} className="bg-gray-700/30 rounded-lg p-2 text-center">
                                <div className="text-gray-400 text-xs mb-1">{statusLabels[status as AnalysisStatus]}</div>
                                <div className="text-white font-bold">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
