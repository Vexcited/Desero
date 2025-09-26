import { mutateModelMetadataField } from "../metadata";

export function defaultValue(value: (() => any) | any) {
  return function (clazz: any, field: string) {
    mutateModelMetadataField(clazz, field, (metadata) => {
      metadata.defaultValue = value;
    });
  };
}
