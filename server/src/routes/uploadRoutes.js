import path from 'path';
import { writeFile, rename, mkdir } from 'fs/promises';
import { requireAdmin } from '../auth/adminAuth.js';
import { detectMime, isImageMime, isAudioMime, processImage, mimeToExt } from '../utils/image.js';
import * as uploadsRepo from '../db/repo/uploads.js';
import { generateId } from '../utils/ids.js';
import { config } from '../config.js';

export async function uploadRoutes(fastify) {
  fastify.post('/api/admin/uploads', { preHandler: requireAdmin }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.code(400).send({ error: 'validation', message: 'Файл не найден' });
    }

    const chunks = [];
    let totalSize = 0;
    for await (const chunk of data.file) {
      totalSize += chunk.length;
      if (totalSize > config.uploadMaxBytes) {
        return reply.code(413).send({ error: 'validation', message: `Файл превышает ${config.uploadMaxBytes} байт` });
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const detectedMime = detectMime(buffer) ?? data.mimetype;
    const clientMime = data.mimetype;

    // Validate that detected magic matches claimed MIME category
    const isImage = isImageMime(detectedMime) && isImageMime(clientMime);
    const isAudio = isAudioMime(detectedMime) || isAudioMime(clientMime);

    if (!isImage && !isAudio) {
      return reply.code(400).send({
        error: 'validation',
        message: 'Допустимые форматы: jpeg/png/webp, mp3/ogg/wav',
      });
    }

    await mkdir(config.uploadsDir, { recursive: true });

    let finalBuffer = buffer;
    let width, height;
    let mime = clientMime;

    if (isImage) {
      try {
        const processed = await processImage(buffer, clientMime);
        finalBuffer = processed.buffer;
        width = processed.width;
        height = processed.height;
        mime = `image/${processed.format}`;
      } catch {
        return reply.code(400).send({ error: 'validation', message: 'Не удалось обработать изображение' });
      }
    }

    const ext = mimeToExt(mime);
    const filename = `${generateId()}.${ext}`;
    const tmpPath = path.join(config.uploadsDir, `${filename}.tmp`);
    const finalPath = path.join(config.uploadsDir, filename);

    await writeFile(tmpPath, finalBuffer);
    await rename(tmpPath, finalPath);

    uploadsRepo.insert({ filename, mime, size: finalBuffer.length, width, height });

    return reply.code(201).send({
      filename,
      url: `/uploads/${filename}`,
      mime,
      size: finalBuffer.length,
      width: width ?? null,
      height: height ?? null,
    });
  });
}
