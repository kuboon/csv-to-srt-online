# csv-to-srt

A simple CSV to SRT subtitle converter. Available as both a web app and CLI
tool.

[![JSR](https://jsr.io/badges/@kuboon/csv-to-srt)](https://jsr.io/@kuboon/csv-to-srt)
[![JSR Score](https://jsr.io/badges/@kuboon/csv-to-srt/score)](https://jsr.io/@kuboon/csv-to-srt)

## Features

- 🚀 Convert CSV files to SRT subtitle format
- ⏱️ Supports frame-based timecodes (HH:MM:SS:FF at 30fps)
- 📝 Handles both 3-column and 4-column CSV formats
- 🔧 Optional gap removal between subtitles
- 🌐 Works in browsers and via CLI
- 📦 Available on [JSR](https://jsr.io/@kuboon/csv-to-srt)

## Use on your browser
https://kuboon.github.io/csv-to-srt-online/
It does not send your csv to any server.
All processing is completed within the browser.

## Installation

### As a Library

```bash
# Deno
deno add @kuboon/csv-to-srt

# npm
npx jsr add @kuboon/csv-to-srt

# Yarn
yarn dlx jsr add @kuboon/csv-to-srt

# pnpm
pnpm dlx jsr add @kuboon/csv-to-srt
```

### As a CLI Tool

No installation needed! Use directly with `deno x` or `npx xjsr`.

## Usage

### Library

```javascript
import { csvToSrt } from "@kuboon/csv-to-srt";

const csv = `00:00:01:00,00:00:03:00,Hello World
00:00:03:00,00:00:05:00,This is a test`;

const srt = csvToSrt(csv, { removeGaps: true });
console.log(srt);
```

Output:

```
1
00:00:01,000 --> 00:00:03,000
Hello World

2
00:00:03,000 --> 00:00:05,000
This is a test
```

## Web App

Open `index.html` in your browser to use the web interface.

## CLI Tool

Convert CSV files to SRT format using stdin/stdout:

```bash
# Using Deno (JSR)
cat input.csv | deno x jsr:@kuboon/csv-to-srt/cli > output.srt

# Using npx (Node.js) and [xjsr](https://www.npmjs.com/package/xjsr)
cat input.csv | npx xjsr @kuboon/csv-to-srt/cli > output.srt

# Local development
cat input.csv | deno run cli.js > output.srt

# Or with input redirection
deno x jsr:@kuboon/csv-to-srt/cli < input.csv > output.srt
npx xjsr @kuboon/csv-to-srt/cli < input.csv > output.srt

# Keep timing gaps (don't auto-adjust)
deno x jsr:@kuboon/csv-to-srt/cli --keep-gaps < input.csv > output.srt
npx xjsr @kuboon/csv-to-srt/cli --keep-gaps < input.csv > output.srt

# Show help
deno x jsr:@kuboon/csv-to-srt/cli --help
npx xjsr @kuboon/csv-to-srt/cli --help
```

### CSV Format

Supports CSV output from Adobe Premire caption & graphics. (Let me know if
output was not successfully parsed)

#### 3-column format

```csv
start_time,end_time,text
00:00:01:00,00:00:03:00,Hello World
00:00:03:00,00:00:05:00,This is a test
```

#### 4-column format

```csv
speaker_name,start_time,end_time,text
Speaker A,00:00:01:00,00:00:03:00,Hello World
Speaker B,00:00:03:00,00:00:05:00,This is a test
```

**Time format:** `HH:MM:SS:FF` where FF represents frames at 30fps

### API Reference

See the [API documentation on JSR](https://jsr.io/@kuboon/csv-to-srt/doc) for
detailed information.

#### `csvToSrt(csvText, options)`

Converts CSV text to SRT format.

**Parameters:**

- `csvText` (string): CSV text to convert
- `options` (object, optional):
  - `removeGaps` (boolean, default: `true`): Remove gaps between subtitles

**Returns:** SRT formatted subtitle text (string)

#### `convertTime(timeStr)`

Converts time from HH:MM:SS:FF to HH:MM:SS,mmm format.

**Parameters:**

- `timeStr` (string): Time string in HH:MM:SS:FF format

**Returns:** Time string in SRT format, or null if invalid

#### `parseCSVRows(csvText)`

Parses CSV text into rows with proper quote handling.

**Parameters:**

- `csvText` (string): CSV text to parse

**Returns:** Array of rows (array of string arrays)

## Development

```bash
# Run tests
deno test

# Serve web app locally
deno task serve

# Lint and format
deno fmt
deno lint
```

## License

MIT
