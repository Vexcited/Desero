import { getModelMetadata } from "./metadata";
import { SchemaType } from "./schema/type";

/**
 * Deserialize an object {@link data} into your a given {@link Model}.
 *
 * @param Model Destination model you want to deserialize to.
 * @param data Original object, could be anything as long as it matches your model schema.
 *
 * @example
 * class MyModel {
 *   \@rename("who")
 *   hello = t.string()
 * }
 *
 * const model = deserialize(MyModel, {
 *   who: "world"
 * });
 *
 * console.log(model.hello) // "world"
 */
export function deserialize<T extends new (...args: any[]) => any>(Model: T, data: any): InstanceType<T> {
  const model = new Model();
  const metadata = getModelMetadata(model);

  // Define all fields properly.
  for (const [field, schema] of Object.entries(model)) {
    if (!(schema instanceof SchemaType)) continue;

    const info = metadata.find((local) => local.key === field);
    let value = data[field];

    if (info?.rename) {
      value = data[info.rename];
    }

    if (value === null || value === undefined) {
      if (!schema.optional) {
        throw new Error(`required field "${field}" is undefined in provided data`);
      }

      value = null;
    }

    if (value !== null) {
      // 1. `@deserializeWith`
      if (info?.deserializer) {
        value = info.deserializer(value, model);
      }

      // 2. `t.array(...)`
      else if (schema.array) {
        const processArray = (value: any, schema: SchemaType): any => {
          if (!Array.isArray(value)) {
            throw new Error(`expected array but got "${typeof value}"`);
          }

          return value.map((item) => {
            // handle null / undefined items in optional arrays
            if ((item === null || item === undefined) && schema.optional) {
              return null;
            }

            // nested array: recursively process
            if (schema.array) {
              return processArray(item, schema.array);
            }
            // array of objects: decode each item
            else if (schema.reference) {
              return deserialize(schema.reference, item);
            }
            // primitive or enum array: return item as-is
            else {
              return item;
            }
          });
        };

        value = processArray(value, schema.array);
      }
      // 3. `t.reference(model)
      else if (schema.reference) {
        value = deserialize(schema.reference, value);
      }
    }

    model[field] = value;
  }

  return model;
}
