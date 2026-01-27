/**
 * Command-line interface for CSV to SRT subtitle converter.
 *
 * This CLI tool reads CSV data from stdin and outputs SRT subtitle format to stdout.
 * Supports both 3-column and 4-column CSV formats with frame-based timecodes.
 *
 * @example
 * ```bash
 * # Convert CSV to SRT
 * cat input.csv | deno run jsr:@kuboon/csv-to-srt/cli > output.srt
 *
 * # Keep timing gaps
 * cat input.csv | deno run jsr:@kuboon/csv-to-srt/cli --keep-gaps > output.srt
 *
 * # Show help
 * deno run jsr:@kuboon/csv-to-srt/cli --help
 * ```
 *
 * @module cli
 */

import { csvToSrt } from "./lib.js";
import process from "node:process";
import { text } from "node:stream/consumers";
import { parseArgs } from "node:util";

/** Main CLI function */
async function main(): Promise<void> {
  // Parse arguments
  const { values } = parseArgs({
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
      "keep-gaps": {
        type: "boolean",
      },
      "no-gaps": {
        type: "boolean",
      },
    },
    strict: false,
  });

  if (values.help) {
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

  const removeGaps = values["keep-gaps"] ? false : true;

  // Read from stdin
  const csvText = await text(process.stdin);
  const srtText = csvToSrt(csvText, { removeGaps });

  // Output to stdout
  process.stdout.write(srtText);
}

main().catch((error: Error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
