'use client';

import { JobAnalysis, AnalysisStatus, DocumentType } from '@/lib/types';
import ProgressTimeline from './ProgressTimeline';

interface JobCardProps {
    analysis: JobAnalysis;
}

const STATUS_LABELS: Record<AnalysisStatus, string> = {
    [AnalysisStatus.PENDING]: '⏳ Pending',
    [AnalysisStatus.ANALYZING]: '🔬 Analyzing',
    [AnalysisStatus.GENERATING_DOCUMENTS]: '📝 Generating Documents',
    [AnalysisStatus.COMPLETE]: '✅ Complete',
    [AnalysisStatus.FAILED]: '❌ Failed',
};

const STATUS_COLORS: Record<AnalysisStatus, string> = {
    [AnalysisStatus.PENDING]: 'bg-gray-700 text-gray-300',
    [AnalysisStatus.ANALYZING]: 'bg-blue-600 text-white',
    [AnalysisStatus.GENERATING_DOCUMENTS]: 'bg-purple-600 text-white',
    [AnalysisStatus.COMPLETE]: 'bg-green-500 text-white',
    [AnalysisStatus.FAILED]: 'bg-red-600 text-white',
};

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
    [DocumentType.RESUME]: '📄 Resume',
    [DocumentType.CV]: '📑 CV',
    [DocumentType.COVER_LETTER]: '✉️ Cover Letter',
};

export default function JobCard({ analysis }: JobCardProps) {
    const { job, status, error, documents } = analysis;

    // Calculate time elapsed
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
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 mr-2">
                    <h3 className="text-lg font-bold text-white mb-1 line-clamp-2" title={job.title}>
                        {job.title}
                    </h3>
                    <p className="text-blue-400 font-medium text-sm">{job.company}</p>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap border bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {job.source}
                </span>
            </div>

            {/* Location & Time */}
            <div className="flex items-center justify-between mb-4 text-xs">
                <p className="text-gray-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    {job.location}
                </p>
                <p className="text-gray-500">{getTimeElapsed()}</p>
            </div>

            {/* Progress Timeline */}
            <div className="mb-4">
                <ProgressTimeline currentStatus={status} stageTimestamps={analysis.stageTimestamps} />
            </div>

            {/* Current Status Badge */}
            <div className="mb-4">
                <span
                    className={`inline-block px-3 py-2 rounded-lg text-xs font-bold ${STATUS_COLORS[status]} shadow-lg`}
                >
                    {STATUS_LABELS[status]}
                </span>
            </div>

            {/* Job Requirements */}
            {job.requirements && status !== AnalysisStatus.PENDING && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-blue-400 text-xs font-bold mb-2">📋 Requirements</p>
                    <div className="text-xs text-gray-300 space-y-1">
                        <p><span className="font-semibold">Experience:</span> {job.requirements.experienceLevel}</p>
                        {job.requirements.technicalSkills && job.requirements.technicalSkills.length > 0 && (
                            <p><span className="font-semibold">Skills:</span> {job.requirements.technicalSkills.slice(0, 3).join(', ')}</p>
                        )}
                        {job.documentsNeeded && job.documentsNeeded.length > 0 && (
                            <p><span className="font-semibold">Documents:</span> {job.documentsNeeded.join(', ')}</p>
                        )}
                    </div>
                </div>
            )}

            {/* AI Analysis */}
            {job.aiAnalysis && (
                <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                    <p className="text-purple-400 text-xs font-bold mb-1">🤖 AI Analysis</p>
                    <p className="text-gray-300 text-xs">{job.aiAnalysis}</p>
                </div>
            )}

            {/* Generated Documents */}
            {documents && documents.length > 0 && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-xs font-bold mb-2">📁 Generated Documents</p>
                    <div className="flex flex-wrap gap-2">
                        {documents.map((doc) => (
                            <button
                                key={doc.type}
                                onClick={() => downloadDocument(job.id, doc.type)}
                                className="px-3 py-1.5 bg-green-600/30 hover:bg-green-600/50 border border-green-500/50 rounded text-xs font-semibold transition-all"
                                title={doc.docxBuffer ? 'Download DOCX' : 'Download as text (DOCX generation failed)'}
                            >
                                {DOC_TYPE_LABELS[doc.type]} {doc.docxBuffer ? '📥' : '📝'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-xs">
                        <span className="font-bold">Error:</span> {error}
                    </p>
                </div>
            )}

            {/* Action Button */}
            <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                View Job Posting →
            </a>
        </div>
    );
}
