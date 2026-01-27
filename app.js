import { csvToSrt } from "./lib.js";

const csvInput = document.getElementById("csvInput");
const srtOutput = document.getElementById("srtOutput");
const copyButton = document.getElementById("copyButton");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const downloadButton = document.getElementById("downloadButton");
const removeGapsCheckbox = document.getElementById("removeGapsCheckbox");

// Store uploaded CSV filename
let uploadedFileName = null;

// Convert CSV to SRT on input
csvInput.addEventListener("input", function () {
  const removeGaps = removeGapsCheckbox.checked;
  const srt = csvToSrt(this.value, { removeGaps });
  srtOutput.value = srt;
});

// Re-convert when checkbox state changes
removeGapsCheckbox.addEventListener("change", function () {
  const removeGaps = this.checked;
  const srt = csvToSrt(csvInput.value, { removeGaps });
  srtOutput.value = srt;
});

// Select all text when output textarea is focused
srtOutput.addEventListener("focus", function () {
  this.select();
});

// Copy to clipboard button
copyButton.addEventListener("click", async function () {
  const button = this;
  const originalText = button.textContent;

  try {
    // Use modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(srtOutput.value);
    } else {
      // Fallback to deprecated execCommand for older browsers
      srtOutput.select();
      document.execCommand("copy");
    }

    // Visual feedback
    button.textContent = "Copied!";
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
    button.textContent = "Failed to copy";
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }
});

// Upload CSV file button
uploadButton.addEventListener("click", function () {
  fileInput.click();
});

// Handle file upload
fileInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      alert("Please select a CSV file.");
      return;
    }

    // Store filename (without .csv extension)
    uploadedFileName = file.name.replace(/\.csv$/i, "");

    const reader = new FileReader();
    reader.onload = function (e) {
      csvInput.value = e.target.result;
      // Trigger conversion
      const removeGaps = removeGapsCheckbox.checked;
      const srt = csvToSrt(csvInput.value, { removeGaps });
      srtOutput.value = srt;
    };
    reader.readAsText(file);
  }
});

// Download SRT file button
downloadButton.addEventListener("click", function () {
  const srtContent = srtOutput.value;
  if (!srtContent || srtContent.trim() === "") {
    alert("No SRT content to download. Please convert CSV first.");
    return;
  }

  // Create a blob with the SRT content
  const blob = new Blob([srtContent], { type: "application/x-subrip" });

  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Use uploaded filename if available, otherwise use default
  a.download = uploadedFileName ? `${uploadedFileName}.srt` : "subtitles.srt";

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Visual feedback
  const originalText = this.textContent;
  this.textContent = "Downloaded!";
  setTimeout(() => {
    this.textContent = originalText;
  }, 2000);
});
