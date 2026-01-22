const csvInput = document.getElementById('csvInput');
const srtOutput = document.getElementById('srtOutput');
const copyButton = document.getElementById('copyButton');

// Convert time from HH:MM:SS:FF format to HH:MM:SS,mmm format
// Assuming FF is frames at 30fps (standard frame rate)
function convertTime(timeStr) {
    if (!timeStr || timeStr.trim() === '') {
        return null;
    }

    const parts = timeStr.trim().split(':');
    if (parts.length !== 4) {
        return null;
    }

    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    const seconds = parts[2].padStart(2, '0');
    const frames = parseInt(parts[3], 10);

    // Convert frames to milliseconds
    // Note: Assumes 30fps frame rate. Common rates: 24fps (film), 25fps (PAL), 30fps (NTSC), 29.97fps (NTSC drop-frame)
    const milliseconds = Math.round((frames / 30) * 1000);
    const ms = milliseconds.toString().padStart(3, '0');

    return `${hours}:${minutes}:${seconds},${ms}`;
}

// Parse CSV and convert to SRT
function csvToSrt(csvText) {
    if (!csvText || csvText.trim() === '') {
        return '';
    }

    const lines = csvText.split('\n');
    const subtitles = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and header
        if (!line || line.toLowerCase().includes('speaker name')) {
            continue;
        }

        // Parse CSV line (simple parser that handles basic CSV)
        const fields = parseCSVLine(line);
        
        if (fields.length >= 4) {
            const startTime = convertTime(fields[1]);
            const endTime = convertTime(fields[2]);
            const text = fields[3];

            if (startTime && endTime && text && text.trim() !== '') {
                subtitles.push({
                    start: startTime,
                    end: endTime,
                    text: text.trim()
                });
            }
        }
    }

    // Generate SRT format
    let srt = '';
    for (let i = 0; i < subtitles.length; i++) {
        const sub = subtitles[i];
        srt += `${i + 1}\n`;
        srt += `${sub.start} --> ${sub.end}\n`;
        srt += `${sub.text}\n`;
        if (i < subtitles.length - 1) {
            srt += '\n';
        }
    }

    return srt;
}

// Simple CSV line parser (handles quoted fields and escaped quotes)
function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote ("") - add one quote to the field
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current);

    return fields;
}

// Convert CSV to SRT on input
csvInput.addEventListener('input', function() {
    const srt = csvToSrt(this.value);
    srtOutput.value = srt;
});

// Select all text when output textarea is focused
srtOutput.addEventListener('focus', function() {
    this.select();
});

// Copy to clipboard button
copyButton.addEventListener('click', async function() {
    const button = this;
    const originalText = button.textContent;
    
    try {
        // Use modern Clipboard API if available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(srtOutput.value);
        } else {
            // Fallback to deprecated execCommand for older browsers
            srtOutput.select();
            document.execCommand('copy');
        }
        
        // Visual feedback
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
        button.textContent = 'Failed to copy';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
});
