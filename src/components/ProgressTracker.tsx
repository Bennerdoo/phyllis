'use client';

import { useState, useEffect } from 'react';
import { ScrapingProgress, SiteProgress } from '@/lib/progressTracker';

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
        fetchProgress(); // Initial fetch

        return () => clearInterval(interval);
    }, []);

    if (!progress || !progress.isActive) {
        return null; // Don't show if not actively scraping
    }

    const { sitesCompleted, totalSites, totalJobsFound, currentSite, estimatedTimeRemaining, siteDetails } = progress;
    const progressPercent = Math.round((sitesCompleted / totalSites) * 100);
    const successSites = siteDetails.filter(s => s.status === 'success').length;
    const failedSites = siteDetails.filter(s => s.status === 'failed').length;

    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl p-6 border border-indigo-500/30 shadow-2xl mb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="animate-spin">⚙️</span>
                    Scraping in Progress
                </h3>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-indigo-300 hover:text-indigo-100 transition-colors"
                >
                    {showDetails ? '🔼 Hide Details' : '🔽 Show Details'}
                </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span>Progress: {sitesCompleted} / {totalSites} sites</span>
                    <span>{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 relative"
                        style={{ width: `${progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Current Site */}
            {currentSite && (
                <div className="bg-blue-900/30 rounded-lg p-4 mb-4 border border-blue-500/30">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl animate-bounce">🔍</span>
                        <div>
                            <p className="text-sm text-gray-400">Currently Scraping</p>
                            <p className="text-lg font-bold text-white">{currentSite}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-green-900/30 rounded-lg p-3 border border-green-500/30">
                    <p className="text-xs text-gray-400">Jobs Found</p>
                    <p className="text-2xl font-bold text-green-400">{totalJobsFound}</p>
                </div>
                <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-500/30">
                    <p className="text-xs text-gray-400">Successful</p>
                    <p className="text-2xl font-bold text-blue-400">{successSites}</p>
                </div>
                {failedSites > 0 && (
                    <div className="bg-red-900/30 rounded-lg p-3 border border-red-500/30">
                        <p className="text-xs text-gray-400">Failed</p>
                        <p className="text-2xl font-bold text-red-400">{failedSites}</p>
                    </div>
                )}
                {estimatedTimeRemaining !== null && (
                    <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/30">
                        <p className="text-xs text-gray-400">Est. Time Left</p>
                        <p className="text-2xl font-bold text-purple-400">
                            {Math.floor(estimatedTimeRemaining / 60)}:{String(estimatedTimeRemaining % 60).padStart(2, '0')}
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed Site List */}
            {showDetails && (
                <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <h4 className="text-sm font-bold text-gray-300 mb-3">Site-by-Site Status</h4>
                    <div className="space-y-2">
                        {siteDetails.map((site, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded ${site.status === 'success' ? 'bg-green-900/20' :
                                        site.status === 'failed' ? 'bg-red-900/20' :
                                            site.status === 'scraping' ? 'bg-blue-900/20 animate-pulse' :
                                                'bg-gray-800/20'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">
                                        {site.status === 'success' ? '✅' :
                                            site.status === 'failed' ? '❌' :
                                                site.status === 'scraping' ? '🔄' :
                                                    '⏳'}
                                    </span>
                                    <span className="text-sm text-gray-300">{site.siteName}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                    {site.status !== 'pending' && (
                                        <span className="text-gray-400">
                                            {site.jobsFound} jobs
                                        </span>
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
}
