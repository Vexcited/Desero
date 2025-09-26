export interface FieldMetadata {
  /**
   * If the field is required but somehow the value we retrieve is `null`,
   * we use this default value, if provided.
   */
  defaultValue?: (() => any) | any;
  deserializer?: (value: any, self: InstanceType<any>) => any;
  enum?: any;
  key: string;
  /**
   * All fields are required by default, using `@optional` will
   * make the field optional by deserializers and serializers.
   */
  optional?: boolean;
  rename?: string;
}

export function getModelMetadata(clazz: any): Array<FieldMetadata> {
  return clazz.constructor._propertyMetadata || [];
}

export function getModelMetadataField(clazz: any, field: string): FieldMetadata | undefined {
  return getModelMetadata(clazz).find(
    (local: FieldMetadata) => local.key === field
  );
}

export function mutateModelMetadataField(clazz: any, field: string, mutation: (metadata: FieldMetadata) => void): void {
  if (!clazz.constructor._propertyMetadata) {
    clazz.constructor._propertyMetadata = [];
  }

  const metadata = getModelMetadataField(clazz, field);

  if (!metadata) {
    // Will update the locally created reference.
    const metadata = { key: field };
    mutation(metadata);

    // Then we'll push it to metadatas.
    clazz.constructor._propertyMetadata.push(metadata);
  }
  // Will update the reference.
  else mutation(metadata);
}
