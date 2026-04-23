import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorResponse = {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      message: exception instanceof Error ? exception.message : 'Internal server error',
    };

    response.status(500).json(errorResponse);
  }
}
