import { SchemaType } from "./type";

export const number = (): number => new SchemaType() as any;
export const string = (): string => new SchemaType() as any;
export const boolean = (): boolean => new SchemaType() as any;
