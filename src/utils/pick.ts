/**
 * Let's say you have the following JSON
 * ```json
 * [ { name: "hello" }, { name: "world" } ]
 * ```
 * and you want to make an array with only the `name` property.
 *
 * You can use this `pick` function which takes a string for the
 * property to pick.
 *
 * @example
 * class Model {
 *   \@deserializeWith(u.pick("name"))
 *   names = t.array(t.string());
 * }
 *
 * const model = deserialize(Model, {
 *   names: [ { name: "hello" }, { name: "world" } ]
 * });
 *
 * console.log(model.names); // ["hello", "world"]
 */
export const pick = (item: string) => (arr: Array<any>) => arr.map((local) => local[item]);
