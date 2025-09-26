export class SchemaType {
  array?: SchemaType;
  enum?: any;
  instanceof?: any;
  optional = false;
  reference?: new (...args: any[]) => any;
  typeof?: "boolean" | "number" | "string";
}
