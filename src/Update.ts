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
   *
   * @param attributes
   */
  constructor(attributes = new ExpressionAttributes()) {
    this.attributes = attributes;
  }
  // Any
  /**
   *
   * @param name
   * @param value
   */
  set(name: string, value: string): void {
    this.setList.push(`${name} = ${value}`);
  }
  del(name: string): void {
    this.removeList.push(name);
  }
  // Number UpdateNumberValue
  add(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${left} + ${right}`);
  }
  sub(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${left} - ${right}`);
  }
  inc(name: string, value: string): void {
    this.add(name, name, value);
  }
  dec(name: string, value: string): void {
    this.sub(name, name, value);
  }
  // List
  append(name: string, value: string): void {
    this.join(name, name, value);
  }
  prepend(name: string, value: string): void {
    this.join(name, value, name);
  }
  join(name: string, left: string, right: string): void {
    this.setList.push(`${name} = ${this.listAppend(left, right)}`);
  }
  delIndexes(name: string, indexes: number[]): void {
    indexes.forEach((index) => {
      this.removeList.push(`${name}[${index}]`);
    });
  }
  setIndexes(name: string, values: { [index: number]: string }): void {
    Object.keys(values).forEach((key) => {
      this.setList.push(`${name}[${key}] = ${values[Number(key)]}`);
    });
  }
  // Set
  addToSet(name: string, value: string): void {
    this.addList.push(`${name} ${value}`);
  }
  removeFromSet(name: string, value: string): void {
    this.deleteList.push(`${name} ${value}`);
  }

  ifNotExist(name: string, value: Table.AttributeValues): string {
    return `if_not_exists(${name}, ${value})`;
  }
  listAppend(left: string, right: string): string {
    return `list_append(${left}, ${right})`;
  }

  getPaths(): ExpressionAttributeNameMap {
    return this.attributes.getPaths();
  }
  getValues(): Table.AttributeValuesMap {
    return this.attributes.getValues();
  }
  addPath(name: string): string {
    return this.attributes.addPath(name);
  }
  addValue(value: Table.AttributeValues): string {
    return this.attributes.addValue(value);
  }
  addAnyValue(value: Table.AttributeValues | Update.UpdateFunction, name: string): string {
    return typeof value === 'function' ? value(name, this) : this.addValue(value);
  }
  addNonStringValue(value: Table.AttributeValues | Update.UpdateFunction, name: string): string {
    if (typeof value === 'function') return value(name, this); // type?: 'string'
    // For non-string values we allow strings to specify paths, for strings paths need to
    // use the path() function to wrap the path
    if (typeof value === 'string') return this.addPath(value);
    return this.addValue(value);
  }
  addNumberValue(value: Update.UpdateNumberValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }
  addListValue(value: Update.UpdateListValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }
  addSetValue(value: Update.UpdateSetValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }

  buildExpression(): string | undefined {
    const updates = new Array<string>();
    if (this.setList.length > 0) updates.push(`SET ${this.setList.join(', ')}`);
    if (this.removeList.length > 0) updates.push(`REMOVE ${this.removeList.join(', ')}`);
    if (this.addList.length > 0) updates.push(`ADD ${this.addList.join(', ')}`);
    if (this.deleteList.length > 0) updates.push(`DELETE ${this.deleteList.join(', ')}`);
    if (updates.length > 0) return updates.join(' ');
    return undefined;
  }

  reset(): void {
    this.setList = [];
    this.removeList = [];
    this.addList = [];
    this.deleteList = [];
    this.attributes.reset();
  }
}

export class Update {
  static path = (path: string): Update.UpdateFunction => {
    return (name: string, exp: UpdateExpression): string => {
      return exp.addPath(path);
    };
  };

  static pathWithDefault<T extends Table.AttributeValues>(path: string, value: T): Update.UpdateFunction {
    return (name: string, exp: UpdateExpression): string => {
      return exp.ifNotExist(exp.addPath(path), exp.addValue(value));
    };
  }

  static default<T extends Table.AttributeValues>(value: T): Update.Resolver<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: string): void => {
      exp.set(name, exp.ifNotExist(name, exp.addValue(value)));
    };
  }

  static del(): Update.Resolver<string> {
    return (name: string, exp: UpdateExpression): void => {
      exp.del(name);
    };
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static delete = Update.del;

  static set<T extends Table.AttributeValues>(value: T | Update.UpdateFunction): Update.Resolver<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: string): void => {
      exp.set(name, exp.addAnyValue(value, name));
    };
  }

  static inc(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'N'): void => {
      exp.inc(name, exp.addNumberValue(value, name));
    };
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static increment = Update.inc;

  static dec(value: Update.UpdateNumberValue): Update.Resolver<'N'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'N'): void => {
      exp.dec(name, exp.addNumberValue(value, name));
    };
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static decrement = Update.dec;

  static add(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'N'): void => {
      exp.add(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  }

  static sub(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue): Update.Resolver<'N'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'N'): void => {
      exp.sub(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  }
  // eslint-disable-next-line @typescript-eslint/unbound-method
  static subtract = Update.sub;

  static append(value: Update.UpdateListValue): Update.Resolver<'L'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'L'): void => {
      exp.append(name, exp.addListValue(value, name));
    };
  }

  static prepend(value: Update.UpdateListValue): Update.Resolver<'L'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'L'): void => {
      exp.prepend(name, exp.addListValue(value, name));
    };
  }

  static join(left: Update.UpdateListValue, right: Update.UpdateListValue): Update.Resolver<'L'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'L'): void => {
      exp.join(name, exp.addListValue(left, name), exp.addListValue(right, name));
    };
  }

  static delIndexes(indexes: number[]): Update.Resolver<'L'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'L'): void => {
      exp.delIndexes(name, indexes);
    };
  }

  static setIndexes(values: { [key: number]: Table.AttributeValues | Update.UpdateFunction }): Update.Resolver<'L'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'L'): void => {
      const listValues: {
        [key: number]: string;
      } = {};
      Object.keys(values).forEach((key) => {
        listValues[Number(key)] = exp.addAnyValue(values[Number(key)], name);
      });
      exp.setIndexes(name, listValues);
    };
  }

  static addToSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'SS' | 'NS' | 'BS'): void => {
      exp.addToSet(name, exp.addSetValue(value, name));
    };
  }
  static removeFromSet(value: Table.AttributeSetValues): Update.Resolver<'SS' | 'NS' | 'BS'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string, exp: UpdateExpression, type?: 'SS' | 'NS' | 'BS'): void => {
      exp.removeFromSet(name, exp.addSetValue(value, name));
    };
  }

  static map(map: Update.UpdateMapValue): (name: string | null, exp: UpdateExpression, type?: 'M') => void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (name: string | null, exp: UpdateExpression, type?: 'M'): void => {
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

  static buildExpression(updateMap: Update.UpdateMapValue, exp: UpdateExpression): string | undefined {
    Update.map(updateMap)(null, exp, 'M');
    return exp.buildExpression();
  }

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
  export type Resolver<T> = (name: string, exp: UpdateExpression, type?: T) => void;

  export type UpdateString = Resolver<'S'>;
  export type UpdateNumber = Resolver<'N'>;
  export type UpdateBinary = Resolver<'B'>;
  export type UpdateBoolean = Resolver<'BOOL'>;
  export type UpdateNull = Resolver<'NULL'>;
  export type UpdateStringSet = Resolver<'SS'>;
  export type UpdateNumberSet = Resolver<'NS'>;
  export type UpdateBinarySet = Resolver<'BS'>;
  export type UpdateList = Resolver<'L'>;
  export type UpdateMap = Resolver<'M'>;

  export type UpdateFunction = (name: string, exp: UpdateExpression) => string;
  export type UpdateNumberValue = number | string | UpdateFunction;
  export type UpdateSetValue = Table.AttributeSetValues | string | UpdateFunction;
  export type UpdateListValueT<T> = string | UpdateFunction | T[];
  export type UpdateListValue = UpdateListValueT<Table.AttributeValues>;
  export type UpdateMapValueT<T> = {
    [key: string]: T | Resolver<string> | undefined;
  };
  export type UpdateMapValue = UpdateMapValueT<Table.AttributeValues>;
}
