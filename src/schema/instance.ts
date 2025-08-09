import { SchemaType } from "./type";

export const instance = <T>(): T => new SchemaType() as T;
