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
            <div className="text-sm text-[#525252] py-8">
                Loading...
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="mt-16 text-center">
                <p className="text-[#737373] text-sm">No scraping history</p>
                <p className="text-[#525252] text-xs mt-1">Run an analysis to see history here</p>
            </div>
        );
    }

    return (
        <div className="border border-[#262626] rounded bg-[#171717] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_100px_60px] gap-0 px-4 py-2.5 border-b border-[#262626] text-xs text-[#525252]">
                <span>Time</span>
                <span>Jobs</span>
                <span>Sites</span>
                <span>Duration</span>
                <span>Success</span>
                <span>Type</span>
            </div>

            {/* Rows */}
            {history.map((entry) => {
                const successRate = Math.round((entry.successfulSites / entry.totalSites) * 100);
                const isExpanded = expandedId === entry.id;

                return (
                    <div key={entry.id} className="border-b border-[#1f1f1f] last:border-b-0">
                        <div
                            className="grid grid-cols-[1fr_80px_80px_80px_100px_60px] gap-0 px-4 py-3 text-sm cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        >
                            <span className="text-[#e5e5e5]">{formatDate(entry.startedAt)}</span>
                            <span className="text-[#e5e5e5]">{entry.totalJobsFound}</span>
                            <span className="text-[#737373]">
                                {entry.successfulSites}/{entry.totalSites}
                            </span>
                            <span className="text-[#737373]">
                                {formatDuration(entry.durationSeconds)}
                            </span>
                            <span className="text-[#737373]">{successRate}%</span>
                            <span className="text-[#525252]">
                                {entry.triggerType === 'scheduled' ? 'auto' : 'manual'}
                            </span>
                        </div>

                        {/* Expanded site details */}
                        {isExpanded && entry.siteDetails && entry.siteDetails.length > 0 && (
                            <div className="border-t border-[#1f1f1f] bg-[#141414]">
                                {entry.siteDetails.map((site: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] last:border-b-0 text-xs"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`inline-block w-[6px] h-[6px] rounded-full ${
                                                    site.status === 'success' ? 'bg-[#16a34a]' : 'bg-[#dc2626]'
                                                }`}
                                            />
                                            <span className="text-[#a3a3a3]">{site.siteName}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[#525252]">
                                            <span>{site.jobsFound || 0} jobs</span>
                                            {site.duration && (
                                                <span>{site.duration.toFixed(1)}s</span>
                                            )}
                                            {site.error && (
                                                <span className="text-[#dc2626] max-w-[200px] truncate" title={site.error}>
                                                    {site.error}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
