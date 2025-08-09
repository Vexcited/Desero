import { mutateModelMetadataField } from "../metadata";

export function rename(name: string) {
  return function (clazz: any, field: string) {
    mutateModelMetadataField(clazz, field, (metadata) => {
      metadata.rename = name;
    });
  };
}
