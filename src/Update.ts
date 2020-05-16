import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

/**
 * Object passed into all Update.Resolver functions to support getting path and value aliases, appending
 * update conditions to SET, REMOVE, ADD and DELETE update arrays and provide context to the resolver function to
 * support advanced update resolvers.
 */
export class UpdateExpression implements Update.Expression {
  /**
   * Array of SET expressions.
   */
  setList: string[] = [];

  /**
   * Array of REMOVE expressions.
   */
  removeList: string[] = [];

  /**
   * Array of ADD expressions.
   */
  addList: string[] = [];

  /**
   * Array of DELETE expressions.
   */
  deleteList: string[] = [];

  /**
   * Object to support getting path and value aliases.
   */
  attributes: ExpressionAttributes;

  /**
   * Initialize UpdateExpression with existing or new {@link ExpressionAttributes}.
   * @param attributes Object used to get path and value aliases.
   */
  constructor(attributes = new ExpressionAttributes()) {
    this.attributes = attributes;
  }

  /**
   * @see ExpressionAttributes.addPath
   */
  addPath(name: string): string {
    return this.attributes.addPath(name);
  }

  /**
   * @see ExpressionAttributes.addValue
   */
  addValue(value: Table.AttributeValues): string {
    return this.attributes.addValue(value);
  }

  /**
   * Append a `SET` update expression.
   * @param value Expression to add to the `SET` array.
   */
  addSet(value: string): void {
    this.setList.push(value);
  }

  /**
   * Append a `REMOVE` update expression.
   * @param value Expression to add to the `REMOVE` array.
   */
  addRemove(value: string): void {
    this.removeList.push(value);
  }

  /**
   * Append an `ADD` update expression.
   * @param value Expression to add to the `ADD` array.
   */
  addAdd(value: string): void {
    this.addList.push(value);
  }

  /**
   * Append an `DELETE` update expression.
   * @param value Expression to add to the `DELETE` array.
   */
  addDelete(value: string): void {
    this.deleteList.push(value);
  }

  /**
   * Helper method to build an UpdateExpression string appending all of the expressions from the
   * lists that are not empty.
   * @return UpdateExpression based string.
   */
  buildExpression(): string | undefined {
    const updates = new Array<string>();
    if (this.setList.length > 0) updates.push(`SET ${this.setList.join(', ')}`);
    if (this.removeList.length > 0) updates.push(`REMOVE ${this.removeList.join(', ')}`);
    if (this.addList.length > 0) updates.push(`ADD ${this.addList.join(', ')}`);
    if (this.deleteList.length > 0) updates.push(`DELETE ${this.deleteList.join(', ')}`);
    return updates.length > 0 ? updates.join(' ') : undefined;
  }

  /**
   * Resets the update expression lists and attributes, used for building a new update expression.
   */
  reset(): void {
    this.setList = [];
    this.removeList = [];
    this.addList = [];
    this.deleteList = [];
    this.attributes.reset();
  }
}

/**
 * Set of helper methods used to build UpdateExpression for use in DynamoDB update method.
 *
 * @example Using Model
 * ```typescript
 * import { Fields, Model, Update } from 'dynamodb-datamodel';
 *
 * interface ModelKey {
 *   id: string;
 * }
 * interface ModelItem extends ModelKey {
 *   name: string;
 *   revision: number;
 * }
 *
 * const model = Model.createModel<ModelKey, ModelItem>({
 *   schema: {
 *     id: Fields.split({ aliases: ['P', 'S'] }),
 *     name: Fields.string(),
 *     nickName: Fields.string(),
 *     revision: Fields.number(),
 *   },
 *   // ...additional properties like table
 * });
 *
 * // update will: set name attribute to 'new name', delete nickName attribute and increment revision attribute by 2.
 * model.update({
 *   id: 'P-GUID.S-0',
 *   name: 'new name',
 *   nickName: Update.del(),
 *   revision: Update.inc(2),
 * });
 * ```
 *
 * @example Using Table (though in most cases you'll use Model)
 * ```typescript
 * import { Table, Update } from 'dynamodb-datamodel';
 *
 * interface Key {
 *   P: Table.PrimaryKey.PartitionString;
 *   S?: Table.PrimaryKey.SortString;
 * }
 *
 * const table = Table.createTable<Key>({
 *   name: 'TestTable',
 *   keyAttributes: {
 *     P: Table.PrimaryKey.StringType,
 *     S: Table.PrimaryKey.StringType,
 *   },
 *   keySchema: {
 *     P: Table.PrimaryKey.PartitionKeyType,
 *     S: Table.PrimaryKey.SortKeyType,
 *   },
 *   // ...additional properties like client, globalIndexes and others
 * });
 *
 * // update will: set name attribute to 'new name', delete nickName attribute and increment revision attribute by 2.
 * table.update(
 *   {P: 'P-GUID', S: 'S-0' },
 *   {
 *     name: 'new name',
 *     nickName: Update.del(),
 *     revision: Update.inc(2),
 *   }
 * );
 * ```
 */
export class Update {
  /**
   * Used to reference other attributes for the value argument in Update.* methods.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     fullName: Fields.string(),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets name attribute to the value of the fullName attribute
   * // Example: If fullName = 'John Smith', then name would be set to 'John Smith'
   * model.update({
   *   id: 'P-GUID.S-0',
   *   name: Update.path('fullName'),
   * });
   * ```
   * @param path Attribute path to resolve and get alias for.
   * @returns Update function that returns the alias for the path.
   */
  static path(path: string): Update.OperandFunction {
    return (name: string, exp: Update.Expression): string => exp.addPath(path);
  }

  /**
   * Used to reference other attributes for the value argument in Update.* methods.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     fullName: Fields.string(),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets name attribute to the value of the fullName attribute, if fullName
   * // attribute doesn't exists then set name attribute to 'User Name'.
   * model.update({
   *   id: 'P-GUID.S-0',
   *   name: Update.pathWithDefault('fullName', 'User Name'),
   * });
   * ```
   * @typeParam T Type of default value argument.
   * @param path Attribute path to resolve and get alias for.
   * @param value The default value to set if the path attribute value does not exist.
   * @returns Update function that returns the alias for the path.
   */
  static pathWithDefault<T extends Table.AttributeValues>(path: string, value: T): Update.OperandFunction {
    return (name: string, exp: Update.Expression): string =>
      `if_not_exists(${exp.addPath(path)}, ${exp.addValue(value)})`;
  }

  /**
   * Sets the default value for an attribute that does not exist in on the table item.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Set name attribute to 'Default Name' only if it doesn't exists
   * model.update({
   *   id: 'P-GUID.S-0',
   *   name: Update.default('Default Name'),
   * });
   * ```
   * @typeParam T Type of default value argument.
   * @param value Default value to set if attribute value does not exist.
   * @returns Update resolver function to set default value.
   */
  static default<T extends Table.AttributeValues>(value: T): Update.Resolver<Table.AttributeTypes> {
    return (name: string, exp: Update.Expression): void =>
      exp.addSet(`${name} = if_not_exists(${name}, ${exp.addValue(value)})`);
  }

  /**
   * Delete the attribute from the table item.  Setting an model property to null also deletes the attribute.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Deletes name attribute from item.  Could also use "name: null" to do the same thing.
   * model.update({
   *   id: 'P-GUID.S-0',
   *   name: Update.del(),
   * });
   * ```
   * @returns Update resolver function to delete attribute.
   */
  static del(): Update.Resolver<Table.AttributeTypes> {
    return (name: string, exp: Update.Expression): void => exp.addRemove(name);
  }

  /**
   * Sets the attribute to a new value.  Set is the default action for model property not set to a Update.Resolver<string> or null.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets name attribute from item.  Could also use "name: 'new name'" to do the same thing.
   * model.update({
   *   id: 'P-GUID.S-0',
   *   name: Update.set('new name'),
   * });
   * ```
   * @typeParam T Type of value argument to set.
   * @param value The value (or attribute reference) to update the item attribute to, will add attribute if not present.
   * @returns Update resolver function to set attribute to a value.
   */
  static set<T extends Table.AttributeValues>(
    value: T | Update.OperandFunction,
  ): Update.Resolver<Table.AttributeTypes> {
    return (name: string, exp: Update.Expression): void =>
      exp.addSet(`${name} = ${Update.addAnyValue(exp, value, name)}`);
  }

  /**
   * Sets an attribute to the result of an arithmetic expression.  Note: The reference attributes must exists
   * for the update to succeed.  Helper method used by {@link inc}, {@link dec}, {@link add} and {@link sub}.
   * @param left A value (or reference attribute) used on the left side of the arithmetic expression.
   * @param op Operation to use in arithmetic.
   * @param right A value (or reference attribute) used on the left side of the arithmetic expression.
   * @returns Update resolver function to set a number attribute to the result of the arithmetic expression.
   */
  static arithmetic(
    left: Update.OperandNumber | undefined,
    op: '+' | '-',
    right: Update.OperandNumber,
  ): Update.Resolver<'N'> {
    return (name: string, exp: Update.Expression): void => {
      const l = left !== undefined ? Update.addNonStringValue(exp, left, name) : name;
      const r = Update.addNonStringValue(exp, right, name);
      exp.addSet(`${name} = ${l} ${op} ${r}`);
    };
  }

  /**
   * Increments a number based attribute by a certain amount.  Note: The attribute that is being incremented
   * must exist in the table item for this update to succeed.
   * Supported types: number.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     count: Fields.number(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Increments the count attribute by 1
   * // Example: If count = 3, then after this update it would be 4
   * model.update({
   *   id: 'P-GUID.S-0',
   *   count: Update.inc(1),
   * });
   * ```
   * @param value A value (or reference attribute) to increment the number attribute by.
   * @returns Update resolver function to increment the attribute.
   */
  static inc(value: Update.OperandNumber): Update.Resolver<'N'> {
    return Update.arithmetic(undefined, '+', value);
  }

  /**
   * Decrements a number based attribute by a certain amount.  Note: The attribute that is being decremented
   * must exist in the table item for this update to succeed.
   * Supported types: number.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     count: Fields.number(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Decrements the count attribute by 2
   * // Example: if count = 5, then after this update it would be 3
   * model.update({
   *   id: 'P-GUID.S-0',
   *   count: Update.dec(2),
   * });
   * ```
   * @param value A value (or reference attribute) to decrement the number attribute by.
   * @returns Update resolver function to decrement the attribute.
   */
  static dec(value: Update.OperandNumber): Update.Resolver<'N'> {
    return Update.arithmetic(undefined, '-', value);
  }

  /**
   * Sets an attribute to the result of adding two values.  Note: The reference attributes must exists
   * for the update to succeed.
   * Supported types: number.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     base: Fields.number(),
   *     count: Fields.number(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets count attribute to the result of adding 3 to the 'base' attribute
   * // Example: If base = 5, then after this update count will be 8
   * model.update({
   *   id: 'P-GUID.S-0',
   *   count: Update.add('base', 3),
   * });
   * ```
   * @param left A value (or reference attribute) to using in add operation.
   * @param right A value (or reference attribute) to using in add operation.
   * @returns Update resolver function to set a number attribute to the result of adding two values.
   */
  static add(left: Update.OperandNumber, right: Update.OperandNumber): Update.Resolver<'N'> {
    return Update.arithmetic(left, '+', right);
  }

  /**
   * Sets an attribute to the result of subtracting two values.  Note: The reference attributes must exists
   * for the update to succeed.
   * Supported types: number.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     base: Fields.number(),
   *     count: Fields.number(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets count attribute to the result of subtracting 2 from the 'base' attribute
   * // Example: If base = 9, then after this update count would be 7
   * model.update({
   *   id: 'P-GUID.S-0',
   *   count: Update.sub('base', 2),
   * });
   * ```
   * @param left A value (or reference attribute) to use on the left side of a subtract operation.
   * @param right A value (or reference attribute) to use on the right side of a subtract operation.
   * @returns Update resolver function to set a number attribute to the result of subtracting two values.
   */
  static sub(left: Update.OperandNumber, right: Update.OperandNumber): Update.Resolver<'N'> {
    return Update.arithmetic(left, '-', right);
  }

  /**
   * Sets an attribute to the result of joining two lists.
   * Supported types: list.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     parents: Fields.list(),
   *     ancestors: Fields.list(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets ancestors attribute to the result of joining the list from the parents attribute with ['grandpa, 'grandma']
   * // Example: if parents = ['mom', 'dad'], then after this update ancestors will be ['mom', 'dad', 'grandpa', 'grandma']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   ancestors: Update.join('parents', ['grandpa', 'grandma']),
   * });
   * ```
   * @param left A list (or reference attribute) to add to the start.
   * @param right A list (or reference attribute) to add at the end.
   * @returns Update resolver function to set an attribute to the joining of two lists.
   */
  static join(left?: Update.OperandList, right?: Update.OperandList): Update.Resolver<'L'> {
    return (name: string, exp: Update.Expression): void => {
      const l = left !== undefined ? Update.addNonStringValue(exp, left, name) : name;
      const r = right !== undefined ? Update.addNonStringValue(exp, right, name) : name;
      exp.addSet(`${name} = list_append(${l}, ${r})`);
    };
  }
  /**
   * Appends items to the end of an existing list attribute.
   * Supported types: list.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     groups: Fields.list(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Appends 'soccer' and 'tennis' to the end of the list in groups attribute
   * // Example: If groups = ['baseball', 'swimming'], then after this update it would be ['baseball', 'swimming', 'soccer', 'tennis']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   groups: Update.append(['soccer', 'tennis']),
   * });
   * ```
   * @param value A list (or reference attribute) to append.
   * @returns Update resolver function to append a list to an attribute.
   */
  static append(value: Update.OperandList): Update.Resolver<'L'> {
    return Update.join(undefined, value);
  }

  /**
   * Prepends items to the beginning of an existing list attribute.
   * Supported types: list.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     groups: Fields.list(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Prepends 'soccer', 'tennis' to the beginning of the list in groups attribute
   * // Example: If groups = ['baseball', 'swimming'], then after this update it would be ['soccer', 'tennis', 'baseball', 'swimming']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   groups: Update.prepend(['soccer', 'tennis']),
   * });
   * ```
   * @param value A list (or reference attribute) to prepend.
   * @returns Update resolver function to prepend a list to an attribute.
   */
  static prepend(value: Update.OperandList): Update.Resolver<'L'> {
    return Update.join(value);
  }

  /**
   * Deletes an array of indices from an list based attribute (the lists are 0 based).
   * Supported types: list.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     children: Fields.list(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Removes the values at the 1st and 2nd index in the children attribute.
   * // Example: If children = ['john', 'jill', 'bob', 'betty'], then after this update children will be ['john', 'betty']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   children: Update.delIndexes([1, 2]);
   * });
   * ```
   * @param indexes Array of indices (numbered indexes into the list) to delete from the list.
   * @returns Update resolver function to delete indices in a list based attribute.
   */
  static delIndexes(indexes: number[]): Update.Resolver<'L'> {
    return (name: string, exp: Update.Expression): void => indexes.forEach((key) => exp.addRemove(`${name}[${key}]`));
  }

  /**
   * Sets the values of select indices for list based attribute.
   * Supported types: list.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     children: Fields.list(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets the values at the 1st and 2nd index in the children attribute to be 'margret' and 'mathew' respectively
   * // Example: If children = ['john', 'jill', 'bob', 'betty'], then after this update children will be ['john', 'margret', 'mathew', 'betty']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   children: Update.setIndexes({1: 'margret', 2: 'mathew'});
   * });
   * ```
   * @param indexes Map of indices with values to set in the list.
   * @returns Update resolver function to set values for select indices in a list based attribute.
   */
  static setIndexes(values: { [key: number]: Table.AttributeValues | Update.OperandFunction }): Update.Resolver<'L'> {
    return (name: string, exp: Update.Expression): void =>
      Object.keys(values).forEach((key) => {
        const value = values[Number(key)];
        // if (value === undefined) return;
        // if (value === null) exp.addRemove(`${name}[${key}]`);
        //else
        exp.addSet(`${name}[${key}] = ${Update.addAnyValue(exp, value, name)}`);
      });
  }

  /**
   * Adds an array of values to a set based attribute (sets are ordered).
   * Supported types: StringSet, NumberSet or BinarySet.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     colors: Fields.stringSet(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Adds 'yellow' and 'red' to the colors attribute
   * // Example: If colors = ['blue', 'yellow'], then after this update colors will be ['blue', 'red', 'yellow']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   colors: Update.addToSet(model.table.createStringSet(['yellow', 'red']));
   * });
   * ```
   * @param value Array of values to add.
   * @returns Update resolver function to add an array of values to a set based attribute.
   */
  static addToSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    return (name: string, exp: Update.Expression): void =>
      exp.addAdd(`${name} ${Update.addNonStringValue(exp, value, name)}`);
  }

  /**
   * Removes an array of values from a set based attribute (sets are ordered).
   * Supported types: StringSet, NumberSet or BinarySet.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     colors: Fields.stringSet(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Remove 'yellow' and 'red' from the colors attribute
   * // Example: If colors = ['blue', 'yellow'], then after this update colors will be ['blue']
   * model.update({
   *   id: 'P-GUID.S-0',
   *   colors: Update.removeFromSet(model.table.createStringSet(['yellow', 'red']));
   * });
   * ```
   * @param value Array of values to remove.
   * @returns Update resolver function to remove an array of values from a set based attribute.
   */
  static removeFromSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    return (name: string, exp: Update.Expression): void =>
      exp.addDelete(`${name} ${Update.addNonStringValue(exp, value, name)}`);
  }

  /**
   * Updates the inner attributes of a map based attribute.  {@link set} is used to overwrite the entire map attribute, while map updates the attributes
   * inside of table attribute.  Example if an address attribute is set to { street: 'One Infinite Loop', city: 'Cupertino', state: 'CA, zip: '95014' } then
   * using Update.map({street: '1 Apple Park Way'}) will result in { street: '1 Apple Park Way', city: 'Cupertino', state: 'CA, zip: '95014' }, while
   * using Update.set({street: '1 Apple Park Way'}) will result in {street: '1 Apple Park Way'}.
   * Supported types: map.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split({ aliases: ['P', 'S'] }),
   *     address: Fields.map(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Update only the street property inside of the address attribute
   * // Example: If address = { street: 'One Infinite Loop', city: 'Cupertino', state: 'CA, zip: '95014' } then
   * // after this update address will be { street: '1 Apple Park Way', city: 'Cupertino', state: 'CA, zip: '95014' }
   * model.update({
   *   id: 'P-GUID.S-0',
   *   address: Update.map({
   *     street: '1 Apple Park Way'
   *   });
   * });
   * ```
   * @param map Map of update values and resolvers to evaluate.
   * @returns Update resolver function to recursively set the inner attributes of a map based attribute.
   */
  static map(map: Update.ResolverMap): Update.Resolver<'M'> {
    return (name: string, exp: Update.Expression): void => {
      Update.resolveMap(name, map, exp);
    };
  }

  /**
   * Typed based version of {@link Update.map}.
   * @interface T
   */
  static model<T>(map: Update.ResolverObject<T>): Update.Resolver<'M'> {
    return Update.map(map);
  }

  /**
   *
   * @param map
   */
  static modelMap<T>(map: Update.ResolverObjectMap<T>): Update.Resolver<'M'> {
    return (name: string, exp: Update.Expression): void => {
      Object.keys(map).forEach((key) => {
        Update.resolveMap(`${name}.${exp.addPath(key)}`, map[key], exp);
      });
    };
  }

  // modelList setIndexes

  /**
   * Resolves each key of a map to an Update.Expression.
   * @param name Name alias of the parent attribute, prepends each key name
   * @param map Map of update values and resolvers to evaluate.
   * @param exp Object to get path and value aliases and store update array.
   */
  static resolveMap(name: string | null, map: Update.ResolverMap, exp: Update.Expression): void {
    Object.keys(map).forEach((key) => {
      const value = map[key];
      if (value === undefined) return;
      const path = name ? `${name}.${exp.addPath(key)}` : exp.addPath(key);
      if (typeof value === 'function') {
        const newValue = value(path, exp);
        if (newValue !== undefined) exp.addSet(`${path} = ${newValue}`);
      } else if (value === null) exp.addRemove(path);
      else exp.addSet(`${path} = ${exp.addValue(value)}`);
    });
  }

  /**
   * Helper method to add value or resolve value function to get back alias or resolved string.
   * To allow the value to reference a path, the value needs to be a resolver.
   * @param exp Object to get path and value aliases and store update array.
   * @param value Value to add or resolve.
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  static addAnyValue(
    exp: Update.Expression,
    value: Table.AttributeValues | Update.OperandFunction,
    name: string,
  ): string {
    return typeof value === 'function' ? value(name, exp) : exp.addValue(value);
  }

  /**
   * Helper method used in update methods that do not support string attributes, like add or sub.
   * This then allows string values to act as paths, without having to wrap the path in a resolver.
   * For strings based attributes, like set, need to use the path() function to wrap the path.
   * @param exp Object to get path and value aliases and store update array.
   * @param value The value, update resolver or path string to add and get back an alias.
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  static addNonStringValue(
    exp: Update.Expression,
    value: Table.AttributeValues | Update.OperandFunction,
    name: string,
  ): string {
    if (typeof value === 'string') return exp.addPath(value);
    return Update.addAnyValue(exp, value, name);
  }

  /**
   * Helper function that resolves the updateMap and returns an UpdateExpression to use in DocumentClient.update method calls.
   * @param updateMap Map of update values and resolvers to evaluate.
   * @param exp Used when calling update resolver function to store the names and values mappings and update expressions.
   * @returns Update expression to use in UpdateExpression for DocumentClient.update method calls.
   */
  static buildExpression(updateMap: Update.ResolverMap, exp: UpdateExpression): string | undefined {
    Update.resolveMap(null, updateMap, exp);
    return exp.buildExpression();
  }

  /**
   * Helper function to set a 'UpdateExpression' value on the params argument if there are update expressions to resolve.
   * @param updateMap Map of update values and resolvers to evaluate.
   * @param exp Used when calling update resolver function to store the names and values mappings and update expressions.
   * @param params Params used for DocumentClient update method.
   * @returns The params argument passed in.
   */
  static addParam(
    updateMap: Update.ResolverMap | undefined,
    exp: ExpressionAttributes,
    params: { UpdateExpression?: string },
  ): { UpdateExpression?: string } {
    if (updateMap) {
      const expression = Update.buildExpression(updateMap, new UpdateExpression(exp));
      if (expression) params.UpdateExpression = expression;
      else delete params.UpdateExpression;
    }
    return params;
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Update {
  /**
   * Expression object used in the update resolver to resolve the update into an expression.
   */
  export interface Expression {
    /**
     * @see ExpressionAttributes.addPath.
     */
    addPath(path: string): string;

    /**
     * @see ExpressionAttributes.addValue.
     */
    addValue(value: Table.AttributeValues): string;

    /**
     * Append a `SET` update expression.
     * @param value Expression to add to the `SET` array.
     */
    addSet(value: string): void;

    /**
     * Append a `REMOVE` update expression.
     * @param value Expression to add to the `REMOVE` array.
     */
    addRemove(value: string): void;

    /**
     * Append an `ADD` update expression.
     * @param value Expression to add to the `ADD` array.
     */
    addAdd(value: string): void;

    /**
     * Append an `DELETE` update expression.
     * @param value Expression to add to the `DELETE` array.
     */
    addDelete(value: string): void;
  }

  /**
   * Resolver function is return by most of the above key Update methods.  Returning a function allows table item updates
   * to easily be composable and extensible.  This allows consumers to create higher level table item update that are composed
   * of the primitive update expressions or support any new primitives that AWS would add in the future.
   * @typeParam T The type used for the value param.
   * @param name Name of the item attribute to resolve.
   * @param exp Object to get path and value aliases and store update array.
   * @param type Param to enforce type safety for update that only work on certain types.
   */
  export type Resolver<T> = (name: string, exp: Update.Expression, type?: T) => void;

  /**
   * Type used for generic map based update methods.
   * @typeParam T The model interface.
   */
  export type ResolverMapT<T> = {
    [key: string]: T | Resolver<Table.AttributeTypes> | undefined;
  };

  /**
   * Type used for map based update methods.
   */
  export type ResolverMap = ResolverMapT<Table.AttributeValues>;

  /**
   *
   */
  export type ResolverObjectValue<T> = Extract<T, Table.AttributeValues | Update.Resolver<Table.AttributeTypes>> | null;

  /**
   *
   */
  export type ResolverObject<T> = {
    [P in keyof Table.Optional<T>]: ResolverObjectValue<T[P]>;
  };

  /**
   *
   */
  export type ResolverObjectMap<T> = {
    [key: string]: Update.ResolverObject<T>;
  };

  /**
   * Update function return by path and pathWithDefault to support nested resolvers.
   * @param name Name of the item attribute to resolve.
   * @param exp Object to get path and value aliases and store update array.
   * @returns The resolved value of the update function.
   */
  export type OperandFunction = (name: string, exp: Update.Expression) => string;

  /**
   * Type used for number based update methods.
   */
  export type OperandNumber = number | string | OperandFunction;

  /**
   * Type used for generic list based update methods.
   */
  export type OperandList<T extends Table.AttributeValues = Table.AttributeValues> = string | OperandFunction | T[];

  /**
   * String specific update resolver, used to define properties in Model interfaces.
   */
  export type String = string | Update.Resolver<'S'>;

  /**
   * Number specific update resolver, used to define properties in Model interfaces.
   */
  export type Number = number | Update.Resolver<'N'>;

  /**
   * Binary specific update resolver, used to define properties in Model interfaces.
   */
  export type Binary = Table.BinaryValue | Update.Resolver<'B'>;

  /**
   * Boolean specific update resolver, used to define properties in Model interfaces.
   */
  export type Boolean = boolean | Update.Resolver<'BOOL'>;

  /**
   * Null specific update resolver, used to define properties in Model interfaces.
   */
  export type Null = null | Update.Resolver<'NULL'>;

  /**
   * String Set specific update resolver, used to define properties in Model interfaces.
   */
  export type StringSet = Table.StringSetValue | Update.Resolver<'SS'>;

  /**
   * Number Set specific update resolver, used to define properties in Model interfaces.
   */
  export type NumberSet = Table.NumberSetValue | Update.Resolver<'NS'>;

  /**
   * Binary Set specific update resolver, used to define properties in Model interfaces.
   */
  export type BinarySet = Table.BinarySetValue | Update.Resolver<'BS'>;

  /**
   * List specific update resolver, used to define properties in Model interfaces.
   */
  export type List<T extends Table.AttributeValues = Table.AttributeValues> = T[] | Update.Resolver<'L'>;

  /**
   * Map specific update resolver, used to define properties in Model interfaces.
   */
  export type Map<T extends Table.AttributeValues = Table.AttributeValues> =
    | { [key: string]: T }
    | Update.Resolver<'M'>;

  /**
   * Map specific update resolver, used to define properties in Model interfaces.
   */
  export type Model<T> = T | Update.Resolver<'M'>;

  /**
   * Map specific update resolver, used to define properties in Model interfaces.
   */
  export type ModelMap<T> = { [key: string]: T } | Update.Resolver<'M'>;

  /**
   * List specific update resolver, used to define properties in Model interfaces.
   */
  export type ModelList<T> = T[] | Update.Resolver<'L'>;
}
