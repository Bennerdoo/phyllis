import { Job, AnalysisStatus, DocumentType } from '../types';
import { JobService } from './jobService';
import { DocumentService } from './documentService';
import { analysisStorage } from '../storage';
import { dummyProfile } from '../dummyProfile';

/**
 * Analysis Service - Handles job analysis and document generation
 * Replaces the old ApplicationService which sent applications
 */
export class AnalysisService {
    /**
     * Start the job analysis process
     * Searches for CS jobs and analyzes their requirements
     */
    static async startJobAnalysis(keyword?: string): Promise<void> {
        try {
            console.log('\n🚀 [AnalysisService] Starting job analysis process...');

            // Step 1: Search for computer science jobs
            const searchKeyword = keyword || 'computer science software engineer developer';
            console.log(`🔍 [AnalysisService] Searching for jobs with keyword: "${searchKeyword}"`);
            const jobs = await JobService.searchJobs(searchKeyword);

            console.log(`✅ [AnalysisService] Found ${jobs.length} computer science jobs`);

            // Step 2: Add all jobs to storage with PENDING status
            for (const job of jobs) {
                analysisStorage.add(job);
                console.log(`📋 [AnalysisService] Added job to analysis queue: ${job.title} at ${job.company}`);
            }

            // Step 3: Analyze each job and generate documents
            for (let i = 0; i < jobs.length; i++) {
                const job = jobs[i];
                console.log(`\n📊 [AnalysisService] Processing job ${i + 1}/${jobs.length}: ${job.title}`);
                await this.analyzeAndGenerateDocuments(job);
            }

            console.log('\n✨ [AnalysisService] Job analysis process complete!');
        } catch (error) {
            console.error('❌ [AnalysisService] Analysis error:', error);
            throw error;
        }
    }

    /**
     * Analyze a single job and generate required documents
     */
    private static async analyzeAndGenerateDocuments(job: Job): Promise<void> {
        try {
            // Update status: Analyzing
            analysisStorage.update(job.id, {
                status: AnalysisStatus.ANALYZING,
            });
            console.log(`   🔬 Analyzing job requirements...`);

            // If requirements weren't extracted during scraping, analyze now
            if (!job.requirements || job.requirements.technicalSkills.length === 0) {
                console.log(`   🤖 Using AI to extract detailed requirements...`);
                job.requirements = await DocumentService.analyzeJobRequirements(job);
            }

            // If documents needed weren't detected during scraping, detect now
            if (!job.documentsNeeded || job.documentsNeeded.length === 0) {
                console.log(`   📄 Detecting required documents...`);
                job.documentsNeeded = await DocumentService.detectRequiredDocuments(job);
            }

            console.log(`   ✅ Requirements analyzed:`);
            console.log(`      - Experience Level: ${job.requirements?.experienceLevel}`);
            console.log(`      - Technical Skills: ${job.requirements?.technicalSkills.slice(0, 5).join(', ')}`);
            console.log(`      - Documents Needed: ${job.documentsNeeded?.join(', ')}`);

            // Update status: Generating documents
            analysisStorage.update(job.id, {
                status: AnalysisStatus.GENERATING_DOCUMENTS,
                job, // Update with enhanced job info
            });

            console.log(`   📝 Generating documents...`);

            // Generate each required document
            const documentsNeeded = job.documentsNeeded || [DocumentType.RESUME];
            for (const docType of documentsNeeded) {
                try {
                    console.log(`      - Generating ${docType}...`);
                    let document;

                    switch (docType) {
                        case DocumentType.RESUME:
                            document = await DocumentService.generateResumeDOCX(dummyProfile, job);
                            break;
                        case DocumentType.CV:
                            document = await DocumentService.generateCVDOCX(dummyProfile, job);
                            break;
                        case DocumentType.COVER_LETTER:
                            document = await DocumentService.generateCoverLetterDOCX(dummyProfile, job);
                            break;
                        default:
                            continue;
                    }

                    // Add document to analysis
                    analysisStorage.addDocument(job.id, document);

                    if (document.docxBuffer) {
                        console.log(`      ✅ ${docType} generated successfully (DOCX)`);
                    } else if (document.fallbackText) {
                        console.log(`      ⚠️  ${docType} generated as fallback text`);
                    }
                } catch (docError) {
                    console.error(`      ❌ Failed to generate ${docType}:`, docError);
                }
            }

            // Update status: Complete
            analysisStorage.update(job.id, {
                status: AnalysisStatus.COMPLETE,
            });

            console.log(`   🎉 Analysis complete for: ${job.title}`);

        } catch (error) {
            console.error(`   ❌ Failed to analyze job ${job.title}:`, error);
            analysisStorage.update(job.id, {
                status: AnalysisStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    /**
     * Get analysis status for display
     */
    static getAnalysisStatus() {
        const analyses = analysisStorage.getAll();
        return {
            total: analyses.length,
            pending: analyses.filter(a => a.status === AnalysisStatus.PENDING).length,
            analyzing: analyses.filter(a => a.status === AnalysisStatus.ANALYZING).length,
            generatingDocs: analyses.filter(a => a.status === AnalysisStatus.GENERATING_DOCUMENTS).length,
            complete: analyses.filter(a => a.status === AnalysisStatus.COMPLETE).length,
            failed: analyses.filter(a => a.status === AnalysisStatus.FAILED).length,
        };
    }

    /**
     * Get all analyses
     */
    static getAllAnalyses() {
        return analysisStorage.getAll();
    }

    /**
     * Get a specific analysis
     */
    static getAnalysis(jobId: string) {
        return analysisStorage.get(jobId);
    }

    /**
     * Clear all analyses
     */
    static clearAnalyses() {
        analysisStorage.clear();
    }
}
