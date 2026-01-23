import puppeteer from 'puppeteer';

export async function scrapeJobContent(url: string) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true, // "new" is deprecated, true is the standard now
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Set a realistic User-Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const content = await page.evaluate(() => {
            // Simple extraction strategy: get the main body text
            // We can refine this later to target specific selectors if we know the site
            return document.body.innerText;
        });

        return content;
    } catch (error) {
        console.error("Scraping Error:", error);
        throw new Error(`Failed to scrape ${url}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
