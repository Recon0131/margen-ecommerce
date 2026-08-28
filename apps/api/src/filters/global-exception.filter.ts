import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const correlationId = (request as any).correlationId ?? '';

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const isHttp = exception instanceof HttpException;
    const httpResponse = isHttp ? exception.getResponse() : null;

    let code: string;
    let message: string;

    if (httpResponse && typeof httpResponse === 'object' && httpResponse !== null) {
      const body = httpResponse as Record<string, unknown>;
      code = typeof body.code === 'string' ? body.code : 'HTTP_ERROR';
      message = typeof body.message === 'string' ? body.message : 'Request failed';
    } else {
      code = status >= 500 ? 'INTERNAL_ERROR' : 'HTTP_ERROR';
      message = status >= 500 ? 'Internal server error' : 'Request failed';
    }

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : '';
      this.logger.error(
        `Unhandled exception [${correlationId}]: ${exception instanceof Error ? exception.message : String(exception)}`,
        stack,
      );
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      correlationId,
    });
  }
}
