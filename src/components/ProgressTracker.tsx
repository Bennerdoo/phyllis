'use client';

import { useState, useEffect } from 'react';
import { ScrapingProgress } from '@/lib/progressTracker';

export default function ProgressTracker() {
    const [progress, setProgress] = useState<ScrapingProgress | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await fetch('/api/progress');
                const data = await res.json();
                if (data.success) {
                    setProgress(data.progress);
                }
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            }
        };

        // Poll every 2 seconds during active scraping
        const interval = setInterval(fetchProgress, 2000);
        fetchProgress();

        return () => clearInterval(interval);
    }, []);

    if (!progress || !progress.isActive) {
        return null;
    }

    const { sitesCompleted, totalSites, totalJobsFound, currentSite, estimatedTimeRemaining, siteDetails } = progress;
    const successSites = siteDetails.filter(s => s.status === 'success').length;
    const failedSites = siteDetails.filter(s => s.status === 'failed').length;

    return (
        <div className="mb-6 border border-[#262626] rounded bg-[#171717]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                    <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#16a34a] animate-pulse" />
                    <span className="text-sm font-semibold text-[#e5e5e5]">
                        Scraping in progress
                    </span>
                    <span className="text-xs text-[#525252]">
                        {sitesCompleted}/{totalSites} sites
                    </span>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-[#737373] hover:text-[#a3a3a3] transition-colors"
                >
                    {showDetails ? 'Hide' : 'Details'}
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-0 border-b border-[#262626]">
                <div className="px-4 py-3 border-r border-[#262626]">
                    <p className="text-xs text-[#525252] mb-0.5">Jobs found</p>
                    <p className="text-sm font-semibold text-[#e5e5e5]">{totalJobsFound}</p>
                </div>
                <div className="px-4 py-3">
                    <p className="text-xs text-[#525252] mb-0.5">
                        {estimatedTimeRemaining !== null ? 'Est. remaining' : 'Status'}
                    </p>
                    <p className="text-sm font-semibold text-[#e5e5e5]">
                        {estimatedTimeRemaining !== null
                            ? `${Math.floor(estimatedTimeRemaining / 60)}:${String(estimatedTimeRemaining % 60).padStart(2, '0')}`
                            : `${successSites} ok / ${failedSites} failed`}
                    </p>
                </div>
            </div>

            {/* Current site */}
            {currentSite && (
                <div className="px-4 py-2.5 border-b border-[#262626] text-xs">
                    <span className="text-[#525252]">Scraping </span>
                    <span className="text-[#e5e5e5]">{currentSite}</span>
                </div>
            )}

            {/* Detailed site list */}
            {showDetails && (
                <div className="max-h-72 overflow-y-auto">
                    {siteDetails.map((site, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between px-4 py-2 border-b border-[#1f1f1f] last:border-b-0 text-xs"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-block w-[6px] h-[6px] rounded-full ${
                                        site.status === 'success'
                                            ? 'bg-[#16a34a]'
                                            : site.status === 'failed'
                                                ? 'bg-[#dc2626]'
                                                : site.status === 'scraping'
                                                    ? 'bg-[#ca8a04]'
                                                    : 'bg-[#333]'
                                    }`}
                                />
                                <span className="text-[#a3a3a3]">{site.siteName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#525252]">
                                {site.status !== 'pending' && (
                                    <span>{site.jobsFound} jobs</span>
                                )}
                                {site.duration && (
                                    <span>{(site.duration / 1000).toFixed(1)}s</span>
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
}
