import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : '';

    this.logger.error(`Unhandled exception: ${message}`, stack);

    response.status(status).json({
      statusCode: status,
      message: process.env.NODE_ENV === 'test' ? message : 'Internal server error',
    });
  }
}
