import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { AttributeValue, AttributeValueMap, AttributeSetValue } from './Common';
import { ExpressionAttributes } from './ExpressionAttributes';

export class UpdateExpression {
  setList: string[] = [];
  removeList: string[] = [];
  addList: string[] = [];
  delList: string[] = [];
  attributes: ExpressionAttributes;

  constructor(attributes?: ExpressionAttributes) {
    this.attributes = attributes || new ExpressionAttributes();
  }
  // Any
  set(name: string, value: string) {
    this.setList.push(`${name} = ${value}`);
  }
  del(name: string) {
    this.removeList.push(name);
  }
  // Number UpdateNumberValue
  add(name: string, left: string, right: string) {
    this.setList.push(`${name} = ${left} + ${right}`);
  }
  sub(name: string, left: string, right: string) {
    this.setList.push(`${name} = ${left} - ${right}`);
  }
  inc(name: string, value: string) {
    this.add(name, name, value);
  }
  dec(name: string, value: string) {
    this.sub(name, name, value);
  }
  // List
  append(name: string, value: string) {
    this.join(name, name, value);
  }
  prepend(name: string, value: string) {
    this.join(name, value, name);
  }
  join(name: string, left: string, right: string) {
    this.setList.push(`${name} = ${this.listAppend(left, right)}`);
  }
  delIndexes(name: string, indexes: number[]) {
    indexes.forEach((index) => {
      this.removeList.push(`${name}[${index}]`);
    });
  }
  setIndexes(name: string, values: { [index: number]: string }) {
    Object.keys(values).forEach((key) => {
      this.setList.push(`${name}[${key}] = ${values[Number(key)]}`);
    });
  }
  // Set
  addToSet(name: string, value: string) {
    this.addList.push(`${name} ${value}`);
  }
  removeFromSet(name: string, value: string) {
    this.delList.push(`${name} ${value}`);
  }

  ifNotExist(name: string, value: AttributeValue): string {
    return `if_not_exists(${name}, ${value})`;
  }
  listAppend(left: string, right: string): string {
    return `list_append(${left}, ${right})`;
  }

  getPaths() {
    return this.attributes.getPaths();
  }
  getValues() {
    return this.attributes.getValues();
  }
  addPath(name: string) {
    return this.attributes.addPath(name);
  }
  addValue(value: AttributeValue) {
    return this.attributes.addValue(value);
  }
  addAnyValue(value: AttributeValue | UpdateFunction, name: string): string {
    return typeof value === 'function' ? value(name, this) : this.addValue(value);
  }
  addNonStringValue(value: AttributeValue | UpdateFunction, name: string): string {
    switch (typeof value) {
      case 'function':
        return value(name, this); // type?: 'string'
      case 'string':
        // For non-string values we allow strings to specify paths, for strings paths need to
        // use the path() function to wrap the path
        return this.addPath(value);
    }
    return this.addValue(value);
  }
  addNumberValue(value: UpdateNumberValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }
  addListValue(value: UpdateListValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }
  addSetValue(value: UpdateSetValue, name: string): string {
    return this.addNonStringValue(value, name); // type?
  }

  buildExpression(): string | undefined {
    const updates = new Array<string>();
    if (this.setList.length > 0) updates.push(`SET ${this.setList.join(', ')}`);
    if (this.removeList.length > 0) updates.push(`REMOVE ${this.removeList.join(', ')}`);
    if (this.addList.length > 0) updates.push(`ADD ${this.addList.join(', ')}`);
    if (this.delList.length > 0) updates.push(`DELETE ${this.delList.join(', ')}`);
    if (updates.length > 0) return updates.join(' ');
    return undefined;
  }

  reset() {
    this.setList = [];
    this.removeList = [];
    this.addList = [];
    this.delList = [];
    this.attributes.reset();
  }
}

export type UpdateInput<T> = (name: string, exp: UpdateExpression, type?: T) => void;

export type UpdateString = UpdateInput<'S'>;
export type UpdateNumber = UpdateInput<'N'>;
export type UpdateBinary = UpdateInput<'B'>;
export type UpdateBoolean = UpdateInput<'BOOL'>;
export type UpdateNull = UpdateInput<'NULL'>;
export type UpdateStringSet = UpdateInput<'SS'>;
export type UpdateNumberSet = UpdateInput<'NS'>;
export type UpdateBinarySet = UpdateInput<'BS'>;
export type UpdateList = UpdateInput<'L'>;
export type UpdateMap = UpdateInput<'M'>;

export type UpdateFunction = (name: string, exp: UpdateExpression) => string;
export type UpdateNumberValue = number | string | UpdateFunction;
export type UpdateSetValue = AttributeSetValue | string | UpdateFunction;
export type UpdateListValueT<T> = string | UpdateFunction | T[];
export type UpdateListValue = UpdateListValueT<AttributeValue>;
export type UpdateMapValueT<T> = {
  [key: string]: T | UpdateInput<string> | undefined;
};
export type UpdateMapValue = UpdateMapValueT<AttributeValue>;

export class Update {
  static path = (path: string): UpdateFunction => {
    return (name: string, exp: UpdateExpression): string => {
      return exp.addPath(path);
    };
  };

  static pathWithDefault = <T extends AttributeValue>(path: string, value: T): UpdateFunction => {
    return (name: string, exp: UpdateExpression): string => {
      return exp.ifNotExist(exp.addPath(path), exp.addValue(value));
    };
  };

  static default = <T extends AttributeValue>(value: T) => {
    return (name: string, exp: UpdateExpression, type?: T) => {
      exp.set(name, exp.ifNotExist(name, exp.addValue(value)));
    };
  };

  static del = () => {
    return (name: string, exp: UpdateExpression) => {
      exp.del(name);
    };
  };
  static delete = Update.del;

  // TODO: remove not needed, or maybe is the default behavior
  static set = <T extends AttributeValue>(value: T | UpdateFunction) => {
    return (name: string, exp: UpdateExpression, type?: string) => {
      exp.set(name, exp.addAnyValue(value, name));
    };
  };

  static inc = (value: UpdateNumberValue) => {
    return (name: string, exp: UpdateExpression, type?: 'N') => {
      exp.inc(name, exp.addNumberValue(value, name));
    };
  };
  static increment = Update.inc;

  static dec = (value: UpdateNumberValue) => {
    return (name: string, exp: UpdateExpression, type?: 'N') => {
      exp.dec(name, exp.addNumberValue(value, name));
    };
  };
  static decrement = Update.dec;

  static add = (left: UpdateNumberValue, right: UpdateNumberValue) => {
    return (name: string, exp: UpdateExpression, type?: 'N') => {
      exp.add(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  };

  static sub = (left: UpdateNumberValue, right: UpdateNumberValue) => {
    return (name: string, exp: UpdateExpression, type?: 'N') => {
      exp.sub(name, exp.addNumberValue(left, name), exp.addNumberValue(right, name));
    };
  };
  static subtract = Update.sub;

  static append = (value: UpdateListValue) => {
    return (name: string, exp: UpdateExpression, type?: 'L') => {
      exp.append(name, exp.addListValue(value, name));
    };
  };

  static prepend = (value: UpdateListValue) => {
    return (name: string, exp: UpdateExpression, type?: 'L') => {
      exp.prepend(name, exp.addListValue(value, name));
    };
  };

  static join = (left: UpdateListValue, right: UpdateListValue) => {
    return (name: string, exp: UpdateExpression, type?: 'L') => {
      exp.join(name, exp.addListValue(left, name), exp.addListValue(right, name));
    };
  };

  static delIndexes = (indexes: number[]) => {
    return (name: string, exp: UpdateExpression, type?: 'L') => {
      exp.delIndexes(name, indexes);
    };
  };

  static setIndexes = (values: { [key: number]: AttributeValue | UpdateFunction }) => {
    return (name: string, exp: UpdateExpression, type?: 'L') => {
      const listValues: { [key: number]: string } = {};
      Object.keys(values).forEach((key) => {
        listValues[Number(key)] = exp.addAnyValue(values[Number(key)], name);
      });
      exp.setIndexes(name, listValues);
    };
  };

  static addToSet = (value: AttributeSetValue) => {
    return (name: string, exp: UpdateExpression, type?: 'SS' | 'NS' | 'BS') => {
      exp.addToSet(name, exp.addSetValue(value, name));
    };
  };
  static removeFromSet = (value: AttributeSetValue) => {
    return (name: string, exp: UpdateExpression, type?: 'SS' | 'NS' | 'BS') => {
      exp.removeFromSet(name, exp.addSetValue(value, name));
    };
  };

  static map = (map: UpdateMapValue) => {
    return (name: string | null, exp: UpdateExpression, type?: 'M') => {
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
  };
}
namespace Update {}

export function buildUpdateExpression(updateMap: UpdateMapValue, exp: UpdateExpression = new UpdateExpression()) {
  Update.map(updateMap)(null, exp, 'M');
  return exp.buildExpression();
}

export function buildUpdateInput(
  updateMap: UpdateMapValue | undefined,
  exp = new UpdateExpression(),
):
  | {
      ExpressionAttributeNames: ExpressionAttributeNameMap;
      ExpressionAttributeValues: AttributeValueMap;
      UpdateExpression: string;
    }
  | undefined {
  if (updateMap) {
    Update.map(updateMap)(null, exp, 'M');
    const expression = exp.buildExpression();
    if (expression) {
      return {
        ExpressionAttributeNames: exp.getPaths(),
        ExpressionAttributeValues: exp.getValues(),
        UpdateExpression: expression,
      };
    }
  }
  return undefined;
}
