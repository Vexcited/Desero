import { SchemaType } from "./type";

export const reference = <T extends new (...args: any[]) => any>(Model: T): InstanceType<T> => {
  const value = new SchemaType();
  value.reference = Model;

  return value as InstanceType<T>;
};
