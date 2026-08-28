import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Centralized error handler registered on the Fastify instance in app.ts.
 * Keeps route handlers free of try/catch boilerplate and makes sure we
 * never leak internals (stack traces, DB errors) to the client.
 */
export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Dữ liệu gửi lên không hợp lệ.",
      issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }

  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({ error: error.code, message: error.message });
  }

  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode && fastifyError.statusCode < 500) {
    return reply.status(fastifyError.statusCode).send({
      error: fastifyError.code ?? "BAD_REQUEST",
      message: fastifyError.message,
    });
  }

  request.log.error(error);
  return reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: "Đã có lỗi xảy ra ở server.",
  });
}
