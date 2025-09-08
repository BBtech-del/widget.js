(function() {
  // === CONFIG ===
  const WORKER_BASE = "https://bizbuild-scraper.oluwasanu.workers.dev";
  const SCRAPE_URL = window.location.origin; // scrape the current site
  const STORAGE_KEY = "bizbuild_scraped";

  // === HELPER: call scrape endpoint ===
  async function scrapeSite() {
    try {
      const resp = await fetch(`${WORKER_BASE}/scrape?scrapeUrl=${encodeURIComponent(SCRAPE_URL)}`);
      const data = await resp.json();
      console.log("[BizBuild Scraper] Response:", data);
      if (data.success && data.wikiResponse?.data?.pages?.create?.responseResult?.succeeded) {
        console.log("[BizBuild Scraper] Page created in Wiki.js:", data.wikiResponse.data.pages.create.page?.path);
        localStorage.setItem(STORAGE_KEY, "done");
      } else {
        console.warn("[BizBuild Scraper] Scrape failed:", data);
      }
    } catch (err) {
      console.error("[BizBuild Scraper] Error:", err);
    }
  }

  // === MAIN ===
  (function init() {
    const alreadyScraped = localStorage.getItem(STORAGE_KEY);
    if (!alreadyScraped) {
      console.log("[BizBuild Scraper] First load detected — scraping site...");
      scrapeSite();
    } else {
      console.log("[BizBuild Scraper] Already scraped — skipping.");
    }
  })();
})();
