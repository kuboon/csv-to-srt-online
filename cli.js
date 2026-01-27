#!/usr/bin/env node

import { csvToSrt } from "./lib.js";

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  let removeGaps = true;

  // Parse arguments
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Usage: csv-to-srt [OPTIONS]

Convert CSV to SRT subtitle format.

OPTIONS:
  --no-gaps     Remove gaps between subtitles (default)
  --keep-gaps   Keep original timing gaps
  -h, --help    Show this help message

EXAMPLES:
  cat input.csv | csv-to-srt > output.srt
  csv-to-srt < input.csv > output.srt
  csv-to-srt --keep-gaps < input.csv > output.srt

CSV FORMAT:
  3-column: start_time, end_time, text
  4-column: speaker_name, start_time, end_time, text
  Time format: HH:MM:SS:FF (frames at 30fps)
`);
    process.exit(0);
  }

  if (args.includes("--keep-gaps")) {
    removeGaps = false;
  }

  // Read from stdin
  const chunks = [];
  
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const csvText = Buffer.concat(chunks).toString("utf8");
  const srtText = csvToSrt(csvText, { removeGaps });

  // Output to stdout
  process.stdout.write(srtText);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
