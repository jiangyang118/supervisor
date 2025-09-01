import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

// Optional API key guard for ingestion endpoints.
// If process.env.INGEST_API_KEY is set, require header 'x-api-key' to match.
// If not set, allow all.
@Injectable()
export class RegulatorIngestApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const apiKey = process.env.INGEST_API_KEY;
    if (!apiKey) return true;
    const req = context.switchToHttp().getRequest();
    const provided = req.headers['x-api-key'] as string | undefined;
    if (provided && provided === apiKey) return true;
    throw new ForbiddenException('Invalid or missing API key');
  }
}

