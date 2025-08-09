export interface FieldMetadata {
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

export function mutateModelMetadataField(clazz: any, field: string, mutation: (metadata: FieldMetadata) => void): void {
  if (!clazz.constructor._propertyMetadata) {
    clazz.constructor._propertyMetadata = [];
  }

  const metadata = clazz.constructor._propertyMetadata.find(
    (local: FieldMetadata) => local.key === field
  ) as FieldMetadata | undefined;

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
