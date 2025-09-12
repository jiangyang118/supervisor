import { LoggerService } from '@nestjs/common';
import { logInfo, logWarn, logError } from '../common/file-logger';
import { getTraceId } from '../common/trace';

export class AppLogger implements LoggerService {
  log(message: any, context?: string) {
    const tid = getTraceId();
    try { logInfo('nest.log', { message, context, traceId: tid }); } catch {}
    // Also print to stdout for dev visibility
    // eslint-disable-next-line no-console
    console.log(`[LOG]${context ? ' [' + context + ']' : ''}${tid ? ' [tid=' + tid + ']':''} ${message}`);
  }
  error(message: any, trace?: string, context?: string) {
    const tid = getTraceId();
    try { logError('nest.error', { message, trace, context, traceId: tid }); } catch {}
    // eslint-disable-next-line no-console
    console.error(`[ERR]${context ? ' [' + context + ']' : ''}${tid ? ' [tid=' + tid + ']':''} ${message}`);
    if (trace) console.error(trace);
  }
  warn(message: any, context?: string) {
    const tid = getTraceId();
    try { logWarn('nest.warn', { message, context, traceId: tid }); } catch {}
    // eslint-disable-next-line no-console
    console.warn(`[WRN]${context ? ' [' + context + ']' : ''}${tid ? ' [tid=' + tid + ']':''} ${message}`);
  }
  debug?(message: any, context?: string) {
    const tid = getTraceId();
    try { logInfo('nest.debug', { message, context, traceId: tid }); } catch {}
    // eslint-disable-next-line no-console
    console.debug?.(`[DBG]${context ? ' [' + context + ']' : ''}${tid ? ' [tid=' + tid + ']':''} ${message}`);
  }
  verbose?(message: any, context?: string) {
    const tid = getTraceId();
    try { logInfo('nest.verbose', { message, context, traceId: tid }); } catch {}
    // eslint-disable-next-line no-console
    console.debug?.(`[VRB]${context ? ' [' + context + ']' : ''}${tid ? ' [tid=' + tid + ']':''} ${message}`);
  }
}
