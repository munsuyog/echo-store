import fetch from "node-fetch";
import { format, addDays } from "date-fns";
import fs from "fs";

// Retry fetch helper
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      console.log(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) await new Promise(r => setTimeout(r, delay));
      else return null;
    }
  }
}

function getDateRange(startDate, endDate) {
  const dates = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  return dates;
}

async function fetchLevelForDate(date) {
  const dateStr = format(date, "yyyy-MM-dd");
  const url = `https://echochess.com/v1/byosnap-echochess/levels/daily/archive/private/${dateStr}?level_type=CLASSIC`;

  console.log(`Fetching data for ${dateStr}...`);
  const res = await fetchWithRetry(url, {
    method: "GET",
    headers: {
      "User-Id": "4bb994ae-2ef8-44f5-9c1d-10b53c4a156e",
      Accept: "application/json",
    },
  });

  if (!res) {
    console.log(`Skipping ${dateStr} after failed retries.`);
    return null;
  }

  try {
    return await res.json();  // <<-- directly return the raw JSON
  } catch (err) {
    console.log(`Error parsing data for ${dateStr}:`, err);
    return null;
  }
}

async function fetchLevelDataBatch() {
  const startDate = new Date(2024, 6, 8); // 8 July 2024
  const endDate = new Date();

  const dates = getDateRange(startDate, endDate);
  const batchSize = 10;
  const records = [];

  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);
    console.log(`Processing batch: ${format(batch[0], "yyyy-MM-dd")} → ${format(batch[batch.length - 1], "yyyy-MM-dd")}`);

    const results = await Promise.all(batch.map(d => fetchLevelForDate(d)));
    results.filter(Boolean).forEach(r => records.push(r));
  }

  console.log(`Writing ${records.length} records to JSON...`);
  fs.writeFileSync("chess_levels.json", JSON.stringify(records, null, 2));
  console.log("JSON file written successfully!");
}

fetchLevelDataBatch();
