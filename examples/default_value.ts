import { defaultValue, deserialize, t } from "../src";

// We'll keep a counter aside.
let i = 0;

class MyModel {
  @defaultValue(() => new Date())
  createdAtInstance = t.instance(Date);

  @defaultValue(Date.now)
  createdAtTimestamp = t.number();

  creator = t.string();

  // You can do autoincrements with those!
  @defaultValue(() => ++i)
  id = t.number();

  // If you don't pass in functions, it'll keep the same value forever.
  @defaultValue("New World")
  worldName = t.string();
}

console.log(deserialize(MyModel, {
  creator: "Vexcited"
}));

// Let's run a timeout, to check the `@defaultValue(Date.now)`
// Could've done the same with `@defaultValue(() => new Date().getTime())`
setTimeout(() => {
  console.log(deserialize(MyModel, {
    creator: "Vexcited",
    worldName: "My Awesome World"
  }));
}, 2000);
