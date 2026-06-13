import puppeteer from 'puppeteer';

export async function scrapeJobContent(url: string) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Set a realistic User-Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            // Wait slightly for dynamic JS rendering
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (gotoError) {
            console.warn(`[Scraper] Navigation to ${url} timed out or failed, attempting to read current content anyway:`, gotoError);
        }

        const content = await page.evaluate(() => {
            // Get clean body text
            return document.body ? document.body.innerText : '';
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
