import { LoggerService } from '@nestjs/common';
import { logInfo, logWarn, logError } from '../common/file-logger';

export class AppLogger implements LoggerService {
  log(message: any, context?: string) {
    try { logInfo('nest.log', { message, context }); } catch {}
    // Also print to stdout for dev visibility
    // eslint-disable-next-line no-console
    console.log(`[LOG]${context ? ' [' + context + ']' : ''} ${message}`);
  }
  error(message: any, trace?: string, context?: string) {
    try { logError('nest.error', { message, trace, context }); } catch {}
    // eslint-disable-next-line no-console
    console.error(`[ERR]${context ? ' [' + context + ']' : ''} ${message}`);
    if (trace) console.error(trace);
  }
  warn(message: any, context?: string) {
    try { logWarn('nest.warn', { message, context }); } catch {}
    // eslint-disable-next-line no-console
    console.warn(`[WRN]${context ? ' [' + context + ']' : ''} ${message}`);
  }
  debug?(message: any, context?: string) {
    try { logInfo('nest.debug', { message, context }); } catch {}
    // eslint-disable-next-line no-console
    console.debug?.(`[DBG]${context ? ' [' + context + ']' : ''} ${message}`);
  }
  verbose?(message: any, context?: string) {
    try { logInfo('nest.verbose', { message, context }); } catch {}
    // eslint-disable-next-line no-console
    console.debug?.(`[VRB]${context ? ' [' + context + ']' : ''} ${message}`);
  }
}

