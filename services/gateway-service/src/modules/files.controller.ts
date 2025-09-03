import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  @Post('upload')
  upload(@Body() body: { filename: string; content: string }) {
    const safeName = (body?.filename || 'image').replace(/[^a-zA-Z0-9_.-]+/g, '_');
    // content 支持 dataURL 或 base64（或纯文本占位）
    const raw = String(body?.content || '');
    let buf: Buffer;
    let ext = path.extname(safeName).replace(/^\./, '') || 'jpg';
    const m = raw.match(/^data:([^;]+);base64,(.*)$/);
    if (m) {
      const mime = m[1];
      const b64 = m[2];
      buf = Buffer.from(b64, 'base64');
      // try to infer ext from mime
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
      };
      ext = extMap[mime] || ext || 'bin';
    } else if (/^[A-Za-z0-9+/=]+$/.test(raw)) {
      try { buf = Buffer.from(raw, 'base64'); } catch { buf = Buffer.from(raw); }
    } else {
      buf = Buffer.from(raw);
    }
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
    const base = path.basename(safeName, path.extname(safeName)) || 'image';
    const filename = `${Date.now()}-${base}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    writeFileSync(filePath, buf);
    // 返回可由同域访问的相对URL
    const url = `/files/view/${encodeURIComponent(filename)}`;
    return { url, filename };
  }

  @Get('view/:name')
  view(@Param('name') name: string, @Res() res: Response) {
    const safe = (name || '').replace(/[^a-zA-Z0-9_.-]+/g, '_');
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    const filePath = path.join(uploadsDir, safe);
    if (!existsSync(filePath)) {
      res.status(404).send('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    const buf = readFileSync(filePath);
    res.end(buf);
  }
}
