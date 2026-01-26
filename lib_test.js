import { convertTime, csvToSrt, parseCSVLine, parseCSVRows } from "./lib.js";
import { assertEquals } from "@std/assert";

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
  assertEquals(parseCSVLine("field1,field2,field3"), [
    "field1",
    "field2",
    "field3",
  ]);
  assertEquals(parseCSVLine("a,b,c,d"), ["a", "b", "c", "d"]);
});

Deno.test("parseCSVLine - tab-separated values", () => {
  assertEquals(parseCSVLine("field1\tfield2\tfield3"), [
    "field1",
    "field2",
    "field3",
  ]);
});

Deno.test("parseCSVLine - quoted fields", () => {
  assertEquals(parseCSVLine('"field1","field2","field3"'), [
    "field1",
    "field2",
    "field3",
  ]);
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

Deno.test("parseCSVRows - simple CSV", () => {
  const csv = "a,b,c\nd,e,f";
  const expected = [
    ["a", "b", "c"],
    ["d", "e", "f"],
  ];
  assertEquals(parseCSVRows(csv), expected);
});

Deno.test("parseCSVRows - handles multiline quoted fields", () => {
  const csv = '"field1","multiline\nfield","field3"\n"a","b","c"';
  const expected = [
    ["field1", "multiline\nfield", "field3"],
    ["a", "b", "c"],
  ];
  assertEquals(parseCSVRows(csv), expected);
});

Deno.test("parseCSVRows - handles tab-separated values", () => {
  const csv = "a\tb\tc\nd\te\tf";
  const expected = [
    ["a", "b", "c"],
    ["d", "e", "f"],
  ];
  assertEquals(parseCSVRows(csv), expected);
});

Deno.test("parseCSVRows - handles escaped quotes", () => {
  const csv = '"He said ""hello""","normal field"';
  const expected = [
    ['He said "hello"', "normal field"],
  ];
  assertEquals(parseCSVRows(csv), expected);
});

Deno.test("parseCSVRows - handles CRLF line endings", () => {
  const csv = "a,b,c\r\nd,e,f";
  const expected = [
    ["a", "b", "c"],
    ["d", "e", "f"],
  ];
  assertEquals(parseCSVRows(csv), expected);
});

Deno.test("parseCSVRows - handles empty rows", () => {
  const csv = "a,b,c\n\nd,e,f";
  const expected = [
    ["a", "b", "c"],
    ["d", "e", "f"],
  ];
  assertEquals(parseCSVRows(csv), expected);
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
  const lines = result.split("\n");
  assertEquals(lines[5], "00:00:01,000 --> 00:00:03,000");
});

Deno.test("csvToSrt - preserves gaps when disabled", () => {
  const csv = `,00:00:00:00,00:00:01:00,First subtitle
,00:00:02:00,00:00:03:00,Second subtitle`;
  const result = csvToSrt(csv, false);

  // The second subtitle should keep its original start time
  const lines = result.split("\n");
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

Deno.test("csvToSrt - handles multiline quoted fields", () => {
  const csv = `,"00:00:00:00","00:00:02:00","Line 1
Line 2"`;
  const result = csvToSrt(csv, false);
  assertEquals(result.includes("Line 1\nLine 2"), true);
});

Deno.test("csvToSrt - handles 3-column format (no speaker name)", () => {
  const csv = `00:00:00:13,00:00:02:06,運営します
00:00:02:06,00:00:03:29,言いますね`;
  const expected = `1
00:00:00,433 --> 00:00:02,200
運営します

2
00:00:02,200 --> 00:00:03,967
言いますね
`;
  assertEquals(csvToSrt(csv, false), expected);
});

Deno.test("csvToSrt - handles 3-column format with gap removal", () => {
  const csv = `00:00:00:00,00:00:01:00,First subtitle
00:00:02:00,00:00:03:00,Second subtitle`;
  const result = csvToSrt(csv, true);

  // The second subtitle should start where the first one ends
  const lines = result.split("\n");
  assertEquals(lines[5], "00:00:01,000 --> 00:00:03,000");
});

Deno.test("csvToSrt - handles 4-column format (with speaker name)", () => {
  const csv = `Speaker A,00:00:00:13,00:00:02:06,運営します
Speaker B,00:00:02:06,00:00:03:29,言いますね`;
  const expected = `1
00:00:00,433 --> 00:00:02,200
運営します

2
00:00:02,200 --> 00:00:03,967
言いますね
`;
  assertEquals(csvToSrt(csv, false), expected);
});

Deno.test("csvToSrt - handles mixed 3 and 4 column formats", () => {
  const csv = `Speaker A,00:00:00:00,00:00:01:00,First subtitle
00:00:01:00,00:00:02:00,Second subtitle`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
});

Deno.test("csvToSrt - handles 3-column format with quoted fields", () => {
  const csv = `"00:00:00:00","00:00:01:00","Hello, world!"
"00:00:01:00","00:00:02:00","Goodbye, world!"`;
  const result = csvToSrt(csv, false);
  assertEquals(result.includes("Hello, world!"), true);
  assertEquals(result.includes("Goodbye, world!"), true);
});

Deno.test("csvToSrt - skips header with 'Start Time End Time Text'", () => {
  const csv = `Start Time\tEnd Time\tText
00:00:00:00\t00:00:01:00\tFirst subtitle
00:00:01:00\t00:00:02:00\tSecond subtitle`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
  assertEquals(result.includes("Start Time"), false);
});

Deno.test("csvToSrt - handles 3-column format with tab-separated header", () => {
  const csv = `Start Time\tEnd Time\tText
00:00:00:13\t00:00:02:06\t運営します
00:00:02:06\t00:00:03:29\t言いますね`;
  const expected = `1
00:00:00,433 --> 00:00:02,200
運営します

2
00:00:02,200 --> 00:00:03,967
言いますね
`;
  assertEquals(csvToSrt(csv, false), expected);
});

Deno.test("csvToSrt - handles 3-column format with comma-separated header", () => {
  const csv = `Start Time,End Time,Text
00:00:00:00,00:00:01:00,First subtitle
00:00:01:00,00:00:02:00,Second subtitle`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("Start Time"), false);
});

Deno.test("csvToSrt - handles 3-column format with extra columns", () => {
  const csv = `Start Time,End Time,Text,Extra Column,Another One
00:00:00:00,00:00:01:00,First subtitle,ignored,also ignored
00:00:01:00,00:00:02:00,Second subtitle,data,more data`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
  assertEquals(result.includes("ignored"), false);
});

Deno.test("csvToSrt - handles 4-column format with extra columns", () => {
  const csv = `Speaker,Start Time,End Time,Text,Notes,Other
Speaker A,00:00:00:00,00:00:01:00,First subtitle,note1,other1
Speaker B,00:00:01:00,00:00:02:00,Second subtitle,note2,other2`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
  assertEquals(result.includes("note1"), false);
  assertEquals(result.includes("other1"), false);
});

Deno.test("csvToSrt - normalizes Windows line endings (CRLF)", () => {
  const csv =
    `00:00:00:00,00:00:01:00,First subtitle\r\n00:00:01:00,00:00:02:00,Second subtitle`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
});

Deno.test("csvToSrt - normalizes Mac line endings (CR)", () => {
  const csv =
    `00:00:00:00,00:00:01:00,First subtitle\r00:00:01:00,00:00:02:00,Second subtitle`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 2);
  assertEquals(result.includes("First subtitle"), true);
  assertEquals(result.includes("Second subtitle"), true);
});

Deno.test("csvToSrt - handles mixed line endings", () => {
  const csv =
    `Start Time,End Time,Text\r\n00:00:00:00,00:00:01:00,First\n00:00:01:00,00:00:02:00,Second\r00:00:02:00,00:00:03:00,Third`;
  const result = csvToSrt(csv, false);
  const subtitleCount = (result.match(/^\d+$/gm) || []).length;
  assertEquals(subtitleCount, 3);
  assertEquals(result.includes("First"), true);
  assertEquals(result.includes("Second"), true);
  assertEquals(result.includes("Third"), true);
});
