export class FunQAError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "FunQAError";
  }
}

export class PipelineError extends FunQAError {
  constructor(message: string, cause?: unknown) {
    super("pipeline_error", message, cause);
    this.name = "PipelineError";
  }
}

export class AuthError extends FunQAError {
  constructor(message: string, cause?: unknown) {
    super("auth_error", message, cause);
    this.name = "AuthError";
  }
}
