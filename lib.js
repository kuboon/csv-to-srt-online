// Convert time from HH:MM:SS:FF format to HH:MM:SS,mmm format
// Assuming FF is frames at 30fps (standard frame rate)
// Supports both : and ; as delimiters
export function convertTime(timeStr) {
  if (!timeStr || timeStr.trim() === "") {
    return null;
  }

  // Support both : and ; as time delimiters
  const parts = timeStr.trim().split(/[:;]/);
  if (parts.length !== 4) {
    return null;
  }

  const hours = parts[0].padStart(2, "0");
  const minutes = parts[1].padStart(2, "0");
  const seconds = parts[2].padStart(2, "0");
  const frames = parseInt(parts[3], 10);

  // Convert frames to milliseconds
  // Note: Assumes 30fps frame rate. Common rates: 24fps (film), 25fps (PAL), 30fps (NTSC), 29.97fps (NTSC drop-frame)
  const milliseconds = Math.round((frames / 30) * 1000);
  const ms = milliseconds.toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds},${ms}`;
}

// Parse CSV and convert to SRT
export function csvToSrt(csvText, options = {}) {
  const { removeGaps = true } = options;
  
  try {
    if (!csvText || csvText.trim() === "") {
      return "";
    }

    // Normalize line endings to \n (handle Windows \r\n and Mac \r)
    csvText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const rows = parseCSVRows(csvText);
    const subtitles = [];

    for (let i = 0; i < rows.length; i++) {
      const fields = rows[i];

      // Skip empty rows and header
      const rowText = fields.join(",").toLowerCase();
      if (
        fields.length === 0 || fields.join("").trim() === "" ||
        rowText.includes("speaker name") ||
        (rowText.includes("start time") && rowText.includes("end time"))
      ) {
        continue;
      }

      let startTime, endTime, text;

      // Determine format by checking if first column is a time format
      // If fields[0] is time format: 3-column format (start, end, text)
      // If fields[1] is time format: 4-column format (speaker, start, end, text)
      const firstColIsTime = convertTime(fields[0]) !== null;

      if (firstColIsTime && fields.length >= 3) {
        // 3-column format: start time, end time, text (+ optional extra columns)
        startTime = convertTime(fields[0]);
        endTime = convertTime(fields[1]);
        text = fields[2];
      } else if (!firstColIsTime && fields.length >= 4) {
        // 4-column format: speaker name, start time, end time, text (+ optional extra columns)
        startTime = convertTime(fields[1]);
        endTime = convertTime(fields[2]);
        text = fields[3];
      }

      if (startTime && endTime && text && text.trim() !== "") {
        subtitles.push({
          start: startTime,
          end: endTime,
          text: text.trim(),
        });
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
    let srt = "";
    for (let i = 0; i < subtitles.length; i++) {
      const sub = subtitles[i];
      srt += `${i + 1}\n`;
      srt += `${sub.start} --> ${sub.end}\n`;
      srt += `${sub.text}\n`;
      if (i < subtitles.length - 1) {
        srt += "\n";
      }
    }

    return srt;
  } catch (error) {
    return `Error generating SRT: ${error.message}`;
  }
}

// Parse CSV text into rows, handling quoted fields that may contain newlines
export function parseCSVRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
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
    } else if ((char === "," || char === "\t") && !inQuotes) {
      // Split on comma or tab when not in quotes (for spreadsheet support)
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      // End of row when not in quotes
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip \n in \r\n
      }
      // Only add row if we have some content
      if (currentField !== "" || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      }
    } else {
      // Add character to current field (including newlines when inside quotes)
      currentField += char;
    }
  }

  // Add the last field and row if there's any content
  if (currentField !== "" || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

// Simple CSV line parser (handles quoted fields and escaped quotes)
// Also supports tab-separated values for spreadsheet copy/paste
export function parseCSVLine(line) {
  const fields = [];
  let current = "";
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
    } else if ((char === "," || char === "\t") && !inQuotes) {
      // Split on comma or tab when not in quotes (for spreadsheet support)
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);

  return fields;
}
