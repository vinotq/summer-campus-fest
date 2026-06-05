import sharp from 'sharp';

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const AUDIO_MIMES = new Set(['audio/mpeg', 'audio/ogg', 'audio/wav']);

const MAGIC = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: 'audio/mpeg', bytes: [0xff, 0xfb] },
  { mime: 'audio/mpeg', bytes: [0xff, 0xf3] },
  { mime: 'audio/mpeg', bytes: [0x49, 0x44, 0x33] },   // ID3
  { mime: 'audio/ogg', bytes: [0x4f, 0x67, 0x67, 0x53] },
  { mime: 'audio/wav', bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function detectMime(buffer) {
  for (const { mime, bytes } of MAGIC) {
    if (bytes.every((b, i) => buffer[i] === b)) return mime;
  }
  return null;
}

export function isImageMime(mime) {
  return IMAGE_MIMES.has(mime);
}

export function isAudioMime(mime) {
  return AUDIO_MIMES.has(mime);
}

export async function processImage(buffer, originalMime) {
  const fmt = originalMime === 'image/png' ? 'png' : originalMime === 'image/webp' ? 'webp' : 'jpeg';
  const { data, info } = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .toFormat(fmt, { quality: 85 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height, format: fmt };
}

export function mimeToExt(mime) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
  };
  return map[mime] || 'bin';
}
