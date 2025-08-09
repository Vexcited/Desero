import { deserialize, deserializeWith, rename, t, u } from "../src";

/// Values are what the API actually returns.
/// Serde in Rust would've done this like this:
///
/// #[derive(Serialize, Deserialize)]
/// enum MyEnum {
///   #[serde(rename = "hello")]
///   Value1,
///   #[serde(rename = "world")]
///   Value2,
/// }
///
/// Sadly, we can't have decorators in TS' enums.
/// Also, it's not an issue if you use a `@deserializeWith`
/// in pair with a `t.enum(MyEnum)` since it does barely nothing.
enum MyEnum {
  Value1 = "hello",
  Value2 = "world"
}

class MyModel {
  @deserializeWith(u.pick("value"))
  @rename("inner-enum")
  values = t.array(t.enum(MyEnum));

  get keys(): string[] {
    const valueToKey = Object.fromEntries(
      Object.entries(MyEnum).map(([key, value]) => [value, key])
    );

    return this.values.map((value) => valueToKey[value]!);
  }
}

const model = deserialize(MyModel, {
  "inner-enum": [
    { value: "hello" },
    { value: "world" }
  ]
});

/// The only difference with Rust is that the value logged
/// is not the enum key, it's the enum value.
console.log(model.values);

/// If you want to match the behavior with Rust.
console.log(model.keys);
