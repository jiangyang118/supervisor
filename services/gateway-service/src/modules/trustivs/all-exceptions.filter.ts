import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { getTraceId } from '../../common/trace';
import { StdResponse } from './std-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception?.message || (exception?.response?.message as any) || 'Internal Server Error';
    const body: StdResponse = { code: '0', message: String(message) };
    try { const tid = (req && (req.traceId as string)) || getTraceId(); if (tid) res.setHeader('X-Trace-Id', tid); } catch {}
    res.status(status).json(body);
  }
}
