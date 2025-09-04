import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import fetch from 'node-fetch';
import { URL } from 'url';

function contentTypeFrom(url: string) {
  const u = url.split('?')[0].toLowerCase();
  if (u.endsWith('.m3u8')) return 'application/vnd.apple.mpegurl';
  if (u.endsWith('.ts')) return 'video/mp2t';
  if (u.endsWith('.aac')) return 'audio/aac';
  if (u.endsWith('.mp4')) return 'video/mp4';
  if (u.endsWith('.mp3')) return 'audio/mpeg';
  return 'application/octet-stream';
}

function isAbsolute(href: string) {
  return /^https?:\/\//i.test(href);
}

function resolveUrl(base: string, ref: string) {
  try { return new URL(ref, base).toString(); } catch { return ref; }
}

@Controller()
export class TrustivsProxyController {
  @Get('trustivs/proxy/hls')
  @Header('Access-Control-Allow-Origin', '*')
  async proxyHls(@Query('url') url: string, @Res() res: Response) {
    if (!url) return res.status(400).json({ code: '0', message: 'missing url' });
    const target = url;
    try {
      const upstream = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0' } as any });
      const buf = await upstream.buffer();
      const ct = contentTypeFrom(target);
      res.setHeader('Content-Type', ct);
      res.setHeader('Access-Control-Allow-Origin', '*');
      // If M3U8, rewrite segment/key URIs to point back to this proxy
      if (/(m3u8|mpegurl)/i.test(ct)) {
        const text = buf.toString('utf-8');
        const base = target;
        const lines = text.split(/\r?\n/);
        const out: string[] = [];
        for (const line of lines) {
          if (!line || line.startsWith('#')) {
            // handle EXT-X-KEY URI rewriting
            if (/^#EXT-X-KEY/i.test(line) && /URI="([^"]+)"/i.test(line)) {
              const uri = line.match(/URI="([^"]+)"/i)![1];
              const abs = isAbsolute(uri) ? uri : resolveUrl(base, uri);
              const proxied = `/trustivs/proxy/hls?url=${encodeURIComponent(abs)}`;
              out.push(line.replace(/URI="([^"]+)"/i, `URI="${proxied}"`));
            } else {
              out.push(line);
            }
          } else {
            const abs = isAbsolute(line) ? line : resolveUrl(base, line);
            out.push(`/trustivs/proxy/hls?url=${encodeURIComponent(abs)}`);
          }
        }
        return res.send(out.join('\n'));
      }
      return res.send(buf);
    } catch (e: any) {
      return res.status(502).json({ code: '0', message: e?.message || 'proxy failed' });
    }
  }
}
