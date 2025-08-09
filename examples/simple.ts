import { deserialize, rename, t } from "../src";

class NestedModel {
  value = t.boolean();
}

class MyModel {
  id = t.number();

  @rename("user_name")
  name = t.string();

  @rename("nested_hehe")
  nested = t.reference(NestedModel);

  thisIsNeverGiven = t.option(t.string());

  sayHello(): void {
    console.log(`Hello, ${this.name} ; ID: ${this.id}`);
  }
}

const model = deserialize(MyModel, {
  id: 2,
  nested_hehe: {
    value: true
  },
  user_name: "Mikkel"
});

console.log(model);
model.sayHello();
