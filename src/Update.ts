import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { ExpressionAttributes } from './ExpressionAttributes';
import { Table } from './Table';

/**
 * Object passed into all Update.Resolver functions to support getting path and value aliases, appending
 * update conditions to SET, REMOVE, ADD and DELETE update arrays and provide context to the resolver function to
 * support advanced update resolvers.
 */
export class UpdateExpression {
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

  // Any
  /**
   * Helper function to add a simple set expression to the set list.
   * @param name Alias for attribute name.
   * @param value Alias for attribute value.
   */
  set(name: string, value: string): void {
    this.setList.push(`${name} = ${value}`);
  }

  /**
   * Helper function to add a remove expression to the remove list.
   * @param name Alias for attribute name.
   */
  del(name: string): void {
    this.removeList.push(name);
  }

  // Number UpdateNumberValue
  /**
   * Helper function to add two values and set the result on name.
   * @param name Alias for attribute name.
   * @param left Alias for attribute value, that is on the left side of the add operator.
   * @param right Alias for attribute value, that is on the right side of the add operator.
   */
  add(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${left} + ${right}`);
  }

  /**
   * Helper function to subtract two values and set the result on name.
   * @param name Alias for attribute name.
   * @param left Alias for attribute value, that is on the left side of the add operator.
   * @param right Alias for attribute value, that is on the right side of the add operator.
   */
  sub(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${left} - ${right}`);
  }

  /**
   * Helper function to increment an attribute by an amount specified by value.
   * @param name Alias for attribute name.
   * @param value Alias for attribute value that is added to the name attribute.
   */
  inc(name: string, value: string): void {
    this.add(name, name, value);
  }

  /**
   * Helper function to decrement an attribute by an amount specified by value.
   * @param name Alias for attribute name.
   * @param value Alias for attribute value that is subtracted from the name attribute.
   */
  dec(name: string, value: string): void {
    this.sub(name, name, value);
  }

  // List
  /**
   * Helper function to append an item to the end of a list attribute.
   * @param name Alias for attribute name.
   * @param value Alias for list value to append to attribute.
   */
  append(name: string, value: string): void {
    this.join(name, name, value);
  }

  /**
   * Helper function to prepend an item to the beginning of a list attribute.
   * @param name Alias for attribute name.
   * @param value Alias for list value to append to attribute.
   */
  prepend(name: string, value: string): void {
    this.join(name, value, name);
  }

  /**
   * Helper function to join two list attributes or values.
   * @param name Alias for attribute name.
   * @param left Alias for list value to begin with.
   * @param right Alias for list value to end with.
   */
  join(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${this.listAppend(left, right)}`);
  }

  /**
   * Helper function to delete certain indices fom the list.
   * @param name Alias for attribute name.
   * @param indexes Array of indices to delete from the list.
   */
  delIndexes(name: string, indexes: number[]): void {
    indexes.forEach((index) => {
      this.removeList.push(`${name}[${index}]`);
    });
  }

  /**
   * Helper function to overwrite the value of certain indices in the list.
   * @param name Alias for attribute name.
   * @param values Map of indices with aliased values to overwrite in the list.
   */
  setIndexes(name: string, values: { [index: number]: string }): void {
    Object.keys(values).forEach((key) => {
      this.setList.push(`${name}[${key}] = ${values[Number(key)]}`);
    });
  }

  // Set
  /**
   * Helper function to add values to a set.
   * @param name Alias for attribute name.
   * @param value Alias for the value to add to the set.
   */
  addToSet(name: string, value: string): void {
    this.addList.push(`${name} ${value}`);
  }

  /**
   * Helper function to delete values from a set.
   * @param name Alias for attribute name.
   * @param value Alias for the value to delete from the set.
   */
  removeFromSet(name: string, value: string): void {
    this.deleteList.push(`${name} ${value}`);
  }

  /**
   * Helper function that returns the expression for if_not_exists.
   * @param name Alias for attribute name.
   * @param value Alias for the value that will be used if attribute doesn't exist.
   *  @return Update expression condition.
   */
  ifNotExist(name: string, value: Table.AttributeValues): string {
    return `if_not_exists(${name}, ${value})`;
  }

  /**
   * Helper function that returns the expression for list_append.
   * @param left Alias for attribute value .
   * @param left Alias for list value to begin with.
   * @param right Alias for list value to end with.
   * @return Update expression condition.
   */
  listAppend(left: string, right: string): string {
    return `list_append(${left}, ${right})`;
  }

  /**
   * @see ExpressionAttributes.getPaths
   */
  getPaths(): ExpressionAttributeNameMap {
    return this.attributes.getPaths();
  }

  /**
   * @see ExpressionAttributes.getValues
   */
  getValues(): Table.AttributeValuesMap {
    return this.attributes.getValues();
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
   * Add value or resolve value function to get back alias or resolved string.  To allow the value to
   * reference a path, the value needs to be a resolver.
   * @param value Value to add or resolve.
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  addAnyValue(value: Table.AttributeValues | Update.UpdateFunction, name: string): string {
    return typeof value === 'function' ? value(name, this) : this.addValue(value);
  }

  /**
   * Helper method used in update methods that do not support string attributes, like add or sub.
   * This then allows string values to act as paths, without having to wrap the path in a resolver.
   * @param value The value, update resolver or path string to add and get back an alias
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  addNonStringValue(value: Table.AttributeValues | Update.UpdateFunction, name: string): string {
    if (typeof value === 'function') return value(name, this); // type?: 'string'
    // For non-string values we allow strings to specify paths, for strings paths need to
    // use the path() function to wrap the path
    if (typeof value === 'string') return this.addPath(value);
    return this.addValue(value);
  }

  /**
   * Add or resolve a number value.
   * @param value The value, update resolver or path string to add and get back an alias
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  addNumberValue(value: Update.UpdateNumberValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }

  /**
   * Add or resolve a list value.
   * @param value The value, update resolver or path string to add and get back an alias
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  addListValue(value: Update.UpdateListValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }

  /**
   * Add or resolve a set value.
   * @param value The value, update resolver or path string to add and get back an alias
   * @param name Name used to pass down to the value resolver.
   * @return Alias or expression for value to use in expression.
   */
  addSetValue(value: Update.UpdateSetValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }

  /**
   * Helper method to build an UpdateExpression string appending all of the expressions from the
   * lists that are not empty.
   * @return UpdateExpression based string
   */
  buildExpression(): string | undefined {
    const updates = new Array<string>();
    if (this.setList.length > 0) updates.push(`SET ${this.setList.join(', ')}`);
    if (this.removeList.length > 0) updates.push(`REMOVE ${this.removeList.join(', ')}`);
    if (this.addList.length > 0) updates.push(`ADD ${this.addList.join(', ')}`);
    if (this.deleteList.length > 0) updates.push(`DELETE ${this.deleteList.join(', ')}`);
    if (updates.length > 0) return updates.join(' ');
    return undefined;
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
 *     id: Fields.split(['P', 'S']),
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
   *     id: Fields.split(['P', 'S']),
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
  static path(path: string): Update.UpdateFunction {
    return (name: string, exp: UpdateExpression): string => {
      return exp.addPath(path);
    };
  }

  /**
   * Used to reference other attributes for the value argument in Update.* methods.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split(['P', 'S']),
   *     fullName: Fields.string(),
   *     name: Fields.string(),
   *   },
   *   // ...additional properties like table
   * });
   *
   * // Sets name attribute to the value of the fullName attribute, if fullName attribute doesn't exists then set
   * // name attribute to 'User Name'.
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
  static pathWithDefault<T extends Table.AttributeValues>(path: string, value: T): Update.UpdateFunction {
    return (name: string, exp: UpdateExpression): string => {
      return exp.ifNotExist(exp.addPath(path), exp.addValue(value));
    };
  }

  /**
   * Sets the default value for an attribute that does not exist in on the table item.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split(['P', 'S']),
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
  static default<T extends Table.AttributeValues>(value: T): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.set(name, exp.ifNotExist(name, exp.addValue(value)));
    };
  }

  /**
   * Delete the attribute from the table item.  Setting an model property to null also deletes the attribute.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split(['P', 'S']),
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
  static del(): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.del(name);
    };
  }

  /**
   * Sets the attribute to a new value.  Set is the default action for model property not set to a Update.Resolver<string> or null.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split(['P', 'S']),
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
  static set<T extends Table.AttributeValues>(value: T | Update.UpdateFunction): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.set(name, exp.addAnyValue(value, name));
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
   *     id: Fields.split(['P', 'S']),
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
  static inc(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.inc(name, exp.addNumberValue(value, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static dec(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.dec(name, exp.addNumberValue(value, name));
    };
  }

  /**
   * Sets an attribute to the result of adding two values.  Note: The attribute that is being decremented
   * must exist in the table item for this update to succeed.
   * Supported types: number.
   * @example
   * ```typescript
   * import { Fields, Model, Update } from 'dynamodb-datamodel';
   *
   * const model = new Model({
   *   schema: {
   *     id: Fields.split(['P', 'S']),
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
  static add(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.add(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static sub(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.sub(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
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
   *     id: Fields.split(['P', 'S']),
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
  static append(value: Update.UpdateListValue): Update.Resolver<'L'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.append(name, exp.addListValue(value, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static prepend(value: Update.UpdateListValue): Update.Resolver<'L'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.prepend(name, exp.addListValue(value, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static join(left: Update.UpdateListValue, right: Update.UpdateListValue): Update.Resolver<'L'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.join(name, exp.addListValue(left, name), exp.addListValue(right, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
    return (name: string, exp: UpdateExpression): void => {
      exp.delIndexes(name, indexes);
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static setIndexes(values: { [key: number]: Table.AttributeValues | Update.UpdateFunction }): Update.Resolver<'L'> {
    return (name: string, exp: UpdateExpression): void => {
      const listValues: {
        [key: number]: string;
      } = {};
      Object.keys(values).forEach((key) => {
        listValues[Number(key)] = exp.addAnyValue(values[Number(key)], name);
      });
      exp.setIndexes(name, listValues);
    };
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
   *     id: Fields.split(['P', 'S']),
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
    return (name: string, exp: UpdateExpression): void => {
      exp.addToSet(name, exp.addSetValue(value, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
    return (name: string, exp: UpdateExpression): void => {
      exp.removeFromSet(name, exp.addSetValue(value, name));
    };
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
   *     id: Fields.split(['P', 'S']),
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
  static map(map: Update.UpdateMapValue): (name: string | null, exp: UpdateExpression, type?: 'M') => void {
    return (name: string | null, exp: UpdateExpression): void => {
      Object.keys(map).forEach((key) => {
        const value = map[key];
        if (value === undefined) return;
        const path = name ? `${name}.${exp.addPath(key)}` : exp.addPath(key);
        if (typeof value === 'function') {
          const newValue = value(path, exp);
          if (newValue) {
            exp.set(path, newValue);
          }
        } else if (value === null) {
          exp.del(path);
        } else {
          exp.set(path, exp.addValue(value));
        }
      });
    };
  }

  /**
   * Helper function that resolves the updateMap and returns an UpdateExpression to use in DocumentClient.update method calls.
   * @param updateMap Map of update values and resolvers to evaluate.
   * @param exp Used when calling update resolver function to store the names and values mappings and update expressions.
   * @returns Update expression to use in UpdateExpression for DocumentClient.update method calls.
   */
  static buildExpression(updateMap: Update.UpdateMapValue, exp: UpdateExpression): string | undefined {
    Update.map(updateMap)(null, exp, 'M');
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
    updateMap: Update.UpdateMapValue | undefined,
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
   * Resolver function is return by most of the above key Update methods.  Returning a function allows table item updates
   * to easily be composable and extensible.  This allows consumers to create higher level table item update that are composed
   * of the primitive update expressions or support any new primitives that AWS would add in the future.
   * @typeParam T The type used for the value param.
   * @param name Name of the item attribute to resolve.
   * @param exp Object to get path and value aliases and store update array.
   * @param type Param to enforce type safety for update that only work on certain types.
   */
  export type Resolver<T> = (name: string, exp: UpdateExpression, type?: T) => void;

  /**
   * String specific update resolver.
   */
  export type UpdateString = Resolver<'S'>;

  /**
   * Number specific update resolver.
   */
  export type UpdateNumber = Resolver<'N'>;

  /**
   * Binary specific update resolver.
   */
  export type UpdateBinary = Resolver<'B'>;

  /**
   * Boolean specific update resolver.
   */
  export type UpdateBoolean = Resolver<'BOOL'>;

  /**
   * Null specific update resolver.
   */
  export type UpdateNull = Resolver<'NULL'>;

  /**
   * String Set specific update resolver.
   */
  export type UpdateStringSet = Resolver<'SS'>;

  /**
   * Number Set specific update resolver.
   */
  export type UpdateNumberSet = Resolver<'NS'>;

  /**
   * Binary Set specific update resolver.
   */
  export type UpdateBinarySet = Resolver<'BS'>;

  /**
   * List specific update resolver.
   */
  export type UpdateList = Resolver<'L'>;

  /**
   * Map specific update resolver.
   */
  export type UpdateMap = Resolver<'M'>;

  /**
   * Update function return by path and pathWithDefault to support nested resolvers.
   * @param name Name of the item attribute to resolve.
   * @param exp Object to get path and value aliases and store update array.
   * @returns The resolved value of the update function.
   */
  export type UpdateFunction = (name: string, exp: UpdateExpression) => string;

  /**
   * Type used for number based update methods.
   */
  export type UpdateNumberValue = number | string | UpdateFunction;

  /**
   * Type used for set based update methods.
   */
  export type UpdateSetValue = Table.AttributeSetValues | string | UpdateFunction;

  /**
   * Type used for generic list based update methods.
   */
  export type UpdateListValueT<T> = string | UpdateFunction | T[];

  /**
   * Type used for list based update methods.
   */
  export type UpdateListValue = UpdateListValueT<Table.AttributeValues>;

  /**
   * Type used for generic map based update methods.
   * @typeParam T The model interface.
   */
  export type UpdateMapValueT<T> = {
    [key: string]: T | Resolver<string> | undefined;
  };

  /**
   * Type used for map based update methods.
   */
  export type UpdateMapValue = UpdateMapValueT<Table.AttributeValues>;
}
