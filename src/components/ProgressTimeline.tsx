'use client';

import { ApplicationStatus } from '@/lib/types';

interface ProgressTimelineProps {
    currentStatus: ApplicationStatus;
    stageTimestamps?: Partial<Record<ApplicationStatus, string>>;
}

const STAGES = [
    { status: ApplicationStatus.PENDING, label: 'Found', icon: '🔍' },
    { status: ApplicationStatus.GENERATING_RESUME, label: 'Resume', icon: '📝' },
    { status: ApplicationStatus.RESUME_READY, label: 'Ready', icon: '✅' },
    { status: ApplicationStatus.APPLYING, label: 'Applying', icon: '📧' },
    { status: ApplicationStatus.APPLIED, label: 'Applied', icon: '✅' },
];

export default function ProgressTimeline({ currentStatus, stageTimestamps = {} }: ProgressTimelineProps) {
    const currentStageIndex = STAGES.findIndex(s => s.status === currentStatus);
    const isFailed = currentStatus === ApplicationStatus.FAILED;

    // Format timestamp to show time only
    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (isFailed) {
        return (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                    <div className="text-red-400 font-bold">Failed</div>
                    <div className="text-red-300 text-xs">Application process encountered an error</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {STAGES.map((stage, index) => {
                    const isCompleted = index < currentStageIndex;
                    const isCurrent = index === currentStageIndex;
                    const timestamp = stageTimestamps[stage.status];

                    return (
                        <div key={stage.status} className="flex items-center flex-shrink-0">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                                        transition-all duration-300
                                        ${isCompleted ? 'bg-green-500 text-white scale-100' : ''}
                                        ${isCurrent ? 'bg-blue-500 text-white animate-pulse scale-110' : ''}
                                        ${!isCompleted && !isCurrent ? 'bg-gray-700 text-gray-400 scale-90' : ''}
                                    `}
                                >
                                    {stage.icon}
                                </div>
                                <div className={`text-xs mt-1 text-center ${isCurrent ? 'text-blue-400 font-bold' : 'text-gray-500'}`}>
                                    {stage.label}
                                </div>
                                {timestamp && (
                                    <div className="text-xs text-gray-600 mt-0.5">
                                        {formatTime(timestamp)}
                                    </div>
                                )}
                            </div>
                            {index < STAGES.length - 1 && (
                                <div
                                    className={`
                                        w-6 h-1 mx-1 rounded transition-all duration-300
                                        ${isCompleted ? 'bg-green-500' : 'bg-gray-700'}
                                    `}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
