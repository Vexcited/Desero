export class SchemaError extends Error {
  public constructor(public model: string, public field: string, message: string) {
    super(`${model}::${field} -> ${message}`);
    this.name = "SchemaError";
  }
}
