# Desero

Quickly write models to deserialize an object to another.

## Installation

```sh
bun add desero
```

## Usage

```typescript
import { t, deserialize } from "desero";

class MyModel {
  public id = t.string();
}

const data = deserialize(MyModel, { id: "hello world" })
//    ^ { id: "hello world" }
```

You can find more examples in the [`examples` directory](./examples/).

## Recipes

### Use `@rename` to rebind properties

```typescript
import { t, rename, deserialize } from "desero";

class MyModel {
  @rename("L")
  public label = t.string();
}

const data = deserialize(MyModel, { L: "hello world" });
data.label // = "hello world";
```
