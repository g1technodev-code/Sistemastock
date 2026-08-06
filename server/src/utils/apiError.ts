export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "No autenticado") {
    return new ApiError(401, message);
  }

  static forbidden(message = "No tienes permisos para esta acción") {
    return new ApiError(403, message);
  }

  static notFound(message = "Recurso no encontrado") {
    return new ApiError(404, message);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, details);
  }

  static tooManyRequests(message = "Demasiadas solicitudes, por favor reintente más tarde") {
    return new ApiError(429, message);
  }
}
