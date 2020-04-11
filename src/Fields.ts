import { Condition } from './Condition';
import { Model, ModelBase } from './Model';
import { Table } from './Table';
import { Update } from './Update';

export interface Field {
  name?: string;
  init(name: string): void;
  toModel(
    name: string,
    tableData: Table.AttributeValueMap,
    modelData: Model.ModelData,
    model: ModelBase,
  ): Promise<void>;

  toTable(
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValueMap,
    model: ModelBase,
  ): Promise<void>;

  toTableUpdate(
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.UpdateMapValue,
    model: ModelBase,
  ): Promise<void>;
}

export class FieldBase<V, T> implements Field {
  readonly type: T;
  name?: string; // set by init function in Model or Field constructor
  // TODO: is there a default where we don't set or remove the attribute, then toModel will always return?
  _default?: V | Field.DefaultFunction<V>;
  _alias?: string;
  _required?: boolean; // default: false
  _hidden?: boolean; // default: false
  _validator?: Field.Validator<V>;
  _updateValidator?: Field.UpdateValidator<V>;
  _coerce?: boolean; // default: false

  constructor(type: T, alias?: string) {
    this.type = type;
    this._alias = alias;
  }

  init(name: string): void {
    this.name = name;
  }

  yup(schema: any, options?: any) {
    return this.validator((value) => {
      return schema.validate(value, {
        strict: !(this._coerce || false),
        ...options,
      });
    });
  }
  joi(schema: any, options?: any) {
    return this.validator((value) => {
      return schema.validateAsync(value, {
        convert: this._coerce || false,
        ...options,
      });
    });
  }
  regex(regex: RegExp) {
    return this.validator((value: V) => {
      return new Promise<void | V>((resolve, reject) => {
        if (regex.test((value as any).toString())) {
          resolve(value);
        } else {
          reject(new Error(`value must match regex: '${regex}'`));
        }
      });
    });
  }
  validator(validator: Field.Validator<V>) {
    this._validator = validator;
    return this;
  }
  updateValidator(validator: Field.UpdateValidator<V>) {
    this._updateValidator = validator;
    return this;
  }

  validate(value: V) {
    return this._validator!(value);
  }

  validateUpdate(value: Model.ModelUpdateValue<V>) {
    return this._updateValidator!(value);
  }

  coerce(value = true) {
    this._coerce = value;
    return this;
  }

  alias(value?: string) {
    this._alias = value;
    return this;
  }

  default(value: V | Field.DefaultFunction<V>) {
    this._default = value;
    return this;
  }

  hidden(value = true) {
    this._hidden = value;
    return this;
  }

  required(value = true) {
    this._required = value;
    return this;
  }

  async toModel(
    name: string,
    tableData: Table.AttributeValueMap,
    modelData: Model.ModelData,
    model: ModelBase,
  ): Promise<void> {
    const value = tableData[this._alias || name];
    // TODO: Should we use default, validate table data or do other things with data coming out of the table?
    if (value === undefined) return;
    modelData[name] = value;
  }

  async toTable(
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValueMap,
    model: ModelBase,
  ): Promise<void> {
    let value = (modelData[name] as unknown) as V;
    if (this._validator) {
      const coerced = await this._validator(value as V);
      if (this._coerce && coerced !== undefined) {
        value = coerced as V;
      }
    } else if (this._coerce) {
      // Simple coercion
    }
    // (typeof value === 'string' && value.length === 0) ||
    // (Array.isArray(value) && value.length === 0)
    // Sets, typeOf
    if (value === undefined || value === null) {
      const def = this._default;
      if (def !== undefined) {
        value = typeof def === 'function' ? (def as Field.DefaultFunction<V>)(name, tableData, modelData, model) : def;
      } else if (this._required) {
        throw new Error(`Field ${this.name} is required`);
      } else {
        return;
      }
    }
    if (this._hidden) return;
    // TODO: dynamodb atttributes can't have empty values like "", empty array, empty sets or null.
    tableData[this._alias || name] = value;
  }

  async toTableUpdate(
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.UpdateMapValue,
    model: ModelBase,
  ): Promise<void> {
    let value = modelData[name];
    if (this._updateValidator) {
      const coerced = await this._updateValidator(value as Model.ModelUpdateValue<V>);
      if (this._coerce && coerced !== undefined) {
        value = coerced as Model.ModelUpdateValue<V>;
      }
    } else if (this._coerce) {
      // Simple coercion
    }
    // TODO: do we need to do anything with required or default for update?
    if (value === undefined) return;
    if (this._hidden) return;
    tableData[this._alias || name] = value;
  }
}

export class FieldExpression<V, T> extends FieldBase<V, T> {
  // Conditions
  path() {
    return Condition.path(this.name!);
  }

  eq(v: V) {
    return Condition.eq(this.name!, v);
  }
  equal = this.eq;

  ne(v: V) {
    return Condition.ne(this.name!, v);
  }
  notEqual = this.ne;

  lt(v: V) {
    return Condition.lt(this.name!, v);
  }
  lessThen = this.lt;

  le(v: V) {
    return Condition.le(this.name!, v);
  }
  lessThenEqual = this.le;

  gt(v: V) {
    return Condition.gt(this.name!, v);
  }
  greaterThen = this.gt;

  ge(v: V) {
    return Condition.ge(this.name!, v);
  }
  greaterThenEqual = this.ge;

  between(from: V, to: V) {
    return Condition.between(this.name!, from, to);
  }

  in(v: V[]) {
    return Condition.in(this.name!, v);
  }

  typeOf(type: Table.AttributeType) {
    return Condition.type(this.name!, type);
  }

  exists() {
    return Condition.exists(this.name!);
  }

  notExists() {
    return Condition.notExists(this.name!);
  }

  // Update
  getPath(path: string, defaultValue?: V) {
    return defaultValue === undefined ? Update.path(path) : Update.pathWithDefault(path, defaultValue);
  }
  del() {
    return Update.del();
  }
  set(value: V | Update.UpdateFunction) {
    return Update.set(value);
  }
  setDefault(value: V | Update.UpdateFunction) {
    return Update.default(value);
  }
}

export class FieldString extends FieldExpression<string, 'S'> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }
  contains(value: string) {
    return Condition.contains(this.name!, value);
  }
  beginsWith(value: string) {
    return Condition.beginsWith(this.name!, value);
  }
}

export class FieldNumber extends FieldExpression<number, 'N'> {
  // Update
  inc(value: Update.UpdateNumberValue) {
    return Update.inc(value);
  }
  dec(value: Update.UpdateNumberValue) {
    return Update.dec(value);
  }
  add(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue) {
    return Update.add(left, right);
  }
  sub(left: Update.UpdateNumberValue, right: Update.UpdateNumberValue) {
    return Update.sub(left, right);
  }
}

export class FieldSet<V, T> extends FieldExpression<V, T> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }
  contains(value: string) {
    return Condition.contains(this.name!, value);
  }

  // Update
  add(value: Table.AttributeSetValue) {
    return Update.addToSet(value);
  }
  remove(value: Table.AttributeSetValue) {
    return Update.removeFromSet(value);
  }
}

export class FieldBinary extends FieldExpression<Table.BinaryValue, 'B'> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }
}

export class FieldBoolean extends FieldExpression<boolean, 'BOOL'> {}

export class FieldNull extends FieldExpression<null, 'NULL'> {}

export class FieldStringSet extends FieldSet<Table.StringSetValue, 'SS'> {}

export class FieldNumberSet extends FieldSet<Table.NumberSetValue, 'NS'> {}

export class FieldBinarySet extends FieldSet<Table.BinarySetValue, 'BS'> {}

export class FieldListT<V extends Table.AttributeValue, T> extends FieldExpression<V[], T> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }

  // Update
  append(value: Update.UpdateListValueT<V>) {
    return Update.append(value);
  }
  prepend(value: Update.UpdateListValueT<V>) {
    return Update.prepend(value);
  }
  join(left: Update.UpdateListValueT<V>, right: Update.UpdateListValueT<V>) {
    return Update.join(left, right);
  }
  delIndexes(indexes: number[]) {
    return Update.delIndexes(indexes);
  }
  setIndexes(indexes: { [key: number]: V | Update.UpdateFunction }) {
    return Update.setIndexes(indexes);
  }
}

export class FieldListTyped<V extends { [key: string]: any }, T> extends FieldListT<V, T> {
  schema: Model.ModelSchemaT<V>;

  constructor(type: T, schema: Model.ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    Object.keys(schema).forEach((key) => schema[key].init(key));
  }
}

export class FieldMapT<V extends Table.AttributeValue, T> extends FieldExpression<{ [key: string]: V }, T> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }

  // Update
  map(map: { [key: string]: V }) {
    return Update.map(map);
  }
}

export class FieldMapTyped<V extends { [key: string]: any }, T> extends FieldMapT<V, T> {
  schema: Model.ModelSchemaT<V>;

  constructor(type: T, schema: Model.ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    Object.keys(schema).forEach((key) => schema[key].init(key));
  }
}

export class FieldObject<V extends { [key: string]: any }, T> extends FieldExpression<V, T> {
  schema: Model.ModelSchemaT<V>;

  constructor(type: T, schema: Model.ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    Object.keys(schema).forEach((key) => schema[key].init(key));
  }

  // Condition
  size() {
    return Condition.size(this.name!);
  }

  // Update
  map(map: Model.ModelUpdateT<V>) {
    return Update.map(map);
  }
}

export class FieldDate extends FieldBase<Date, 'DATE'> {
  async toModel(name: string, tableData: Table.AttributeValueMap, modelData: Model.ModelData, model: ModelBase) {
    await super.toModel(name, tableData, modelData, model);
    const value = modelData[name];
    if (value === undefined) return;
    modelData[name] = new Date((value as number) * 1000);
  }

  async toTable(name: string, modelData: Model.ModelData, tableData: Table.AttributeValueMap, model: ModelBase) {
    await super.toTable(name, tableData, modelData, model);
    const value = modelData[this._alias || name];
    if (value === undefined) return;
    tableData[this._alias || name] = Math.round((value as Date).valueOf() / 1000);
  }

  async toTableUpdate(name: string, modelData: Model.ModelUpdate, tableData: Update.UpdateMapValue, model: ModelBase) {
    this.toTable(name, modelData, tableData as Table.AttributeValueMap, model);
  }
}

export class FieldHidden extends FieldBase<undefined, 'HIDDEN'> {
  readonly _hidden = true;
  constructor() {
    super('HIDDEN');
  }
}

export class FieldCompositeSlot implements Field {
  name?: string;
  composite: FieldComposite;
  slot: number;
  constructor(composite: FieldComposite, slot: number, name?: string) {
    this.composite = composite;
    this.slot = slot;
    this.name = name;
  }

  init(name: string): void {
    this.name = name;
  }

  async toModel(name: string, tableData: Table.AttributeValueMap, modelData: Model.ModelData, model: ModelBase) {
    this.composite.toModel(this.slot, name, tableData, modelData, model);
  }

  async toTable(name: string, modelData: Model.ModelData, tableData: Table.AttributeValueMap, model: ModelBase) {
    this.composite.toTable(this.slot, name, modelData, tableData, model);
  }

  async toTableUpdate(name: string, modelData: Model.ModelUpdate, tableData: Update.UpdateMapValue, model: ModelBase) {
    this.composite.toTableUpdate(this.slot, name, modelData, tableData, model);
  }
}

export class FieldComposite {
  alias: string;
  count: number;
  delim: string;

  constructor(alias: string, count: number, delim: string = '.') {
    this.alias = alias;
    this.count = count;
    this.delim = delim;
  }

  slot(value: number) {
    return new FieldCompositeSlot(this, value);
  }

  toModel(
    slot: number,
    name: string,
    tableData: Table.AttributeValueMap,
    modelData: Model.ModelData,
    model: ModelBase,
  ): void {
    const value = tableData[this.alias];
    if (typeof value !== 'string') return;
    const parts = value.split(this.delim);
    if (slot >= parts.length) return;
    modelData[name] = parts[slot];
  }

  toTable(
    slot: number,
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValueMap,
    model: ModelBase,
  ): void {
    const value = modelData[name];
    if (value === undefined) return;
    if (typeof value === 'function') return; // throw and error
    const slots = (tableData[this.alias] as string)?.split(this.delim) || new Array<string>(this.count);
    slots[slot] = value!.toString();
    tableData[this.alias] = slots.join(this.delim);
  }

  toTableUpdate(
    slot: number,
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.UpdateMapValue,
    model: ModelBase,
  ): void {
    this.toTable(slot, name, modelData, tableData as Table.AttributeValueMap, model);
  }
}

export type CompositeSlot<T extends { [index: string]: number }> = {
  [P in keyof T]: () => FieldCompositeSlot;
};

export class FieldNamedComposite<T extends { [index: string]: number }> extends FieldComposite {
  slots: CompositeSlot<T>;
  map: T;

  constructor(alias: string, map: T, slots?: CompositeSlot<T>, delim?: string) {
    const keys = Object.keys(map);
    super(alias, keys.length, delim);
    this.map = map;
    if (slots) this.slots = slots;
    else {
      const newSlots: { [index: string]: () => FieldCompositeSlot } = {};
      keys.forEach((key) => {
        // TODO: validate slot is < keys.length
        const slot = map[key];
        newSlots[key] = () => new FieldCompositeSlot(this, slot, key);
      });
      this.slots = newSlots as CompositeSlot<T>;
    }
  }

  slot(value: number | string): FieldCompositeSlot {
    if (typeof value === 'number') {
      const keys = Object.keys(this.map);
      return new FieldCompositeSlot(this, value, keys[value]);
    }
    return this.slots[value]();
  }
}

export class FieldSplit implements Field {
  name?: string;
  aliases: string[];
  delim: string;

  constructor(aliases: string[], delim: string = '.') {
    this.aliases = aliases;
    this.delim = delim;
  }
  init(name: string) {
    this.name = name;
  }
  async toModel(
    name: string,
    tableData: Table.AttributeValueMap,
    modelData: Model.ModelData,
    model: ModelBase,
  ): Promise<void> {
    const parts: string[] = [];
    this.aliases.forEach((alias) => {
      const part = tableData[alias];
      if (part) parts.push(part.toString());
    });
    modelData[name] = parts.join(this.delim);
  }

  async toTable(
    name: string,
    modelData: Model.ModelData,
    tableData: Table.AttributeValueMap,
    model: ModelBase,
  ): Promise<void> {
    // TODO: should we throw for this?
    const value = modelData[name];
    if (value === undefined) return;
    if (typeof value !== 'string') return; // skip any field that is not a string and is split aliased
    let parts = value.split(this.delim);
    const extraParts = parts.length - this.aliases.length;
    if (extraParts > 0) {
      parts[extraParts] = parts.slice(0, extraParts + 1).join(this.delim);
      parts = parts.slice(extraParts);
    }
    for (let i = 0; i < parts.length; i++) {
      tableData[this.aliases[i]] = parts[i];
    }
  }

  async toTableUpdate(
    name: string,
    modelData: Model.ModelUpdate,
    tableData: Update.UpdateMapValue,
    model: ModelBase,
  ): Promise<void> {
    this.toTable(name, modelData, tableData as Table.AttributeValueMap, model);
  }
}

/* tslint:disable:no-namespace */
export namespace Field {
  export type Validator<T> = (value: T) => Promise<T | void>;
  export type UpdateValidator<T> = (value: Model.ModelUpdateValue<T>) => Promise<Model.ModelUpdateValue<T> | void>;

  export type DefaultFunction<T> = (
    name: string,
    tableData: Table.AttributeValueMap,
    modelData: Model.ModelData,
    model: ModelBase,
  ) => T;

  /* tslint:disable:variable-name */
  export const string = (alias?: string) => {
    return new FieldString('S', alias);
  };

  /* tslint:disable:variable-name */
  export const number = (alias?: string) => {
    return new FieldNumber('N', alias);
  };

  export const binary = (alias?: string) => {
    return new FieldBinary('B', alias);
  };

  /* tslint:disable:variable-name */
  export const boolean = (alias?: string) => {
    return new FieldBoolean('BOOL', alias);
  };

  export const stringSet = (alias?: string) => {
    return new FieldStringSet('SS', alias);
  };

  export const numberSet = (alias?: string) => {
    return new FieldNumberSet('NS', alias);
  };

  export const binarySet = (alias?: string) => {
    return new FieldBinarySet('BS', alias);
  };

  export const listT = <V, T>(type: T, schema: Model.ModelSchemaT<V>, alias?: string) => {
    return new FieldListTyped<V, T>(type, schema, alias);
  };

  export const list = (alias?: string) => {
    return new FieldListT('L', alias);
  };

  export const mapT = <V, T>(type: T, schema: Model.ModelSchemaT<V>, alias?: string) => {
    return new FieldMapTyped<V, T>(type, schema, alias);
  };

  export const map = (alias?: string) => {
    return new FieldMapT('M', alias);
  };

  export const object = <V, T>(type: T, schema: Model.ModelSchemaT<V>, alias?: string) => {
    return new FieldObject<V, T>(type, schema, alias);
  };

  export const date = (alias?: string) => {
    return new FieldDate('DATE', alias);
  };

  export const hidden = () => {
    return new FieldHidden();
  };

  export const split = (aliases: string[], delim?: string) => {
    return new FieldSplit(aliases, delim);
  };

  export const composite = (alias: string, count: number, delim?: string) => {
    return new FieldComposite(alias, count, delim);
  };

  export const namedComposite = <T extends { [key: string]: number }>(
    alias: string,
    slotMap: T,
    slots?: CompositeSlot<T>,
    delim?: string,
  ) => {
    return new FieldNamedComposite<T>(alias, slotMap, slots, delim);
  };
}
