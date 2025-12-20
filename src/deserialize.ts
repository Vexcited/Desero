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
    SchemaError: typeof SchemaError;
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
  // mod = model
  // proto = prototype
  // _     = helpers
  // $     = data
  // $[i]  = model/data key/value
  //
  // We're doing this to prevent conflicting names.

  let body = "const mod=Object.create(proto);";

  const _ = {
    arrays: {} as Record<string, any>,
    defaults: {} as Record<string, any>,
    deserializers: {} as Record<string, any>,
    references: {} as Record<string, any>,
    SchemaError
  };

  for (let i = 0; i < compiled.fields.length; i++) {
    const {
      defaultValue,
      deserializer,
      key: unsafeFieldKey,
      rename: unsafeRenameFieldKey,
      schema
    } = compiled.fields[i];

    const varn = `$${i}`;
    const safeFieldKey = JSON.stringify(unsafeFieldKey);
    body += `let ${varn}=$[${unsafeRenameFieldKey ? JSON.stringify(unsafeRenameFieldKey) : safeFieldKey}];`;

    if (defaultValue !== undefined) {
      _.defaults[varn] = defaultValue;

      if (typeof defaultValue === "function") {
        body += `${varn}??=_.defaults.${varn}();`;
      }
      else {
        body += `${varn}??=_.defaults.${varn};`;
      }

      body += `if(${varn}===null)throw new _.SchemaError("${compiled.name}",${safeFieldKey},"default value cannot be null");`;

      if (schema.typeof) {
        body += `if(typeof ${varn}!=="${schema.typeof}")throw new _.SchemaError("${compiled.name}",${safeFieldKey},"default value has incorrect type, got \\""+typeof ${varn}+"\\" and expected \\"${schema.typeof}\\"");`;
      }

      if (schema.instanceof) {
        _.defaults[`${varn}$1`] = schema.instanceof;
        body += `if(!(${varn} instanceof _.defaults["${varn}$1"]))throw new _.SchemaError("${compiled.name}",${safeFieldKey},"default value is not an instance of \\"${schema.instanceof.name}\\"");`;
      }

      if (schema.enum) {
        _.defaults[`${varn}$2`] = Object.values(schema.enum);
        body += `if(!_.defaults.${varn}$2.includes(${varn}))throw new _.SchemaError("${compiled.name}",${safeFieldKey},\`default value (\${safe}) does not match any value of provided enum\`);`;
      }

      if (schema.reference) {
        body += `throw new _.SchemaError("${compiled.name}",${safeFieldKey},"default value is not allowed on reference fields (${safeFieldKey})");`;
      }
    }
    else if (!schema.optional) {
      body += `if(${varn}==null)throw new _.SchemaError("${compiled.name}",${safeFieldKey},\`not optional but got "\${${varn}}"\`);`;
    }
    else {
      body += `${varn}||=null;`;
    }

    // Handle transformations (only for non-null values)
    if (deserializer) {
      _.deserializers[varn] = deserializer;
      body += `if(${varn}!=null)${varn}=_.deserializers.${varn}(${varn},mod);`;
    }
    else if (schema.array) {
      _.arrays[varn] = (value: any) =>
        decodeArray(compiled, unsafeFieldKey, value, schema.array!);
      body += `if(${varn}!=null)${varn}=_.arrays.${varn}(${varn});`;
    }
    else if (schema.reference) {
      _.references[varn] = (value: any) =>
        deserialize(schema.reference!, value);
      body += `if(${varn}!=null)${varn}=_.references.${varn}(${varn});`;
    }

    body += `mod[${safeFieldKey}]=${varn};`;
  }

  body += "return mod";
  return { body, helpers: _ };
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
  const fn = new Function("$", "proto", "_", body);
  compiled.deserializer = (data: unknown) => fn(data, compiled.prototype, helpers);
  cache.set(Model, compiled);
  return compiled;
}
