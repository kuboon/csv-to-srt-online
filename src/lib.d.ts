/**
 * Convert time from HH:MM:SS:FF format to HH:MM:SS,mmm format.
 *
 * @param timeStr - Time string in HH:MM:SS:FF format
 * @returns Time string in HH:MM:SS,mmm format, or null if invalid
 */
export function convertTime(timeStr: string | null): string | null;

/**
 * Options for CSV to SRT conversion.
 */
export interface CsvToSrtOptions {
  /**
   * Remove gaps between subtitles by adjusting start times.
   * @default true
   */
  removeGaps?: boolean;
}

/**
 * Parse CSV text and convert to SRT subtitle format.
 *
 * @param csvText - CSV text to convert
 * @param options - Conversion options
 * @returns SRT formatted subtitle text
 */
export function csvToSrt(csvText: string, options?: CsvToSrtOptions): string;

/**
 * Parse CSV text into rows, handling quoted fields that may contain newlines.
 *
 * @param csvText - CSV text to parse
 * @returns Array of rows, where each row is an array of field values
 */
export function parseCSVRows(csvText: string): string[][];

/**
 * Parse a single CSV line into fields, handling quoted fields and escaped quotes.
 *
 * @param line - CSV line to parse
 * @returns Array of field values
 */
export function parseCSVLine(line: string): string[];
