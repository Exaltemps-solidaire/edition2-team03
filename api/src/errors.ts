// The uniform error envelope (platform README contract):
// { "error": { "code": "...", "message": "...", "details": {...} } }

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(opts: { code: string; message: string; statusCode?: number; details?: Record<string, unknown> }) {
    super(opts.message);
    this.code = opts.code;
    this.statusCode = opts.statusCode ?? 400;
    this.details = opts.details;
  }
}
