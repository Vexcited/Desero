import type { SchemaType } from "./type";

export const option = <T>(value: T): null | T => {
  (value as SchemaType).optional = true;
  return value;
};
