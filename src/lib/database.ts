// Database module - optional for serverless deployments
// Falls back to in-memory storage when SQLite is not available
import path from 'path';
import { UserProfile, Job, JobAnalysis, GeneratedDocument, DocumentType } from './types';

/**
 * SQLite Database for Phyllis
 * Stores user profiles, job history, scraping analytics, and generated documents
 * NOTE: Only works in local/server environments. Falls back to memory storage in serverless.
 */

// Try to import better-sqlite3, but don't fail if it's not available (Vercel/serverless)
let Database: any = null;
let isAvailable = false;

try {
    Database = require('better-sqlite3');
    isAvailable = true;
} catch (error) {
    console.warn('[Database] SQLite not available in this environment. Using in-memory storage fallback.');
    isAvailable = false;
}

// Database path - stores in project root
const DB_PATH = path.join(process.cwd(), 'phyllis.db');

// Initialize database connection
let db: any = null;

export function isDatabaseAvailable(): boolean {
    return isAvailable;
}

export function getDatabase(): any {
    if (!isAvailable) {
        console.warn('[Database] SQLite not available. Operations will be skipped.');
        return null;
    }

    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL'); // Better performance for concurrent reads/writes
        initializeSchema();
    }
    return db;
}

/**
 * Initialize database schema
 */
function initializeSchema() {
    if (!isAvailable) return;

    const db = getDatabase();
    if (!db) return;

    // Users table - store user profile information
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            summary TEXT,
            skills TEXT, -- JSON array
            experience TEXT, -- JSON array
            education TEXT, -- JSON array
            preferences TEXT, -- JSON object for user preferences
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Jobs table - store all discovered jobs
    db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT,
            url TEXT,
            description TEXT,
            posted_at TEXT,
            tags TEXT, -- JSON array
            source TEXT,
            requirements TEXT, -- JSON object
            documents_needed TEXT, -- JSON array
            ai_analysis TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Job analyses table - track analysis status for each job
    db.exec(`
        CREATE TABLE IF NOT EXISTS job_analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            error TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
    `);

    // Generated documents table - store metadata for generated documents
    db.exec(`
        CREATE TABLE IF NOT EXISTS generated_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            type TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            file_path TEXT, -- Path to saved DOCX file
            has_fallback INTEGER DEFAULT 0,
            error TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs(id)
        );
    `);

    // Scraping history table - track each scraping run
    db.exec(`
        CREATE TABLE IF NOT EXISTS scraping_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            started_at TEXT NOT NULL,
            completed_at TEXT,
            total_sites INTEGER DEFAULT 0,
            successful_sites INTEGER DEFAULT 0,
            failed_sites INTEGER DEFAULT 0,
            total_jobs_found INTEGER DEFAULT 0,
            duration_seconds INTEGER,
            site_details TEXT, -- JSON array with per-site stats
            trigger_type TEXT DEFAULT 'manual' -- 'manual' or 'scheduled'
        );
    `);

    // Create indexes for better query performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
        CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
        CREATE INDEX IF NOT EXISTS idx_job_analyses_job_id ON job_analyses(job_id);
        CREATE INDEX IF NOT EXISTS idx_job_analyses_status ON job_analyses(status);
        CREATE INDEX IF NOT EXISTS idx_generated_documents_job_id ON generated_documents(job_id);
        CREATE INDEX IF NOT EXISTS idx_scraping_history_started_at ON scraping_history(started_at);
    `);

    console.log('[Database] Schema initialized successfully');
}

/**
 * User Profile Queries
 */
export const UserDB = {
    // Get user profile (assumes single user for now)
    getProfile(): UserProfile | null {
        if (!isAvailable) return null;

        const db = getDatabase();
        if (!db) return null;

        const row = db.prepare('SELECT * FROM users ORDER BY id DESC LIMIT 1').get() as any;

        if (!row) return null;

        return {
            name: row.name,
            email: row.email,
            phone: row.phone || '',
            location: row.location || '',
            summary: row.summary || '',
            skills: row.skills ? JSON.parse(row.skills) : [],
            experience: row.experience ? JSON.parse(row.experience) : [],
            education: row.education ? JSON.parse(row.education) : [],
            links: [], // Not stored in DB yet
            projects: [], // Not stored in DB yet
        };
    },

    // Create or update user profile
    saveProfile(profile: UserProfile): void {
        if (!isAvailable) {
            console.warn('[Database] Cannot save profile - database not available');
            return;
        }

        const db = getDatabase();
        if (!db) return;

        const existing = this.getProfile();

        const data = {
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            location: profile.location,
            summary: profile.summary,
            skills: JSON.stringify(profile.skills),
            experience: JSON.stringify(profile.experience),
            education: JSON.stringify(profile.education),
        };

        if (existing) {
            // Update existing profile
            db.prepare(`
                UPDATE users 
                SET name = ?, email = ?, phone = ?, location = ?, 
                    summary = ?, skills = ?, experience = ?, education = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = (SELECT id FROM users ORDER BY id DESC LIMIT 1)
            `).run(
                data.name, data.email, data.phone, data.location,
                data.summary, data.skills, data.experience, data.education
            );
        } else {
            // Insert new profile
            db.prepare(`
                INSERT INTO users (name, email, phone, location, summary, skills, experience, education)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                data.name, data.email, data.phone, data.location,
                data.summary, data.skills, data.experience, data.education
            );
        }

        console.log('[Database] User profile saved');
    },
};

/**
 * Job Queries
 */
export const JobDB = {
    // Save a job to database
    save(job: Job): void {
        if (!isAvailable) return;

        const db = getDatabase();
        if (!db) return;

        db.prepare(`
            INSERT OR REPLACE INTO jobs 
            (id, title, company, location, url, description, posted_at, tags, source, requirements, documents_needed, ai_analysis)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            job.id, job.title, job.company, job.location, job.url,
            job.description, job.postedAt, JSON.stringify(job.tags),
            job.source, JSON.stringify(job.requirements),
            JSON.stringify(job.documentsNeeded), job.aiAnalysis || null
        );
    },

    // Get job by ID
    get(jobId: string): Job | null {
        if (!isAvailable) return null;

        const db = getDatabase();
        if (!db) return null;
        const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any;

        if (!row) return null;

        return {
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location,
            url: row.url,
            description: row.description,
            postedAt: row.posted_at,
            tags: JSON.parse(row.tags),
            source: row.source,
            requirements: JSON.parse(row.requirements),
            documentsNeeded: JSON.parse(row.documents_needed),
            aiAnalysis: row.ai_analysis,
        };
    },

    // Get all jobs
    getAll(limit: number = 100): Job[] {
        if (!isAvailable) return [];

        const db = getDatabase();
        if (!db) return [];
        const rows = db.prepare('SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?').all(limit) as any[];

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            company: row.company,
            location: row.location,
            url: row.url,
            description: row.description,
            postedAt: row.posted_at,
            tags: JSON.parse(row.tags),
            source: row.source,
            requirements: JSON.parse(row.requirements),
            documentsNeeded: JSON.parse(row.documents_needed),
            aiAnalysis: row.ai_analysis,
        }));
    },
};

/**
 * Scraping History Queries
 */
export const ScrapingHistoryDB = {
    // Start a new scraping run
    start(totalSites: number, triggerType: 'manual' | 'scheduled' = 'manual'): number {
        if (!isAvailable) return 0;

        const db = getDatabase();
        if (!db) return 0;

        const result = db.prepare(`
            INSERT INTO scraping_history (started_at, total_sites, trigger_type)
            VALUES (?, ?, ?)
        `).run(new Date().toISOString(), totalSites, triggerType);

        return result.lastInsertRowid as number;
    },

    // Complete a scraping run
    complete(
        runId: number,
        successfulSites: number,
        failedSites: number,
        totalJobsFound: number,
        siteDetails: any[]
    ): void {
        if (!isAvailable) return;

        const db = getDatabase();
        if (!db) return;
        const startRow = db.prepare('SELECT started_at FROM scraping_history WHERE id = ?').get(runId) as any;

        if (!startRow) return;

        const durationSeconds = Math.floor(
            (new Date().getTime() - new Date(startRow.started_at).getTime()) / 1000
        );

        db.prepare(`
            UPDATE scraping_history 
            SET completed_at = ?, successful_sites = ?, failed_sites = ?, 
                total_jobs_found = ?, duration_seconds = ?, site_details = ?
            WHERE id = ?
        `).run(
            new Date().toISOString(), successfulSites, failedSites,
            totalJobsFound, durationSeconds, JSON.stringify(siteDetails), runId
        );
    },

    // Get history
    getHistory(limit: number = 10): any[] {
        if (!isAvailable) return [];

        const db = getDatabase();
        if (!db) return [];
        const rows = db.prepare(`
            SELECT * FROM scraping_history 
            ORDER BY started_at DESC 
            LIMIT ?
        `).all(limit) as any[];

        return rows.map(row => ({
            id: row.id,
            startedAt: row.started_at,
            completedAt: row.completed_at,
            totalSites: row.total_sites,
            successfulSites: row.successful_sites,
            failedSites: row.failed_sites,
            totalJobsFound: row.total_jobs_found,
            durationSeconds: row.duration_seconds,
            siteDetails: row.site_details ? JSON.parse(row.site_details) : [],
            triggerType: row.trigger_type,
        }));
    },
};

// Close database connection (call on app shutdown)
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Connection closed');
    }
}
