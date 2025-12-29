'use client';

import { useState, useEffect } from 'react';
import { JobAnalysis } from '@/lib/types';
import StatisticsPanel from '@/components/StatisticsPanel';
import JobCard from '@/components/JobCard';
import ProgressTracker from '@/components/ProgressTracker';
import ScrapingHistory from '@/components/ScrapingHistory';

export default function Home() {
    const [analyses, setAnalyses] = useState<JobAnalysis[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusInfo, setStatusInfo] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'jobs' | 'history'>('jobs');

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

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="mb-8 md:mb-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="text-5xl md:text-6xl">🤖</div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
                        Phyllis AI
                    </h1>
                </div>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Your AI-Powered Job Analysis & Document Generation Assistant
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Scraping 20 job sites daily • Find CS jobs, analyze requirements, and generate tailored documents
                </p>
            </header>

            {/* Control Panel */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl text-center">
                    <div className="flex gap-4 justify-center flex-wrap">
                        <button
                            onClick={handleStartAnalysis}
                            disabled={loading || isAnalyzing}
                            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-bold text-base md:text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <span className="animate-spin">⚙️</span>
                                    Starting Analysis...
                                </span>
                            ) : isAnalyzing ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <span className="animate-pulse">🔄</span>
                                    Analyzing Jobs...
                                </span>
                            ) : (
                                '🔍 Analyze Tech Jobs (20 Sites)'
                            )}
                        </button>

                        {analyses.length > 0 && (
                            <button
                                onClick={handleClearAnalyses}
                                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-full font-bold text-base transition-all"
                            >
                                🗑️ Clear All
                            </button>
                        )}
                    </div>

                    {error && (
                        <p className="text-red-400 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                            {error}
                        </p>
                    )}

                    {isAnalyzing && statusInfo && (
                        <div className="mt-4 text-sm">
                            <p className="text-green-400 flex items-center justify-center gap-2 mb-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Actively analyzing jobs and generating documents...
                            </p>
                            <div className="flex gap-4 justify-center text-gray-400">
                                <span>⏳ Pending: {statusInfo.pending}</span>
                                <span>🔬 Analyzing: {statusInfo.analyzing}</span>
                                <span>📝 Generating: {statusInfo.generatingDocs}</span>
                                <span>✅ Complete: {statusInfo.complete}</span>
                                {statusInfo.failed > 0 && <span className="text-red-400">❌ Failed: {statusInfo.failed}</span>}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Tracker - Shows during active scraping */}
            <div className="max-w-7xl mx-auto">
                <ProgressTracker />
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === 'jobs'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        💼 Job Analyses ({analyses.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-semibold transition-all ${activeTab === 'history'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-gray-300'
                            }`}
                    >
                        📚 Scraping History
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'jobs' ? (
                    analyses.length === 0 ? (
                        <div className="text-center text-gray-500 mt-12 bg-gray-800/50 rounded-2xl p-12 border border-gray-700">
                            <div className="text-6xl mb-4">📭</div>
                            <p className="text-xl mb-2">No job analyses yet</p>
                            <p className="text-sm text-gray-600">Click "Analyze CS Jobs" to find computer science positions from 20 job sites and generate documents</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Statistics Panel */}
                            <StatisticsPanel analyses={analyses} />

                            {/* Job Cards Grid */}
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                    💼 Job Analyses ({analyses.length})
                                </h2>
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {analyses.map((analysis) => (
                                        <JobCard key={analysis.job.id} analysis={analysis} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <ScrapingHistory />
                )}
            </div>

            {/* Footer */}
            <footer className="text-center mt-16 text-gray-600 text-sm">
                <p>Powered by Gemini AI • Updates every 2 seconds • Scraping 20 sites daily</p>
            </footer>

            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 3s ease infinite;
                }
            `}</style>
        </main>
    );
}
