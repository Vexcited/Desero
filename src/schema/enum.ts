import { SchemaType } from "./type";

const enumeration = <T>(Enum: T): {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K]
}[keyof T] => {
  const value = new SchemaType();
  value.enum = Enum;
  return value as any;
};

export { enumeration as enum };
