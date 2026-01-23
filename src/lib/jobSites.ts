// Configuration for all job sites to scrape
export interface JobSiteConfig {
    name: string;
    url: string;
    category: 'global' | 'africa' | 'ai_data';
}

// Curated list of 20 most reliable job sites for daily scraping
// Selected based on: fast page loads, high AI scraping success rates, quality CS/tech jobs
export const JOB_SITES: JobSiteConfig[] = [
    // Top Global Remote Tech Platforms (10) - Fast, reliable, high-quality jobs
    { name: 'WeWorkRemotely', url: 'https://weworkremotely.com/categories/remote-programming-jobs', category: 'global' },
    { name: 'RemoteOK', url: 'https://remoteok.com/remote-dev-jobs', category: 'global' },
    { name: 'Remotive', url: 'https://remotive.com/remote-jobs/software-dev', category: 'global' },
    { name: 'JustRemote', url: 'https://justremote.co/remote-developer-jobs', category: 'global' },
    { name: 'Himalayas', url: 'https://himalayas.app/jobs?filter=remote', category: 'global' },
    { name: 'Remote.co', url: 'https://remote.co/remote-jobs/developer/', category: 'global' },
    { name: 'Wellfound', url: 'https://wellfound.com/jobs', category: 'global' },
    { name: 'Arc.dev', url: 'https://arc.dev/remote-jobs', category: 'global' },
    { name: 'DailyRemote', url: 'https://dailyremote.com/remote-developer-jobs', category: 'global' },
    { name: 'Working Nomads', url: 'https://www.workingnomads.com/jobs?category=development', category: 'global' },

    // Africa-Focused Platforms (5) - Expanding Africa coverage
    { name: 'RemoteAfrica', url: 'https://remoteafrica.io/remote-jobs', category: 'africa' },
    { name: 'Remote4Africa', url: 'https://remote4africa.com/', category: 'africa' },
    { name: 'BrighterMonday Kenya', url: 'https://www.brightermonday.co.ke/jobs/technology', category: 'africa' },
    { name: 'Fuzu Kenya', url: 'https://www.fuzu.com/ke/jobs', category: 'africa' },
    { name: 'Africa Startup Jobs', url: 'https://launchafricajobs.vc/', category: 'africa' },

    // AI/Data Platforms (5) - High-paying AI training opportunities
    { name: 'Remotasks', url: 'https://www.remotasks.com/', category: 'ai_data' },
    { name: 'Scale AI', url: 'https://scale.com/careers', category: 'ai_data' },
    { name: 'DataAnnotation.tech', url: 'https://www.dataannotation.tech/', category: 'ai_data' },
    { name: 'Appen', url: 'https://appen.com/careers/', category: 'ai_data' },
    { name: 'TELUS Digital AI', url: 'https://www.telusinternational.com/careers', category: 'ai_data' },
];

// Full list available - uncomment to scrape more sites (slower but more comprehensive)
// Note: Scraping all sites can take 30-60 minutes
export const ALL_JOB_SITES: JobSiteConfig[] = [
    ...JOB_SITES,

    // Additional Global Platforms (20)
    { name: 'Remote.co', url: 'https://remote.co/remote-jobs/developer/', category: 'global' },
    { name: 'Jobspresso', url: 'https://jobspresso.co/remote-dev-jobs/', category: 'global' },
    { name: 'Wellfound', url: 'https://wellfound.com/jobs', category: 'global' },
    { name: 'FlexJobs', url: 'https://www.flexjobs.com/remote-jobs/computer-it', category: 'global' },
    { name: 'Arc.dev', url: 'https://arc.dev/remote-jobs', category: 'global' },
    { name: 'Remote100K', url: 'https://remote100k.com/', category: 'global' },
    { name: 'Otta', url: 'https://otta.com/remote-jobs', category: 'global' },
    { name: 'Authentic Jobs', url: 'https://authenticjobs.com/#category=4', category: 'global' },
    { name: 'DailyRemote', url: 'https://dailyremote.com/remote-developer-jobs', category: 'global' },
    { name: 'NoDesk', url: 'https://nodesk.co/remote-jobs/', category: 'global' },
    { name: 'Remote.io', url: 'https://www.remote.io/remote-jobs', category: 'global' },
    { name: 'Working Nomads', url: 'https://www.workingnomads.com/jobs?category=development', category: 'global' },
    { name: 'RemoteLeads', url: 'https://remoteleads.io/', category: 'global' },
    { name: 'PowerToFly', url: 'https://powertofly.com/jobs/', category: 'global' },
    { name: 'Dynamite Jobs', url: 'https://dynamitejobs.com/', category: 'global' },
    { name: '4 Day Week', url: 'https://4dayweek.io/remote-jobs', category: 'global' },
    { name: 'EuropeRemotely', url: 'https://europeremotely.com/', category: 'global' },
    { name: 'EU Remote Jobs', url: 'https://euremotejobs.com/', category: 'global' },
    { name: 'Remoters', url: 'https://remoters.net/jobs/', category: 'global' },
    { name: 'Pangian', url: 'https://pangian.com/job-travel-remote/', category: 'global' },

    // Additional Africa Platforms (8)
    { name: 'Tech In Africa', url: 'https://techinafrica.com/', category: 'africa' },
    { name: 'iAfrica Jobs', url: 'https://www.iafrica.com/jobs/', category: 'africa' },
    { name: 'BrighterMonday Kenya', url: 'https://www.brightermonday.co.ke/jobs/technology', category: 'africa' },
    { name: 'MyJobMag Kenya', url: 'https://www.myjobmag.co.ke/', category: 'africa' },
    { name: 'Fuzu Kenya', url: 'https://www.fuzu.com/ke/jobs', category: 'africa' },
    { name: 'Africa Startup Jobs', url: 'https://launchafricajobs.vc/', category: 'africa' },
    { name: 'Expertini Kenya', url: 'https://ke.expertini.com/jobs/remote/', category: 'africa' },
    { name: 'Recruit.net Kenya', url: 'https://www.recruit.net/job/technology-jobs', category: 'africa' },

    // Additional AI/Data Platforms (7)
    { name: 'TELUS Digital AI', url: 'https://www.telusinternational.com/careers', category: 'ai_data' },
    { name: 'Appen', url: 'https://appen.com/careers/', category: 'ai_data' },
    { name: 'Lionbridge', url: 'https://www.lionbridge.com/join-our-team/', category: 'ai_data' },
    { name: 'Clickworker', url: 'https://www.clickworker.com/', category: 'ai_data' },
    { name: 'Toloka', url: 'https://toloka.ai/tolokers/', category: 'ai_data' },
    { name: 'Scale AI', url: 'https://scale.com/careers', category: 'ai_data' },
    { name: 'DataAnnotation.tech', url: 'https://www.dataannotation.tech/', category: 'ai_data' },
];

