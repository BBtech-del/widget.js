(function() {
  // Read config from the page
  const cfg = window.BizBuildConfig || {};
  if (!cfg.clientId || !cfg.scrapeUrl) {
    console.error("[BizBuild Widget] Missing clientId or scrapeUrl in BizBuildConfig");
    return;
  }

  const WORKER_BASE = "https://bizbuild-scraper.oluwasanu.workers.dev";
  const STORAGE_KEY = `bizbuild_scraped_${cfg.clientId}`;

  async function scrapeSite() {
    try {
      const resp = await fetch(`${WORKER_BASE}/scrape?scrapeUrl=${encodeURIComponent(cfg.scrapeUrl)}`);
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

  // Trigger scrape only once per client in this browser
  if (!localStorage.getItem(STORAGE_KEY)) {
    console.log("[BizBuild Scraper] First load for client — scraping site...");
    scrapeSite();
  } else {
    console.log("[BizBuild Scraper] Already scraped for this client — skipping.");
  }

  // Load chat widget UI
  const iframe = document.createElement("iframe");
  iframe.src = `https://chat.bizbuild.tech/?clientId=${encodeURIComponent(cfg.clientId)}&avatarUrl=${encodeURIComponent(cfg.avatarUrl || '')}`;
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "400px";
  iframe.style.height = "600px";
  iframe.style.border = "none";
  iframe.style.zIndex = "9999";
  document.body.appendChild(iframe);
})();
