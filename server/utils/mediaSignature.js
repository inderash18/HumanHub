export function matchesMediaType(bytes, mime) {
  const hex = bytes.toString('hex');
  if (mime === 'image/jpeg') return hex.startsWith('ffd8ff');
  if (mime === 'image/png') return hex.startsWith('89504e470d0a1a0a');
  if (mime === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'video/webm') return hex.startsWith('1a45dfa3');
  if (['video/mp4', 'video/quicktime'].includes(mime)) {
    return bytes.toString('ascii', 4, 8) === 'ftyp';
  }
  return false;
}
