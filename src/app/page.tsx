'use client';

import { useState } from 'react';
import { Job } from '@/lib/types';

export default function Home() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/jobs/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword: 'developer' }), // Default for now
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.jobs);
            } else {
                setError(data.error || 'Failed to fetch jobs');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateResume = async (job: Job) => {
        // Optimistic UI or toast here
        alert(`Generating tailored resume for ${job.title}... This might take a few seconds.`);

        try {
            const res = await fetch('/api/resumes/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job }),
            });

            if (!res.ok) throw new Error('Failed to generate PDF');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Resume-${job.company}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('Error generating resume.');
        }
    };

    const handleApply = async (job: Job) => {
        const confirm = window.confirm(`Send application email for ${job.title} to YOUR email (for review)?`);
        if (!confirm) return;

        alert(`Applying to ${job.company}... generating AI cover letter and resume...`);
        try {
            const res = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ job }),
            });
            const data = await res.json();
            if (data.success) {
                alert('Application Sent! Check your email.');
            } else {
                alert('Failed to send application.');
            }
        } catch (e) {
            console.error(e);
            alert('Error sending application.');
        }
    };

    return (
        <main className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <header className="mb-12 text-center">
                <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                    Phyllis
                </h1>
                <p className="text-gray-400 text-lg">Your AI-Powered Job Application Assistant</p>
            </header>

            <div className="max-w-4xl mx-auto mb-8 text-center">
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-full font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                >
                    {loading ? 'Scouring the Web...' : 'Find Jobs'}
                </button>
                {error && <p className="text-red-400 mt-4">{error}</p>}
            </div>

            <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                    <div key={job.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500 transition-colors shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1 line-clamp-2" title={job.title}>{job.title}</h2>
                                <p className="text-blue-400 font-medium">{job.company}</p>
                            </div>
                            <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{job.source}</span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 flex items-center gap-2">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            {job.location}
                        </p>

                        <div className="flex gap-2 mt-auto">
                            <a
                                href={job.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                            >
                                View
                            </a>
                            <button
                                onClick={() => handleGenerateResume(job)}
                                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-bold transition-colors"
                            >
                                Download Resume
                            </button>
                            <button
                                onClick={() => handleApply(job)}
                                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-bold transition-colors ml-2"
                            >
                                Auto-Apply
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && jobs.length === 0 && (
                <div className="text-center text-gray-500 mt-12">
                    <p>No jobs found yet. Click the button to start searching.</p>
                </div>
            )}
        </main>
    );
}
