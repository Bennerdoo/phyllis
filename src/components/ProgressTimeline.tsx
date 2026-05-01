'use client';

import { AnalysisStatus } from '@/lib/types';

interface ProgressTimelineProps {
    currentStatus: AnalysisStatus;
    stageTimestamps?: Partial<Record<AnalysisStatus, string>>;
}

const STAGES = [
    { status: AnalysisStatus.PENDING, label: 'Pending' },
    { status: AnalysisStatus.ANALYZING, label: 'Analyzing' },
    { status: AnalysisStatus.GENERATING_DOCUMENTS, label: 'Documents' },
    { status: AnalysisStatus.COMPLETE, label: 'Complete' },
];

export default function ProgressTimeline({ currentStatus, stageTimestamps = {} }: ProgressTimelineProps) {
    const currentStageIndex = STAGES.findIndex(s => s.status === currentStatus);
    const isFailed = currentStatus === AnalysisStatus.FAILED;

    const formatTime = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (isFailed) {
        return (
            <div className="flex items-center gap-2 text-xs text-[#dc2626]">
                <span className="inline-block w-[6px] h-[6px] rounded-full bg-[#dc2626]" />
                Failed — analysis encountered an error
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3 text-xs">
            {STAGES.map((stage, index) => {
                const isCompleted = index < currentStageIndex;
                const isCurrent = index === currentStageIndex;
                const timestamp = stageTimestamps?.[stage.status];

                return (
                    <div key={stage.status} className="flex items-center gap-1.5">
                        <span
                            className={`inline-block w-[6px] h-[6px] rounded-full ${
                                isCompleted
                                    ? 'bg-[#16a34a]'
                                    : isCurrent
                                        ? 'bg-[#ca8a04]'
                                        : 'bg-[#333]'
                            }`}
                        />
                        <span className={isCurrent ? 'text-[#e5e5e5]' : 'text-[#525252]'}>
                            {stage.label}
                        </span>
                        {timestamp && (
                            <span className="text-[#525252]">{formatTime(timestamp)}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
