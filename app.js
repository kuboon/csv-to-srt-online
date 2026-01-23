const csvInput = document.getElementById('csvInput');
const srtOutput = document.getElementById('srtOutput');
const copyButton = document.getElementById('copyButton');
const uploadButton = document.getElementById('uploadButton');
const fileInput = document.getElementById('fileInput');
const downloadButton = document.getElementById('downloadButton');
const removeGapsCheckbox = document.getElementById('removeGapsCheckbox');

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
function csvToSrt(csvText, removeGaps = true) {
    try {
        if (!csvText || csvText.trim() === '') {
            return '';
        }

        const rows = parseCSVRows(csvText);
        const subtitles = [];

        for (let i = 0; i < rows.length; i++) {
            const fields = rows[i];
            
            // Skip empty rows and header
            if (fields.length === 0 || fields.join('').trim() === '' || 
                fields.join(',').toLowerCase().includes('speaker name')) {
                continue;
            }
            
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

// Parse CSV text into rows, handling quoted fields that may contain newlines
function parseCSVRows(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote ("") - add one quote to the field
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if ((char === ',' || char === '\t') && !inQuotes) {
            // Split on comma or tab when not in quotes (for spreadsheet support)
            currentRow.push(currentField);
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // End of row when not in quotes
            if (char === '\r' && nextChar === '\n') {
                i++; // Skip \n in \r\n
            }
            // Only add row if we have some content
            if (currentField !== '' || currentRow.length > 0) {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
        } else {
            // Add character to current field (including newlines when inside quotes)
            currentField += char;
        }
    }

    // Add the last field and row if there's any content
    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }

    return rows;
}

// Simple CSV line parser (handles quoted fields and escaped quotes)
// Also supports tab-separated values for spreadsheet copy/paste
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

// Convert CSV to SRT on input
csvInput.addEventListener('input', function() {
    const removeGaps = removeGapsCheckbox.checked;
    const srt = csvToSrt(this.value, removeGaps);
    srtOutput.value = srt;
});

// Re-convert when checkbox state changes
removeGapsCheckbox.addEventListener('change', function() {
    const removeGaps = this.checked;
    const srt = csvToSrt(csvInput.value, removeGaps);
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

// Upload CSV file button
uploadButton.addEventListener('click', function() {
    fileInput.click();
});

// Handle file upload
fileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
            alert('Please select a CSV file.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            csvInput.value = e.target.result;
            // Trigger conversion
            const removeGaps = removeGapsCheckbox.checked;
            const srt = csvToSrt(csvInput.value, removeGaps);
            srtOutput.value = srt;
        };
        reader.readAsText(file);
    }
});

// Download SRT file button
downloadButton.addEventListener('click', function() {
    const srtContent = srtOutput.value;
    if (!srtContent || srtContent.trim() === '') {
        alert('No SRT content to download. Please convert CSV first.');
        return;
    }
    
    // Create a blob with the SRT content
    const blob = new Blob([srtContent], { type: 'application/x-subrip' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Visual feedback
    const originalText = this.textContent;
    this.textContent = 'Downloaded!';
    setTimeout(() => {
        this.textContent = originalText;
    }, 2000);
});
