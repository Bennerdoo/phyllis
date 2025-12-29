'use client';

import { useState, useEffect } from 'react';
import { JobApplication } from '@/lib/types';
import StatisticsPanel from '@/components/StatisticsPanel';
import JobCard from '@/components/JobCard';
import SchedulerStatusPanel from '@/components/SchedulerStatusPanel';

export default function Home() {
    const [applications, setApplications] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    // Poll for application updates every 2 seconds
    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const res = await fetch('/api/applications');
                const data = await res.json();
                if (data.success) {
                    setApplications(data.applications);
                }
            } catch (err) {
                console.error('Failed to fetch applications:', err);
            }
        };

        // Initial fetch
        fetchApplications();

        // Set up polling
        const interval = setInterval(fetchApplications, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleStartAutoApply = async () => {
        setLoading(true);
        setError('');
        setIsPolling(true);
        try {
            const res = await fetch('/api/auto-apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: 'developer' }),
            });
            const data = await res.json();
            if (!data.success) {
                setError(data.error || 'Failed to start auto-apply');
                setIsPolling(false);
            }
        } catch (err) {
            setError('An error occurred');
            setIsPolling(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8 font-sans">
            {/* Header */}
            <header className="mb-8 md:mb-12 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="text-5xl md:text-6xl">🤖</div>
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
                        Phyllis
                    </h1>
                </div>
                <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                    Your AI-Powered Automatic Job Application Assistant
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Find jobs, generate tailored resumes, and apply automatically
                </p>
            </header>

            {/* Control Panel */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 border border-gray-700 shadow-2xl text-center">
                    <button
                        onClick={handleStartAutoApply}
                        disabled={loading || isPolling}
                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-bold text-base md:text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <span className="animate-spin">⚙️</span>
                                Starting Auto-Apply...
                            </span>
                        ) : isPolling ? (
                            <span className="flex items-center gap-2 justify-center">
                                <span className="animate-pulse">🔄</span>
                                Auto-Apply Running...
                            </span>
                        ) : (
                            '🚀 Start Auto-Apply'
                        )}
                    </button>
                    {error && (
                        <p className="text-red-400 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                            {error}
                        </p>
                    )}
                    {isPolling && (
                        <p className="text-green-400 mt-4 text-sm flex items-center justify-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Actively searching and applying to jobs...
                        </p>
                    )}
                </div>
            </div>

            {/* Scheduler Status */}
            <div className="max-w-7xl mx-auto mb-8">
                <SchedulerStatusPanel />
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto">
                {applications.length === 0 ? (
                    <div className="text-center text-gray-500 mt-12 bg-gray-800/50 rounded-2xl p-12 border border-gray-700">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-xl mb-2">No applications yet</p>
                        <p className="text-sm text-gray-600">Click "Start Auto-Apply" to begin finding and applying to jobs</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Statistics Panel */}
                        <StatisticsPanel applications={applications} />

                        {/* Job Cards Grid */}
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                                📋 Applications ({applications.length})
                            </h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {applications.map((app) => (
                                    <JobCard key={app.job.id} application={app} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="text-center mt-16 text-gray-600 text-sm">
                <p>Powered by AI • Updates every 2 seconds</p>
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
