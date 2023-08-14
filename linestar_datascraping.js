const puppeteer = require("puppeteer").default;
const fs = require("fs");
const result = [];

const scrollDown = async (page, scrollStep = 250, scrollDelay = 1000) => {
  let previousHeight = await page.evaluate("document.body.scrollHeight");
  let currentHeight = 0;

  while (currentHeight < previousHeight) {
    await page.evaluate(`window.scrollBy(0, ${scrollStep})`);
    await page.waitForTimeout(scrollDelay);

    currentHeight += scrollStep;
    previousHeight = await page.evaluate("document.body.scrollHeight");
  }
};

const scrapeData = async (page, gameNumber) => {
  await page.waitForSelector('#salData');
  // Loop through table rows
  const rows = await page.$$(".playerCardRow");

  const startDate = new Date("2023-03-30");
  const dayInMilliseconds = 24 * 60 * 60 * 1000; // One day in milliseconds
  const date = new Date(startDate.getTime() + (gameNumber - 2053) * dayInMilliseconds);
  
  if (gameNumber > 2155) {
    const allStarBreakStart = new Date("2023-07-10");
    const allStarBreakEnd = new Date("2023-07-14");
    const allStarBreakDuration = allStarBreakEnd.getTime() - allStarBreakStart.getTime();
    date.setTime(date.getTime() + allStarBreakDuration); // Remove one day
  }

  const date2 = String(date)
  for (let row of rows) {
    const playerData = await row.evaluate((el, date2) => ({
      name: el.querySelector(".playername")?.textContent,
      score: el.querySelector("td:nth-child(11)")?.textContent,
      salary: el.querySelector("td:nth-child(10)")?.textContent,
      value: el.querySelector("td:nth-child(9)")?.textContent,
      consensus: el.querySelector("td:nth-child(13)")?.textContent,
      avg_fp: el.querySelector("td:nth-child(22)")?.textContent,
      opp_pitcher: el.querySelector("td:nth-child(15)")?.textContent,
      date: date2,
    }), date2);

    result.push(playerData);
  }
};





const exportCSV = async (result) => {
  const csvData = result.map(item => Object.values(item).join(","));
  // Add the header row
  const headerRow = Object.keys(result[0]).join(",");
  csvData.unshift(headerRow);
  // Join all lines with a newline character
  const csvContent = csvData.join("\n");
  // Write the CSV content to a file
  fs.writeFile("output5.csv", csvContent, (err) => {
    if (err) {
      console.error("Error writing to CSV file:", err);
    } else {
      console.log("CSV file created successfully!");
    }
  });
};

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  for (let i = 2172; i >= 2170; i--) {
    await page.goto('https://www.linestarapp.com/Projections/Sport/MLB/Site/FanDuel/PID/' + i);
    await scrollDown(page, 200, 300);
    await scrapeData(page, i);
  }
  await exportCSV(result);
  await browser.close();
})();
