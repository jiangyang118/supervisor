import { Controller, Post, Body } from '@nestjs/common';

@Controller('files')
export class FilesController {
  @Post('upload')
  upload(@Body() body: { filename: string; content: string }) {
    // 简化实现：不真实存储文件，返回一个伪造的可访问URL
    const name = (body?.filename || 'image').replace(/[^a-zA-Z0-9_.-]+/g, '_');
    const url = `https://example.com/uploads/${Date.now()}-${name}`;
    return { url };
  }
}
