/***************************************
 * Dependencies
 ***************************************/

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const csvParser = require("csv-parser");
const csvWriter = require("csv-writer").createObjectCsvWriter;

/***************************************
 * Configuration
 ***************************************/

const inputFilePath = path.join(__dirname, process.env.INPUT || "input.csv");
const outputFilePath = path.join(__dirname, process.env.OUTPUT || "output.csv");

// Concurrency & delay (ms) for search
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "5", 10);
const DELAY_PER_CHUNK_MS = parseInt(process.env.DELAY || "2000", 10);

/***************************************
 * 1. Read and clean CSV data
 ***************************************/
function readAndCleanCSV(filePath) {
  return new Promise((resolve, reject) => {
    const entries = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Assume the first column contains the names
        const name = row[Object.keys(row)[0]];
        if (name && name.trim() !== "---") {
          entries.push(name.trim());
        }
      })
      .on("end", () => resolve(entries))
      .on("error", (error) => reject(error));
  });
}

/***************************************
 * Helper: chunk array
 ***************************************/
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/***************************************
 * Helper: delay
 ***************************************/
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/***************************************
 * 2. Perform DuckDuckGo search
 ***************************************/
async function searchDomains(entries, concurrency = 5, delayMs = 2000) {
  const browser = await puppeteer.launch({ headless: true });

  // Break the data into chunks based on concurrency
  const chunks = chunkArray(entries, concurrency);
  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    console.log(`\nProcessing chunk ${i + 1} of ${chunks.length}...`);

    // to reuse pages, we do something like this:
    const pages = await Promise.all(
      [...Array(chunk.length)].map(() => browser.newPage()),
    );

    // Map each entry in the chunk to a promise
    const promises = chunk.map(async (entry, index) => {
      const page = pages[index];

      try {
        const queryUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(entry)}`;
        await page.goto(queryUrl, { waitUntil: "load" });

        // Extract the first domain from the search results
        const domain = await page.evaluate(() => {
          const link = document.querySelector(".result__a");
          if (link) {
            const href = link.href;
            const url = new URL(href);
            // DuckDuckGo uses the 'uddg' param for the actual target
            const actualUrl = url.searchParams.get("uddg");
            if (actualUrl) {
              return new URL(actualUrl).hostname;
            }
          }
          return null;
        });

        return { name: entry, domain: domain || "Not Found" };
      } catch (error) {
        console.error(`Error searching for "${entry}":`, error);
        return { name: entry, domain: "Error" };
      }
    });

    // Wait for all promises in this chunk to resolve
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);

    // Close all pages
    for (const p of pages) {
      await p.close();
    }

    // Delay after each chunk (throttle)
    if (i < chunks.length - 1) {
      console.log(`Chunk ${i + 1} done. Waiting ${delayMs / 1000} seconds...`);
      await delay(delayMs);
    }
  }

  await browser.close();
  return results;
}

/***************************************
 * 3. Save results to CSV
 ***************************************/
async function saveToCSV(data, outputPath) {
  const writer = csvWriter({
    path: outputPath,
    header: [
      { id: "name", title: "Name" },
      { id: "domain", title: "Domain" },
    ],
  });

  await writer.writeRecords(data);
  console.log(`\nResults saved to "${outputPath}".`);
}

/***************************************
 * 4. Main Execution
 ***************************************/
(async () => {
  try {
    console.log("Reading and cleaning CSV data...");
    const cleanedData = await readAndCleanCSV(inputFilePath);
    console.log(`Total valid entries: ${cleanedData.length}`);

    console.log(`Searching domains with concurrency = ${CONCURRENCY}...`);
    const allResults = await searchDomains(
      cleanedData,
      CONCURRENCY,
      DELAY_PER_CHUNK_MS,
    );

    console.log("Saving results to CSV...");
    await saveToCSV(allResults, outputFilePath);

    console.log("Done!");
  } catch (error) {
    console.error("Error:", error);
  }
})();
