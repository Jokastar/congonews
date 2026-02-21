// Cleans raw text by removing space artifacts and excessive whitespace
function cleanText(raw) {
  if (typeof raw !== 'string') return raw;
  // Remove common space artifacts like \n, \t, multiple spaces, etc.
  let cleaned = raw.replace(/[\n\t]+/g, ' ');
  // Remove multiple consecutive spaces
  cleaned = cleaned.replace(/ +/g, ' ');
  // Trim leading/trailing whitespace
  return cleaned.trim();
}

export default cleanText;
