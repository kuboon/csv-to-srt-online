import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { convertTime, parseCSVLine, csvToSrt } from "./lib.js";

Deno.test("convertTime - valid time conversion", () => {
    assertEquals(convertTime("00:00:00:13"), "00:00:00,433");
    assertEquals(convertTime("00:00:02:06"), "00:00:02,200");
    assertEquals(convertTime("01:23:45:29"), "01:23:45,967");
});

Deno.test("convertTime - handles padding", () => {
    assertEquals(convertTime("1:2:3:4"), "01:02:03,133");
});

Deno.test("convertTime - invalid input returns null", () => {
    assertEquals(convertTime(""), null);
    assertEquals(convertTime("  "), null);
    assertEquals(convertTime(null), null);
    assertEquals(convertTime("00:00:00"), null); // Missing frames
    assertEquals(convertTime("invalid"), null);
});

Deno.test("parseCSVLine - simple comma-separated values", () => {
    assertEquals(parseCSVLine("field1,field2,field3"), ["field1", "field2", "field3"]);
    assertEquals(parseCSVLine("a,b,c,d"), ["a", "b", "c", "d"]);
});

Deno.test("parseCSVLine - tab-separated values", () => {
    assertEquals(parseCSVLine("field1\tfield2\tfield3"), ["field1", "field2", "field3"]);
});

Deno.test("parseCSVLine - quoted fields", () => {
    assertEquals(parseCSVLine('"field1","field2","field3"'), ["field1", "field2", "field3"]);
    assertEquals(parseCSVLine('"hello, world",test'), ["hello, world", "test"]);
});

Deno.test("parseCSVLine - escaped quotes", () => {
    assertEquals(parseCSVLine('"He said ""hello"""'), ['He said "hello"']);
    assertEquals(parseCSVLine('"""quoted""",normal'), ['"quoted"', "normal"]);
});

Deno.test("parseCSVLine - empty fields", () => {
    assertEquals(parseCSVLine(",,"), ["", "", ""]);
    assertEquals(parseCSVLine("a,,c"), ["a", "", "c"]);
});

Deno.test("csvToSrt - basic conversion", () => {
    const csv = `,00:00:00:13,00:00:02:06,運営します
,00:00:02:06,00:00:03:29,言いますね`;
    const expected = `1
00:00:00,433 --> 00:00:02,200
運営します

2
00:00:02,200 --> 00:00:03,967
言いますね
`;
    assertEquals(csvToSrt(csv, false), expected);
});

Deno.test("csvToSrt - removes gaps when enabled", () => {
    const csv = `,00:00:00:00,00:00:01:00,First subtitle
,00:00:02:00,00:00:03:00,Second subtitle`;
    const result = csvToSrt(csv, true);
    
    // The second subtitle should start where the first one ends
    const lines = result.split('\n');
    assertEquals(lines[5], "00:00:01,000 --> 00:00:03,000");
});

Deno.test("csvToSrt - preserves gaps when disabled", () => {
    const csv = `,00:00:00:00,00:00:01:00,First subtitle
,00:00:02:00,00:00:03:00,Second subtitle`;
    const result = csvToSrt(csv, false);
    
    // The second subtitle should keep its original start time
    const lines = result.split('\n');
    assertEquals(lines[5], "00:00:02,000 --> 00:00:03,000");
});

Deno.test("csvToSrt - skips empty lines", () => {
    const csv = `,00:00:00:00,00:00:01:00,First

,00:00:02:00,00:00:03:00,Second`;
    const result = csvToSrt(csv, false);
    const subtitleCount = (result.match(/^\d+$/gm) || []).length;
    assertEquals(subtitleCount, 2);
});

Deno.test("csvToSrt - skips header", () => {
    const csv = `Speaker Name,Start Time,End Time,Text
,00:00:00:00,00:00:01:00,Subtitle text`;
    const result = csvToSrt(csv, false);
    const subtitleCount = (result.match(/^\d+$/gm) || []).length;
    assertEquals(subtitleCount, 1);
});

Deno.test("csvToSrt - handles empty input", () => {
    assertEquals(csvToSrt(""), "");
    assertEquals(csvToSrt("  "), "");
});

Deno.test("csvToSrt - skips invalid lines", () => {
    const csv = `,00:00:00:00,00:00:01:00,Valid subtitle
invalid line
,00:00:02:00,00:00:03:00,Another valid`;
    const result = csvToSrt(csv, false);
    const subtitleCount = (result.match(/^\d+$/gm) || []).length;
    assertEquals(subtitleCount, 2);
});

Deno.test("csvToSrt - handles quoted text with commas", () => {
    const csv = `,"00:00:00:00","00:00:01:00","Hello, world!"`;
    const result = csvToSrt(csv, false);
    assertEquals(result.includes("Hello, world!"), true);
});

Deno.test("csvToSrt - trims text", () => {
    const csv = `,00:00:00:00,00:00:01:00,  Text with spaces  `;
    const result = csvToSrt(csv, false);
    assertEquals(result.includes("Text with spaces"), true);
    assertEquals(result.includes("  Text with spaces  "), false);
});
