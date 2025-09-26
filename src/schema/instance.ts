import { SchemaType } from "./type";

export const instance = <T>(clazz?: new (...args: any[]) => T): T => {
  const value = new SchemaType();
  value.instanceof = clazz;
  return value as any;
};
