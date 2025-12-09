import { SchemaError } from "./errors/SchemaError";
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

  for (const [field, schema] of Object.entries(model)) {
    if (!(schema instanceof SchemaType)) continue;

    const info = metadata.find((local) => local.key === field);
    let value = data[field];

    if (info?.rename) {
      value = data[info.rename];
    }

    if (value === null || value === undefined) {
      // `@defaultValue`
      if (info?.defaultValue !== undefined) {
        if (typeof info.defaultValue === "function") {
          value = info.defaultValue();
        }
        else value = info.defaultValue;

        if (value === null) {
          throw new SchemaError(Model.name, field, `default value cannot be "null"`);
        }
        else if (schema.typeof && typeof value !== schema.typeof) {
          throw new SchemaError(Model.name, field, `default value has incorrect type, got "${typeof value}" and expected "${schema.typeof}"`);
        }
        else if (schema.instanceof && !(value instanceof schema.instanceof)) {
          throw new SchemaError(Model.name, field, `default value is not an instance of "${schema.instanceof.name}"`);
        }
        else if (schema.enum && !Object.values(schema.enum).includes(value)) {
          throw new SchemaError(Model.name, field, `default value (${value}) does not match any value of provided enum`);
        }
        else if (schema.reference) {
          throw new SchemaError(Model.name, field, `default value is not allowed on reference fields ("${field}")`);
        }
      }
      // `t.option(...)`
      else if (!schema.optional) {
        throw new SchemaError(Model.name, field, `not optional but got "${value}"`);
      }
      else {
        value = null;
      }
    }

    if (value !== null) {
      // `@deserializeWith`
      if (info?.deserializer) {
        value = info.deserializer(value, model);
      }

      // `t.array(...)`
      else if (schema.array) {
        const processArray = (value: any, schema: SchemaType): any => {
          if (!Array.isArray(value)) {
            throw new SchemaError(Model.name, field, `expected array but got "${typeof value}"`);
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
      // `t.reference(model)
      else if (schema.reference) {
        value = deserialize(schema.reference, value);
      }
    }

    model[field] = value;
  }

  return model;
}
