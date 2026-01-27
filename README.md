# csv-to-srt-online

A simple CSV to SRT subtitle converter. Available as both a web app and CLI tool.

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
deno run jsr:@kuboon/csv-to-srt/cli < input.csv > output.srt
npx jsr @kuboon/csv-to-srt/cli < input.csv > output.srt

# Keep timing gaps (don't auto-adjust)
deno run jsr:@kuboon/csv-to-srt/cli --keep-gaps < input.csv > output.srt
npx jsr @kuboon/csv-to-srt/cli --keep-gaps < input.csv > output.srt

# Show help
deno run jsr:@kuboon/csv-to-srt/cli --help
npx jsr @kuboon/csv-to-srt/cli --help
```

### CSV Format

Supports two formats:

**3-column format:**
```
start_time,end_time,text
00:00:01:00,00:00:03:00,Hello World
00:00:03:00,00:00:05:00,This is a test
```

**4-column format:**
```
speaker_name,start_time,end_time,text
Speaker A,00:00:01:00,00:00:03:00,Hello World
Speaker B,00:00:03:00,00:00:05:00,This is a test
```

Time format: `HH:MM:SS:FF` (frames at 30fps)
