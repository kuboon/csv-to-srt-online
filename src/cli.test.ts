import { assertEquals, assertStringIncludes } from "@std/assert";

const CLI_PATH = new URL("./cli.ts", import.meta.url).pathname;

Deno.test("cli - basic conversion", async () => {
  const input = `00:00:01:00,00:00:03:00,Hello World
00:00:03:00,00:00:05:00,This is a test`;

  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const { stdout, stderr, success } = await child.output();
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);

  assertEquals(success, true, `Error: ${error}`);
  assertStringIncludes(output, "1\n00:00:01,000 --> 00:00:03,000\nHello World");
  assertStringIncludes(
    output,
    "2\n00:00:03,000 --> 00:00:05,000\nThis is a test",
  );
});

Deno.test("cli - keep gaps option", async () => {
  const input = `00:00:01:00,00:00:03:00,Hello World
00:00:05:00,00:00:07:00,This is a test`;

  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH, "--keep-gaps"],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const { stdout, success } = await child.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  // With --keep-gaps, times should remain as-is
  assertStringIncludes(output, "00:00:01,000 --> 00:00:03,000");
  assertStringIncludes(output, "00:00:05,000 --> 00:00:07,000");
});

Deno.test("cli - remove gaps (default)", async () => {
  const input = `00:00:01:00,00:00:03:00,Hello World
00:00:05:00,00:00:07:00,This is a test`;

  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const { stdout, success } = await child.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  // Without --keep-gaps, second subtitle should start at 00:00:03,000
  assertStringIncludes(output, "00:00:01,000 --> 00:00:03,000");
  assertStringIncludes(output, "00:00:03,000 --> 00:00:07,000");
});

Deno.test("cli - help option", async () => {
  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH, "--help"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, success, code } = await process.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  assertEquals(code, 0);
  assertStringIncludes(output, "Usage: csv-to-srt [OPTIONS]");
  assertStringIncludes(output, "--keep-gaps");
  assertStringIncludes(output, "--help");
});

Deno.test("cli - short help option", async () => {
  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH, "-h"],
    stdout: "piped",
    stderr: "piped",
  });

  const { stdout, success } = await process.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  assertStringIncludes(output, "Usage: csv-to-srt [OPTIONS]");
});

Deno.test("cli - 4-column format", async () => {
  const input = `Speaker A,00:00:01:00,00:00:03:00,Hello World
Speaker B,00:00:03:00,00:00:05:00,This is a test`;

  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(input));
  await writer.close();

  const { stdout, success } = await child.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  assertStringIncludes(output, "Hello World");
  assertStringIncludes(output, "This is a test");
  // Speaker names should not appear in output
  assertEquals(output.includes("Speaker A"), false);
  assertEquals(output.includes("Speaker B"), false);
});

Deno.test("cli - empty input", async () => {
  const process = new Deno.Command("deno", {
    args: ["run", CLI_PATH],
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const child = process.spawn();
  const writer = child.stdin.getWriter();
  await writer.write(new TextEncoder().encode(""));
  await writer.close();

  const { stdout, success } = await child.output();
  const output = new TextDecoder().decode(stdout);

  assertEquals(success, true);
  assertEquals(output, "");
});
