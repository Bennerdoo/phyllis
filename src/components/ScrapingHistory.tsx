'use client';

import { useState, useEffect } from 'react';

interface ScrapingHistoryEntry {
    id: number;
    startedAt: string;
    completedAt: string;
    totalSites: number;
    successfulSites: number;
    failedSites: number;
    totalJobsFound: number;
    durationSeconds: number;
    siteDetails: any[];
    triggerType: 'manual' | 'scheduled';
}

export default function ScrapingHistory() {
    const [history, setHistory] = useState<ScrapingHistoryEntry[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history?limit=10');
            const data = await res.json();
            if (data.success) {
                setHistory(data.history);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    if (loading) {
        return (
            <div className="text-center text-gray-400 py-8">
                <span className="animate-spin text-3xl">⚙️</span>
                <p className="mt-2">Loading history...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8 bg-gray-800/50 rounded-lg">
                <p className="text-4xl mb-2">📝</p>
                <p>No scraping history yet</p>
                <p className="text-sm text-gray-600 mt-1">Run a job analysis to see history here</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
                📚 Scraping History
            </h3>

            {history.map((entry) => {
                const successRate = Math.round((entry.successfulSites / entry.totalSites) * 100);
                const isExpanded = expandedId === entry.id;

                return (
                    <div
                        key={entry.id}
                        className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all"
                    >
                        {/* Summary Row */}
                        <div
                            className="cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {entry.triggerType === 'scheduled' ? '⏰' : '👆'}
                                    </span>
                                    <div>
                                        <p className="text-white font-semibold">
                                            {formatDate(entry.startedAt)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {entry.triggerType === 'scheduled' ? 'Scheduled Run' : 'Manual Run'}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-gray-400 hover:text-white transition-colors">
                                    {isExpanded ? '▲' : '▼'}
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-blue-900/20 rounded-lg p-2 border border-blue-500/30">
                                    <p className="text-xs text-gray-400">Jobs Found</p>
                                    <p className="text-lg font-bold text-blue-400">{entry.totalJobsFound}</p>
                                </div>
                                <div className="bg-green-900/20 rounded-lg p-2 border border-green-500/30">
                                    <p className="text-xs text-gray-400">Success Rate</p>
                                    <p className="text-lg font-bold text-green-400">{successRate}%</p>
                                </div>
                                <div className="bg-purple-900/20 rounded-lg p-2 border border-purple-500/30">
                                    <p className="text-xs text-gray-400">Duration</p>
                                    <p className="text-lg font-bold text-purple-400">
                                        {formatDuration(entry.durationSeconds)}
                                    </p>
                                </div>
                                <div className="bg-gray-700/20 rounded-lg p-2 border border-gray-600/30">
                                    <p className="text-xs text-gray-400">Sites</p>
                                    <p className="text-lg font-bold text-gray-300">
                                        {entry.successfulSites}/{entry.totalSites}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && entry.siteDetails && entry.siteDetails.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Site Breakdown</h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {entry.siteDetails.map((site: any, index: number) => (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between p-2 rounded text-sm ${site.status === 'success' ? 'bg-green-900/10' : 'bg-red-900/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{site.status === 'success' ? '✅' : '❌'}</span>
                                                <span className="text-gray-300">{site.siteName}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span>{site.jobsFound || 0} jobs</span>
                                                {site.duration && (
                                                    <span>{site.duration.toFixed(1)}s</span>
                                                )}
                                                {site.error && (
                                                    <span className="text-red-400 max-w-xs truncate" title={site.error}>
                                                        {site.error}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
