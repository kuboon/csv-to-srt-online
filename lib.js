// Convert time from HH:MM:SS:FF format to HH:MM:SS,mmm format
// Assuming FF is frames at 30fps (standard frame rate)
export function convertTime(timeStr) {
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

// Simple CSV line parser (handles quoted fields and escaped quotes)
// Also supports tab-separated values for spreadsheet copy/paste
export function parseCSVLine(line) {
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
        } else if ((char === ',' || char === '\t') && !inQuotes) {
            // Split on comma or tab when not in quotes (for spreadsheet support)
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    fields.push(current);

    return fields;
}

// Parse CSV and convert to SRT
export function csvToSrt(csvText, removeGaps = true) {
    try {
        if (!csvText || csvText.trim() === '') {
            return '';
        }

        const lines = csvText.split('\n');
        const subtitles = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].replace(/^[\r\n]+|[\r\n]+$/g, ''); // Remove only leading/trailing newlines, preserve tabs and spaces
            
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

        // Remove gaps if enabled
        if (removeGaps) {
            for (let i = 1; i < subtitles.length; i++) {
                // Set current subtitle's start time to previous subtitle's end time
                subtitles[i].start = subtitles[i - 1].end;
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
    } catch (error) {
        return `Error generating SRT: ${error.message}`;
    }
}
