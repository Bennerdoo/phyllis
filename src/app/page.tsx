'use client';

import { useState, useEffect } from 'react';
import { JobAnalysis } from '@/lib/types';
import StatisticsPanel from '@/components/StatisticsPanel';
import JobCard from '@/components/JobCard';
import ProgressTracker from '@/components/ProgressTracker';
import ScrapingHistory from '@/components/ScrapingHistory';

type Tab = 'jobs' | 'history';

export default function Home() {
    const [analyses, setAnalyses] = useState<JobAnalysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusInfo, setStatusInfo] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<Tab>('jobs');

    // Poll for analysis updates every 2 seconds
    useEffect(() => {
        const fetchAnalyses = async () => {
            try {
                const res = await fetch('/api/analyze');
                const data = await res.json();
                setAnalyses(data.analyses || []);
                setStatusInfo(data.status);

                // Stop polling if all analyses are complete or failed
                if (data.status && data.status.analyzing === 0 && data.status.generatingDocs === 0 && data.status.pending === 0) {
                    if (data.status.total > 0) {
                        setIsAnalyzing(false);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch analyses:', err);
            }
        };

        // Initial fetch
        fetchAnalyses();

        // Set up polling
        const interval = setInterval(fetchAnalyses, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleStartAnalysis = async () => {
        setLoading(true);
        setError('');
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: 'computer science, software engineer, developer, fullstack, devops, AI training, Annotation, Data science, Machine Learning' }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Failed to start analysis');
                setIsAnalyzing(false);
            }
        } catch (err) {
            setError('An error occurred');
            setIsAnalyzing(false);
        } finally {
            setLoading(false);
        }
    };

    const handleClearAnalyses = async () => {
        try {
            await fetch('/api/analyze', { method: 'DELETE' });
            setAnalyses([]);
            setStatusInfo(null);
            setIsAnalyzing(false);
        } catch (err) {
            console.error('Failed to clear analyses:', err);
        }
    };

    const navItems: { label: string; tab: Tab }[] = [
        { label: 'Job analyses', tab: 'jobs' },
        { label: 'Scraping history', tab: 'history' },
    ];

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 h-screen w-[220px] bg-[#111111] border-r border-[#262626] flex flex-col z-10">
                <div className="px-5 pt-5 pb-4">
                    <h1 className="text-[18px] font-semibold text-white tracking-[-0.01em]">
                        Phyllis
                    </h1>
                    <p className="text-xs text-[#737373] mt-0.5">Job analysis</p>
                </div>

                <nav className="flex-1 px-3">
                    {navItems.map((item) => (
                        <button
                            key={item.tab}
                            onClick={() => setActiveTab(item.tab)}
                            className={`w-full text-left px-3 py-[7px] text-sm rounded transition-colors ${
                                activeTab === item.tab
                                    ? 'text-white bg-[#1f1f1f]'
                                    : 'text-[#737373] hover:text-[#a3a3a3]'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Sidebar footer */}
                <div className="px-5 py-4 border-t border-[#262626]">
                    <p className="text-xs text-[#525252]">20 sites configured</p>
                </div>
            </aside>

            {/* Main content */}
            <main className="ml-[220px] flex-1 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-10 bg-[#0f0f0f]/95 border-b border-[#262626] px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-sm font-semibold text-[#e5e5e5]">
                            {activeTab === 'jobs' ? 'Job analyses' : 'Scraping history'}
                        </h2>
                        {analyses.length > 0 && activeTab === 'jobs' && (
                            <span className="text-xs text-[#525252]">
                                {analyses.length} results
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {analyses.length > 0 && (
                            <button
                                onClick={handleClearAnalyses}
                                className="px-3 py-[6px] text-sm text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleStartAnalysis}
                            disabled={loading || isAnalyzing}
                            className="px-4 py-[6px] bg-white text-black text-sm font-semibold rounded hover:bg-[#e5e5e5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading
                                ? 'Starting...'
                                : isAnalyzing
                                    ? 'Analyzing...'
                                    : 'Run analysis'}
                        </button>
                    </div>
                </header>

                {/* Status bar (only during active analysis) */}
                {isAnalyzing && statusInfo && (
                    <div className="border-b border-[#262626] px-8 py-3 flex items-center gap-6 text-sm">
                        <span className="flex items-center gap-2 text-[#e5e5e5]">
                            <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#16a34a] animate-pulse" />
                            Running
                        </span>
                        <span className="text-[#737373]">Pending {statusInfo.pending}</span>
                        <span className="text-[#737373]">Analyzing {statusInfo.analyzing}</span>
                        <span className="text-[#737373]">Generating {statusInfo.generatingDocs}</span>
                        <span className="text-[#737373]">Complete {statusInfo.complete}</span>
                        {statusInfo.failed > 0 && (
                            <span className="text-[#dc2626]">Failed {statusInfo.failed}</span>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mx-8 mt-4 px-4 py-3 border border-[#dc2626]/30 rounded text-sm text-[#dc2626]">
                        {error}
                    </div>
                )}

                {/* Content area */}
                <div className="px-8 py-6">
                    {/* Progress tracker during active scraping */}
                    <ProgressTracker />

                    {activeTab === 'jobs' ? (
                        analyses.length === 0 ? (
                            <div className="mt-16 text-center">
                                <p className="text-[#737373] text-sm">No analyses yet</p>
                                <p className="text-[#525252] text-xs mt-1">
                                    Run an analysis to scrape job listings from 20 sites
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <StatisticsPanel analyses={analyses} />

                                <div className="space-y-0">
                                    {analyses.map((analysis) => (
                                        <JobCard key={analysis.job.id} analysis={analysis} />
                                    ))}
                                </div>
                            </div>
                        )
                    ) : (
                        <ScrapingHistory />
                    )}
                </div>
            </main>
        </div>
    );
}
