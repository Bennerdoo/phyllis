'use client';

import { JobAnalysis, AnalysisStatus, DocumentType } from '@/lib/types';

interface JobCardProps {
    analysis: JobAnalysis;
}

const STATUS_LABELS: Record<AnalysisStatus, string> = {
    [AnalysisStatus.PENDING]: 'Pending',
    [AnalysisStatus.ANALYZING]: 'Analyzing',
    [AnalysisStatus.GENERATING_DOCUMENTS]: 'Generating',
    [AnalysisStatus.COMPLETE]: 'Complete',
    [AnalysisStatus.FAILED]: 'Failed',
};

const STATUS_DOT_COLORS: Record<AnalysisStatus, string> = {
    [AnalysisStatus.PENDING]: 'bg-[#ca8a04]',
    [AnalysisStatus.ANALYZING]: 'bg-[#ca8a04]',
    [AnalysisStatus.GENERATING_DOCUMENTS]: 'bg-[#ca8a04]',
    [AnalysisStatus.COMPLETE]: 'bg-[#16a34a]',
    [AnalysisStatus.FAILED]: 'bg-[#dc2626]',
};

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
    [DocumentType.RESUME]: 'Resume',
    [DocumentType.CV]: 'CV',
    [DocumentType.COVER_LETTER]: 'Cover letter',
};

export default function JobCard({ analysis }: JobCardProps) {
    const { job, status, error, documents } = analysis;

    const getTimeElapsed = () => {
        const created = new Date(analysis.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        return `${diffHours}h ago`;
    };

    const downloadDocument = (jobId: string, type: DocumentType) => {
        window.open(`/api/documents/download?jobId=${jobId}&type=${type}`, '_blank');
    };

    return (
        <div className="border-b border-[#262626] px-0 py-4 first:pt-0 last:border-b-0">
            {/* Row: title + meta */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-white hover:underline truncate"
                            title={job.title}
                        >
                            {job.title}
                        </a>
                        <span className="flex items-center gap-1.5 text-xs text-[#737373] shrink-0">
                            <span className={`inline-block w-[6px] h-[6px] rounded-full ${STATUS_DOT_COLORS[status]}`} />
                            {STATUS_LABELS[status]}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#737373]">
                        <span>{job.company}</span>
                        <span className="text-[#333]">/</span>
                        <span>{job.location}</span>
                        <span className="text-[#333]">/</span>
                        <span>{job.source}</span>
                        <span className="text-[#333]">·</span>
                        <span>{getTimeElapsed()}</span>
                    </div>
                </div>
            </div>

            {/* Skills tags */}
            {job.requirements && job.requirements.technicalSkills && job.requirements.technicalSkills.length > 0 && status !== AnalysisStatus.PENDING && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {job.requirements.technicalSkills.slice(0, 6).map((skill, i) => (
                        <span
                            key={i}
                            className="bg-[#1f1f1f] text-[#a3a3a3] text-xs px-2 py-0.5 rounded"
                        >
                            {skill}
                        </span>
                    ))}
                    {job.requirements.experienceLevel && job.requirements.experienceLevel !== 'Not Specified' && (
                        <span className="bg-[#1f1f1f] text-[#a3a3a3] text-xs px-2 py-0.5 rounded">
                            {job.requirements.experienceLevel}
                        </span>
                    )}
                </div>
            )}

            {/* Requirements summary */}
            {job.requirements && status !== AnalysisStatus.PENDING && job.documentsNeeded && job.documentsNeeded.length > 0 && (
                <div className="mt-2 text-xs text-[#525252]">
                    Documents: {job.documentsNeeded.join(', ')}
                </div>
            )}

            {/* Generated documents */}
            {documents && documents.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                    {documents.map((doc) => (
                        <button
                            key={doc.type}
                            onClick={() => downloadDocument(job.id, doc.type)}
                            className="px-3 py-[5px] text-xs text-[#e5e5e5] border border-[#333] rounded hover:border-[#555] transition-colors"
                            title={doc.docxBuffer ? 'Download DOCX' : 'Download as text'}
                        >
                            {DOC_TYPE_LABELS[doc.type]}
                            {doc.docxBuffer ? ' .docx' : ' .txt'}
                        </button>
                    ))}
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="mt-2 text-xs text-[#dc2626]">
                    Error: {error}
                </p>
            )}
        </div>
    );
}
