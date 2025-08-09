import { type FieldMetadata, mutateModelMetadataField } from "../metadata";

export function deserializeWith(deserializer: NonNullable<FieldMetadata["deserializer"]>) {
  return function (clazz: any, field: string) {
    mutateModelMetadataField(clazz, field, (metadata) => {
      metadata.deserializer = deserializer;
    });
  };
}
