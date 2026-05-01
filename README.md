<div align="center">

# 🤖 Phyllis AI

**Your AI-Powered Job Hunting Autopilot**

Phyllis is an intelligent, fully automated job analysis and document generation platform that scrapes tech job listings from 20+ remote job boards, analyzes requirements with Google Gemini AI, and generates tailored resumes, CVs, and cover letters — all in one click.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [How It Works](#-how-it-works)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Job Sites](#-job-sites)
- [Scheduling](#-scheduling)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🌟 Overview

Job hunting is exhausting. You spend hours scrolling through dozens of job boards, reading descriptions, tailoring resumes, and writing cover letters — often for roles that aren't even a good fit. **Phyllis AI eliminates that grind.**

Phyllis uses headless browser automation (Puppeteer) to scrape real-time job listings from 20 curated remote job boards, then feeds each listing through Google's Gemini 2.0 Flash model to:

1. **Extract** structured job requirements (skills, experience level, education, responsibilities)
2. **Detect** which documents the employer expects (resume, CV, cover letter)
3. **Generate** ATS-friendly, job-tailored documents in downloadable DOCX format

The entire pipeline runs from a single dashboard button and delivers results in minutes — not hours.

---

## ✨ Key Features

### 🔍 AI-Powered Multi-Site Scraping
- Scrapes **20 job sites** simultaneously with configurable concurrency (expandable to 48+)
- Uses **Puppeteer** for headless browsing to handle JavaScript-rendered pages
- **Gemini AI** intelligently extracts structured job data from raw HTML — no brittle CSS selectors or XPath rules
- Automatic deduplication by job URL

### 🧠 Intelligent Job Analysis
- Extracts **technical skills**, **experience level**, **education requirements**, and **certifications**
- Identifies **soft skills** and **key responsibilities**
- Detects which application documents (resume, CV, cover letter) the job requires
- Generates a concise AI analysis summary for each listing

### 📄 Tailored Document Generation
- **Resumes** — Professional, ATS-friendly DOCX files with content tailored to each job's requirements
- **CVs** — Comprehensive Curriculum Vitae for academic/research/international positions
- **Cover Letters** — Personalized letters addressing the specific company and role
- Automatic **fallback to plain text** if DOCX generation fails
- All documents are downloadable directly from the dashboard

### 📊 Real-Time Progress Tracking
- Live progress dashboard that updates every 2 seconds
- Per-site scraping status with timing metrics (pending → scraping → success/failed)
- Estimated time remaining based on average scrape durations
- Detailed statistics panel with success/failure rates

### 📚 Scraping History & Analytics
- Full history of every scraping run stored in SQLite
- Per-site performance breakdowns (jobs found, duration, errors)
- Tracks manual vs. scheduled runs
- Tabbed interface to browse past scraping sessions

### ⏰ Automated Scheduling
- Built-in cron scheduler for hands-free daily job hunting
- Configurable schedule via environment variables (default: daily at 9 AM)
- Manual trigger option from the dashboard
- Run history with success/failure tracking

### 💾 Persistent Storage
- **SQLite** database (via `better-sqlite3`) with WAL mode for high-performance concurrent access
- Stores user profiles, job history, scraping analytics, and document metadata
- Graceful **in-memory fallback** for serverless/Vercel deployments where SQLite isn't available

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ JobCard  │ │ProgressTrack │ │ Stats    │ │ ScrapingHist  │  │
│  │          │ │              │ │ Panel    │ │               │  │
│  └──────────┘ └──────────────┘ └──────────┘ └───────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Main Dashboard Page                    │   │
│  │         (2-second polling for real-time updates)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST API
┌─────────────────────────▼───────────────────────────────────────┐
│                     API ROUTES (Next.js)                         │
│  /api/analyze  /api/jobs  /api/progress  /api/documents         │
│  /api/resumes  /api/history  /api/scheduler  /api/user          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      SERVICE LAYER                               │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐      │
│  │ JobService   │  │AnalysisService│  │ DocumentService  │      │
│  │ (Scraping)   │  │ (AI Analysis) │  │ (DOCX Gen)       │      │
│  └──────┬───────┘  └───────┬───────┘  └────────┬─────────┘      │
│         │                  │                   │                 │
│  ┌──────▼───────┐  ┌───────▼───────┐  ┌────────▼─────────┐      │
│  │ AI Scraper   │  │  Gemini AI    │  │   docx Library   │      │
│  │ (Puppeteer)  │  │  Integration  │  │   (DOCX builder) │      │
│  └──────────────┘  └───────────────┘  └──────────────────┘      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  SQLite (WAL)    │  │ In-Memory Store │  │  Progress      │  │
│  │  (better-sqlite3)│  │ (Analysis State)│  │  Tracker       │  │
│  └──────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework with API routes |
| **Language** | TypeScript 5 | Type-safe development across frontend and backend |
| **AI Engine** | Google Gemini 2.0 Flash | Job data extraction, requirement analysis, document content generation |
| **Scraping** | Puppeteer 24 | Headless Chromium for scraping JavaScript-rendered job boards |
| **Database** | better-sqlite3 | Embedded SQLite with WAL journaling for concurrent access |
| **Documents** | docx | Programmatic DOCX file generation for resumes, CVs, and cover letters |
| **Email** | Nodemailer | SMTP-based email integration for application delivery |
| **Scheduling** | node-cron | Cron-based task scheduling for automated daily runs |
| **Styling** | Tailwind CSS 4 | Utility-first CSS for the dashboard UI |
| **UI** | React 19 | Component-based frontend with real-time state management |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm**, **yarn**, **pnpm**, or **bun**
- A **Google Gemini API Key** — [Get one free here](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Bennerdoo/phyllis.git
cd phyllis

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
```

### Environment Setup

Create a `.env` file in the project root:

```env
# ─── REQUIRED ──────────────────────────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ─── OPTIONAL: Scheduler ──────────────────────────
SCHEDULER_ENABLED=false
SCHEDULER_CRON=0 9 * * *          # Daily at 9 AM
SCHEDULER_KEYWORD=developer

# ─── OPTIONAL: Email (for application delivery) ───
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

### Run the App

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙ Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | — | Google Gemini API key for AI features |
| `SCHEDULER_ENABLED` | No | `false` | Enable automatic daily job scraping |
| `SCHEDULER_CRON` | No | `0 9 * * *` | Cron expression for scheduling (default: 9 AM daily) |
| `SCHEDULER_KEYWORD` | No | `developer` | Default search keyword for scheduled runs |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server for email delivery |
| `SMTP_PORT` | No | `465` | SMTP port |
| `SMTP_USER` | No | — | SMTP authentication username |
| `SMTP_PASS` | No | — | SMTP authentication password |
| `SMTP_FROM` | No | — | Sender email address |

---

## 🔄 How It Works

### The Pipeline (One Click)

```
 Click "Analyze Tech Jobs"
        │
        ▼
 ┌──────────────────────┐
 │  1. SCRAPE            │  Puppeteer visits 20 job sites concurrently
 │     (3 sites/batch)   │  (3 at a time for stability)
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  2. EXTRACT           │  Gemini AI reads raw HTML and returns
 │     (AI-powered)      │  structured JSON: title, company, skills,
 │                       │  experience level, responsibilities, etc.
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  3. DEDUPLICATE       │  Remove duplicate listings by URL
 │     & PERSIST         │  Save unique jobs to SQLite
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  4. ANALYZE           │  For each job: deep-analyze requirements
 │     (per job)         │  with AI if not already extracted
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  5. GENERATE DOCS     │  Create tailored DOCX files:
 │     (per job)         │  Resume, CV, and/or Cover Letter
 └──────────┬───────────┘
            ▼
 ┌──────────────────────┐
 │  6. DELIVER           │  Documents appear on dashboard
 │                       │  for download (email optional)
 └──────────────────────┘
```

### Scraping Strategy

Phyllis does **not** rely on fragile CSS selectors or XPath queries. Instead:

1. **Puppeteer** renders the full page (including JavaScript-heavy SPAs)
2. The **raw HTML** (up to 50,000 characters) is sent to **Gemini AI**
3. Gemini extracts structured job data using natural language understanding
4. This makes Phyllis resilient to website redesigns — no selector maintenance needed

---

## 📡 API Reference

All endpoints are Next.js API routes under `/api/`.

### Job Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analyze` | Get all current analyses with status counts |
| `POST` | `/api/analyze` | Start a new analysis run. Body: `{ keyword: string }` |
| `DELETE` | `/api/analyze` | Clear all analyses |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/jobs` | Get all scraped jobs from the database |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress` | Get real-time scraping progress |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/documents?jobId=X&type=Y` | Download a generated DOCX document |
| `GET` | `/api/resumes?jobId=X` | Download a generated resume |

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/history` | Get scraping run history |

### Scheduler

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/scheduler` | Get scheduler status |
| `POST` | `/api/scheduler` | Manually trigger a scheduled run |

### User Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user` | Get the current user profile |
| `POST` | `/api/user` | Create or update user profile |

---

## 📁 Project Structure

```
phyllis/
├── .github/
│   └── workflows/
│       └── webpack.yml           # CI/CD pipeline
├── public/                       # Static assets
├── src/
│   ├── app/
│   │   ├── api/                  # Next.js API routes
│   │   │   ├── analyze/          # Job analysis endpoints
│   │   │   ├── applications/     # Application management
│   │   │   ├── apply/            # Job application triggers
│   │   │   ├── auto-apply/       # Automated application flow
│   │   │   ├── cron/             # Cron job endpoints
│   │   │   ├── documents/        # Document download
│   │   │   ├── history/          # Scraping history
│   │   │   ├── jobs/             # Job listing queries
│   │   │   ├── progress/         # Real-time progress
│   │   │   ├── resumes/          # Resume downloads
│   │   │   ├── scheduler/        # Scheduler control
│   │   │   └── user/             # User profile management
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main dashboard
│   ├── components/
│   │   ├── JobCard.tsx           # Individual job analysis card
│   │   ├── ProgressTimeline.tsx  # Step-by-step progress display
│   │   ├── ProgressTracker.tsx   # Real-time scraping progress UI
│   │   ├── ResumePDF.tsx         # PDF resume renderer
│   │   ├── SchedulerStatusPanel.tsx # Scheduler controls
│   │   ├── ScrapingHistory.tsx   # Historical scraping runs
│   │   └── StatisticsPanel.tsx   # Analytics dashboard
│   └── lib/
│       ├── services/
│       │   ├── analysisService.ts   # Job analysis orchestrator
│       │   ├── applicationService.ts # Application workflow
│       │   ├── documentService.ts   # DOCX generation (Resume/CV/Cover Letter)
│       │   ├── jobService.ts        # Multi-site job scraping
│       │   ├── pdfService.ts        # PDF rendering utilities
│       │   └── resumeService.ts     # Resume-specific logic
│       ├── sites/
│       │   └── weworkremotely.ts  # Site-specific scraper (example)
│       ├── aiScraper.ts          # Puppeteer + Gemini AI scraping engine
│       ├── database.ts           # SQLite database layer
│       ├── dummyProfile.ts       # Default user profile template
│       ├── email.ts              # Nodemailer integration
│       ├── gemini.ts             # Google Gemini AI client
│       ├── jobSites.ts           # Job site registry (20 default, 48+ total)
│       ├── progressTracker.ts    # Real-time progress singleton
│       ├── scheduler.ts          # Cron-based scheduler
│       ├── scraper.ts            # Base scraping utilities
│       ├── storage.ts            # In-memory analysis state
│       └── types.ts              # TypeScript type definitions
├── phyllis.db                    # SQLite database (auto-created)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── SECURITY.md
```

---

## 🌐 Job Sites

Phyllis comes pre-configured with **20 curated job sites** across three categories:

### Global Remote Platforms (10)
| Site | Focus |
|------|-------|
| WeWorkRemotely | Remote programming jobs |
| RemoteOK | Remote developer jobs |
| Remotive | Remote software development |
| JustRemote | Remote developer roles |
| Himalayas | Remote job aggregator |
| Remote.co | Remote developer positions |
| Wellfound (AngelList) | Startup jobs |
| Arc.dev | Pre-vetted remote developers |
| DailyRemote | Daily remote job updates |
| Working Nomads | Digital nomad developer jobs |

### Africa-Focused Platforms (5)
| Site | Focus |
|------|-------|
| RemoteAfrica | Pan-African remote jobs |
| Remote4Africa | Africa-targeted remote work |
| BrighterMonday Kenya | East African tech jobs |
| Fuzu Kenya | Kenyan job marketplace |
| Africa Startup Jobs | Startup ecosystem roles |

### AI & Data Platforms (5)
| Site | Focus |
|------|-------|
| Remotasks | AI training tasks |
| Scale AI | AI data operations careers |
| DataAnnotation.tech | Data annotation work |
| Appen | AI training data |
| TELUS Digital AI | AI community roles |

> 💡 **Want more coverage?** Switch to the `ALL_JOB_SITES` export in `src/lib/jobSites.ts` to scrape **48+ sites** (takes 30-60 minutes instead of 2-3 minutes).

---

## ⏰ Scheduling

Phyllis includes a built-in scheduler for fully autonomous operation:

```env
# Enable the scheduler
SCHEDULER_ENABLED=true

# Run every day at 9 AM
SCHEDULER_CRON=0 9 * * *

# Default search keyword
SCHEDULER_KEYWORD=developer
```

### Cron Expression Examples

| Expression | Schedule |
|-----------|----------|
| `0 9 * * *` | Every day at 9:00 AM |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 9,18 * * *` | Twice daily at 9 AM and 6 PM |

---

## 🔒 Security

- API keys are loaded from environment variables — never hardcoded
- Puppeteer runs in sandboxed headless mode
- The SQLite database is local-only — no data leaves your machine
- Email credentials are handled through environment variables
- See [SECURITY.md](SECURITY.md) for vulnerability reporting

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/my-feature`
3. **Commit** your changes: `git commit -m 'Add my feature'`
4. **Push** to the branch: `git push origin feature/my-feature`
5. **Open** a Pull Request

### Ideas for Contribution

- 🌍 Add more regional job sites
- 📊 Enhanced analytics and trend visualization
- 🔔 Notification integrations (Slack, Discord, Telegram)
- 🎨 Dashboard theme customization
- 📱 Mobile-responsive improvements
- 🧪 Test suite (unit + integration)

---

## 📄 License

This project is open source. See the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Bennerdoo](https://github.com/Bennerdoo)**

*Stop job hunting manually. Let Phyllis do the work.*

</div>
