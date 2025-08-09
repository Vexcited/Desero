import { SchemaType } from "./type";

const enumeration = <T>(Enum: T): T[keyof T] => {
  const value = new SchemaType();
  value.enum = Enum;
  return value as any;
};

export { enumeration as enum };
