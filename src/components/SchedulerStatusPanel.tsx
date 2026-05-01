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
        const interval = setInterval(fetchStatus, 10000);
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
        return null;
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
        <div className="border border-[#262626] rounded bg-[#171717] mb-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#e5e5e5]">Scheduler</span>
                    {status.isRunning && (
                        <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#16a34a] animate-pulse" />
                    )}
                    <span className="bg-[#1f1f1f] text-[#a3a3a3] text-xs px-2 py-0.5 rounded">
                        Active
                    </span>
                </div>
                <button
                    onClick={handleManualTrigger}
                    disabled={triggering || status.isRunning}
                    className="px-3 py-[5px] text-xs text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {triggering ? 'Triggering...' : status.isRunning ? 'Running...' : 'Run now'}
                </button>
            </div>

            <div className="grid grid-cols-3 gap-0">
                <div className="px-4 py-3 border-r border-[#262626]">
                    <p className="text-xs text-[#525252] mb-0.5">Schedule</p>
                    <p className="text-sm text-[#e5e5e5] font-mono">{status.schedule}</p>
                </div>
                <div className="px-4 py-3 border-r border-[#262626]">
                    <p className="text-xs text-[#525252] mb-0.5">Last run</p>
                    <p className="text-sm text-[#e5e5e5]">{formatTime(status.lastRun)}</p>
                </div>
                <div className="px-4 py-3">
                    <p className="text-xs text-[#525252] mb-0.5">Next run</p>
                    <p className="text-sm text-[#e5e5e5]">{formatTime(status.nextRun)}</p>
                </div>
            </div>
        </div>
    );
}
