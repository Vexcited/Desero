import { SchemaError } from "./errors/SchemaError";
import { getModelMetadata } from "./metadata";
import { SchemaType } from "./schema/type";

interface CompiledField {
  defaultValue?: (() => any) | any;
  deserializer?: (value: any, self: any) => any;
  key: string;
  rename?: string;
  schema: SchemaType;
}

interface CompiledModel {
  deserializer: (data: any) => any;
  fields: Array<CompiledField>;
  name: string;
  prototype: unknown;
}

type Ctor<T> = new (...args: any[]) => T;

const cache = new WeakMap<Ctor<any>, CompiledModel>();

interface Deserializer {
  body: string;
  helpers: {
    arrays: Record<string, unknown>;
    defaults: Record<string, unknown>;
    deserializers: Record<string, unknown>;
    references: Record<string, unknown>;
  };
}

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
  return getCompiledModel(Model).deserializer(data);
}

const decodeArray = (
  Model: CompiledModel,
  field: string,
  value: any,
  schema: SchemaType
): any => {
  if (!Array.isArray(value)) {
    throw new SchemaError(Model.name, field, `expected array but got "${typeof value}"`);
  }

  return value.map((item) => {
    if (schema.optional && item == null) {
      return null;
    }

    if (schema.array) {
      return decodeArray(Model, field, item, schema.array);
    }
    else if (schema.reference) {
      return deserialize(schema.reference, item);
    }

    return item;
  });
};

function generateDeserializerFunction(compiled: CompiledModel): Deserializer {
  let body = "const model=Object.create(prototype);";

  const helpers = {
    arrays: {} as Record<string, any>,
    defaults: {} as Record<string, any>,
    deserializers: {} as Record<string, any>,
    references: {} as Record<string, any>
  };

  for (const field of compiled.fields) {
    const { defaultValue, deserializer, key, rename, schema } = field;
    body += `let ${key}=data["${rename || key}"];`;

    if (defaultValue !== undefined) {
      helpers.defaults[key] = defaultValue;

      if (typeof defaultValue === "function") {
        body += `if(${key}==null)${key}=helpers.defaults["${key}"]();`;
      }
      else {
        body += `if(${key}==null)${key}=helpers.defaults["${key}"];`;
      }
    }
    else if (!schema.optional) {
      body += `if(${key}==null)throw new Error("${compiled.name}::${key}: not optional but got "+${key});`;
    }
    else {
      body += `if(${key}==null)${key}=null;`;
    }

    // Handle transformations (only for non-null values)
    if (deserializer) {
      helpers.deserializers[key] = deserializer;
      body += `if (${key}!==null)${key}=helpers.deserializers["${key}"](${key},model);`;
    }
    else if (schema.array) {
      helpers.arrays[key] = (value: any) =>
        decodeArray(compiled, key, value, schema.array!);
      body += `if(${key}!==null)${key}=helpers.arrays["${key}"](${key});`;
    }
    else if (schema.reference) {
      helpers.references[key] = (value: any) =>
        deserialize(schema.reference!, value);
      body += `if(${key}!==null)${key}=helpers.references["${key}"](${key});`;
    }

    body += `model["${key}"]=${key};`;
  }

  body += "return model";
  return { body, helpers };
}

function getCompiledModel<T extends Ctor<any>>(Model: T): CompiledModel {
  let compiled = cache.get(Model);
  if (compiled?.deserializer) return compiled;

  if (!compiled) {
    const instance = new Model();
    const metadata = new Map(getModelMetadata(instance).map((m) => [m.key, m] as const));

    const fields: Array<CompiledField> = [];
    for (const [key, schema] of Object.entries(instance)) {
      if (!(schema instanceof SchemaType)) continue;

      const info = metadata.get(key);
      fields.push({
        defaultValue: info?.defaultValue,
        deserializer: info?.deserializer,
        key,
        rename: info?.rename,
        schema
      });
    }

    compiled = {
      fields,
      name: Model.name,
      prototype: Model.prototype
    } as CompiledModel;
  }

  const { body, helpers } = generateDeserializerFunction(compiled);
  const fn = new Function("data", "prototype", "helpers", body);
  compiled.deserializer = (data: unknown) => fn(data, compiled.prototype, helpers);

  cache.set(Model, compiled);
  return compiled;
}
