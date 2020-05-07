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
 * @example
 * ```typescript
 * ```
 */
export class Update {
  /**
   * Used to reference other attributes for the value argument in Update.* methods.
   * @example
   * ```typescript
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
   * ```
   * @paramType T Type of default value argument.
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
   * ```
   * @paramType T Type of default value argument.
   * @param value Default value to set if attribute value does not exist.
   * @returns Update resolver function to set default value.
   */
  static default<T extends Table.AttributeValues>(value: T): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.set(name, exp.ifNotExist(name, exp.addValue(value)));
    };
  }

  /**
   * Delete the attribute from the table item.
   * @example
   * ```typescript
   * ```
   * @returns Update resolver function to delete attribute.
   */
  static del(): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.del(name);
    };
  }

  /**
   * Sets the attribute to a new value.
   * @example
   * ```typescript
   * ```
   * @paramType T Type of value argument to set.
   * @param value The value (or attribute reference) to update the item attribute to, will add attribute if not present.
   * @returns Update resolver function to set attribute to a value.
   */
  static set<T extends Table.AttributeValues>(value: T | Update.UpdateFunction): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.set(name, exp.addAnyValue(value, name));
    };
  }

  /**
   * Increments a number based attribute by a certain amount.  Note: The attribute that is being incremented must exist in the table item for this update to succeed.
   * Support types: number
   * @example
   * ```typescript
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
   * Decrements a number based attribute by a certain amount.  Note: The attribute that is being decremented must exist in the table item for this update to succeed.
   * Support types: number
   * @example
   * ```typescript
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
   * Sets an attribute to the result of adding two values.  Note: The reference attributes must exists for the update to succeed.
   * Support types: number
   * @example
   * ```typescript
   * ```
   * @param left A value (or reference attribute) to using in add operation.
   * @param right A value (or reference attribute) to using in add operation..
   * @returns Update resolver function to set a number attribute to the result of adding two values.
   */
  static add(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.add(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  }

  /**
   * Sets an attribute to the result of subtracting two values.  Note: The reference attributes must exists for the update to succeed.
   * Supported types: number
   * @example
   * ```typescript
   * ```
   * @param left A value (or reference attribute) to use on the left side of a subtract operation.
   * @param right A value (or reference attribute) to use on the right side of a subtract operation..
   * @returns Update resolver function to set a number attribute to the result of subtracting two values.
   */
  static sub(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.sub(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  }

  /**
   * Appends items to the end of an existing list attribute.
   * Supported types: list
   * @example
   * ```typescript
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
   * Supported types: list
   * @example
   * ```typescript
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
   * Supported types: list
   * @example
   * ```typescript
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
   * Deletes an array of indices from an list based attribute.
   * Supported types: list
   * @example
   * ```typescript
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
   * Supported types: list
   * @example
   * ```typescript
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
   * Adds an array of values to a set based attribute.
   * Supported types: StringSet, NumberSet or BinarySet
   * @example
   * ```typescript
   * ```
   * @param value Array of values to add
   * @returns Update resolver function to add an array of values to a set based attribute.
   */
  static addToSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.addToSet(name, exp.addSetValue(value, name));
    };
  }

  /**
   * Removes an array of values from a set based attribute.
   * Supported types: StringSet, NumberSet or BinarySet
   * @example
   * ```typescript
   * ```
   * @param value Array of values to remove
   * @returns Update resolver function to remove an array of values from a set based attribute.
   */
  static removeFromSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    return (name: string, exp: UpdateExpression): void => {
      exp.removeFromSet(name, exp.addSetValue(value, name));
    };
  }

  /**
   * Sets the inner attributes of a map based attribute.
   * @example
   * ```typescript
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
   * @paramType T
   */
  export type UpdateMapValueT<T> = {
    [key: string]: T | Resolver<string> | undefined;
  };

  /**
   * Type used for map based update methods.
   */
  export type UpdateMapValue = UpdateMapValueT<Table.AttributeValues>;
}
