import { deserialize, rename, t } from "../src";

class RepeatedModel {
  value = t.boolean();
}

class MyModel {
  @rename("arr_arr_arr_str")
  arrArrArrStr = t.array(t.array(t.array(t.string())));

  @rename("arr_arr_ref")
  arrArrRef = t.array(t.array(t.reference(RepeatedModel)));

  @rename("arr_opt_ref")
  arrOptRef = t.array(t.option(t.reference(RepeatedModel)));
}

const model = deserialize(MyModel, {
  arr_arr_arr_str: [
    [
      [
        "hello",
        "world"
      ]
    ]
  ],

  arr_arr_ref: [
    [
      { value: false },
      { value: true }
    ]
  ],

  arr_opt_ref: [
    { value: false },
    void 0,
    { value: true }
  ]
});

console.dir(model, { depth: Infinity });
