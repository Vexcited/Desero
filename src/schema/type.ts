export class SchemaType {
  array?: SchemaType;
  enum?: any;
  optional = false;
  reference?: new (...args: any[]) => any;
}
