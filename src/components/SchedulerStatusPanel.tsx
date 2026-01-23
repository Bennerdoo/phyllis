'use client';

import { useEffect, useState } from 'react';
import { SchedulerStatus } from '@/lib/types';

export default function SchedulerStatusPanel() {
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [triggering, setTriggering] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/scheduler/status');
                const data = await res.json();
                if (data.success) {
                    setStatus(data.status);
                }
            } catch (err) {
                console.error('Failed to fetch scheduler status:', err);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 10000); // Update every 10 seconds
        return () => clearInterval(interval);
    }, []);

    const handleManualTrigger = async () => {
        setTriggering(true);
        try {
            const res = await fetch('/api/scheduler/trigger', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                console.log('Scheduler triggered manually');
            }
        } catch (err) {
            console.error('Failed to trigger scheduler:', err);
        } finally {
            setTimeout(() => setTriggering(false), 2000);
        }
    };

    if (!status || !status.enabled) {
        return null; // Don't show if scheduler is disabled
    }

    const formatTime = (isoString?: string) => {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-2xl p-6 border border-indigo-500/30 shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
                    <span>🤖</span>
                    Automated Scheduler
                    {status.isRunning && (
                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    )}
                </h3>
                <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                    Active
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Schedule</div>
                    <div className="text-sm text-white font-mono">{status.schedule}</div>
                    <div className="text-xs text-gray-600 mt-1">Daily at 9:00 AM</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Last Run</div>
                    <div className="text-sm text-white">{formatTime(status.lastRun)}</div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">Next Run</div>
                    <div className="text-sm text-white">{formatTime(status.nextRun)}</div>
                </div>
            </div>

            <button
                onClick={handleManualTrigger}
                disabled={triggering || status.isRunning}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {triggering ? '⚙️ Triggering...' : status.isRunning ? '⏳ Running...' : '▶️ Run Now (Manual Trigger)'}
            </button>
        </div>
    );
}
