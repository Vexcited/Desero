import { SchemaType } from "./type";

export const array = <T>(inner: T): Array<T> => {
  const value = new SchemaType();
  value.array = inner as SchemaType;
  return value as any;
};
