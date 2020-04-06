// Ideal
import {
  AttributeValue,
  AttributeValueMap,
  AttributeType,
  BinaryValue,
  StringSetValue,
  NumberSetValue,
  BinarySetValue,
  AttributeSetValue,
  Optional,
} from './Common';
import { TableBase, Table } from './Table';
import { UpdateFunction, Update, UpdateInput, UpdateNumberValue, UpdateMapValue, UpdateListValueT } from './Update';
import { Condition, ConditionFunction } from './Condition';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

type ModelType = number | string | boolean | null | object;
export type ModelSchema = { [key: string]: Field };
export type ModelSchemaT<T extends { [index: string]: any }> = {
  [P in keyof Required<T>]: Field;
};

export type ModelCoreT<T> = {
  [P in keyof T]: Extract<T[P], ModelType>;
};
export type ModelCore = { [index: string]: ModelType };

export type ModelOutT<T> = {
  [P in keyof T]: Extract<T[P], ModelType>;
};
export type ModelOut = { [key: string]: ModelType };

export type ModelUpdateValue<T> = Extract<T, ModelType> | null | UpdateInput<string>;
export type ModelUpdateT<T> = {
  [P in keyof Optional<T>]: ModelUpdateValue<T[P]>;
};
export type ModelUpdate = {
  [key: string]: ModelUpdateValue<ModelType>;
};

export interface ModelParams<KEY, MODEL extends KEY = KEY> {
  name?: string;
  schema: ModelSchemaT<MODEL>;
  table: TableBase;
}

export interface ModelBase {
  name?: string;
  schema: ModelSchema;
  table: TableBase;
  onError?: () => void;
}

// TODO: how to handle data mapping issues like wrong types?
//   should really just deligate to a local or global error handler
export class Model<KEY extends { [key: string]: any }, MODEL extends KEY = KEY> implements ModelBase {
  name?: string;
  schema: ModelSchemaT<MODEL>;
  table: TableBase;
  onError?: () => void;

  constructor(params: ModelParams<KEY, MODEL>) {
    this.name = params.name;
    this.schema = params.schema;
    this.table = params.table;
    Object.keys(this.schema).forEach((key) => this.schema[key].init(key));
  }

  createSet(list: string[] | number[] | BinaryValue[], options?: DocumentClient.CreateSetOptions) {
    return this.table.client!.createSet(list, options);
  }

  createStringSet(list: string[], options: DocumentClient.CreateSetOptions = {}): StringSetValue {
    return this.createSet(list, options) as StringSetValue;
  }

  createNumberSet(list: number[], options: DocumentClient.CreateSetOptions = {}): NumberSetValue {
    return this.createSet(list, options) as NumberSetValue;
  }

  createBinarySet(list: BinaryValue[], options: DocumentClient.CreateSetOptions = {}): BinarySetValue {
    return this.createSet(list, options) as BinarySetValue;
  }

  private async mapUpdateModelToTable(
    data: ModelUpdateT<MODEL>,
  ): Promise<{
    key: Table.PrimaryKeyValueMap;
    item: UpdateMapValue;
  }> {
    const tableData: AttributeValueMap = {};
    // enumerate schema so each field gets called
    // ... handled by table to* if supported (do we need each field to return array of names proccessed)
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Field = this.schema[name];
      await schema.toTableUpdate(name, data, tableData, this);
    }
    return this.splitTableData(tableData);
  }

  private async mapModelToTable(
    data: ModelData,
  ): Promise<{
    key: Table.PrimaryKeyValueMap;
    item: AttributeValueMap;
  }> {
    const tableData: AttributeValueMap = {};
    // enumerate schema so each field gets called
    // ... handled by table to* if supported (do we need each field to return array of names proccessed)
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Field = this.schema[name];
      await schema.toTable(name, data, tableData, this);
    }
    return this.splitTableData(tableData);
  }

  splitTableData(data: AttributeValueMap) {
    const key: Table.PrimaryKeyValueMap = {};
    const item: AttributeValueMap = { ...data };
    Object.keys(this.table.keySchema).forEach((name) => {
      if (data[name] === undefined) return;
      key[name] = data[name] as Table.PrimaryAttributeValue;
      delete item[name];
    });
    return { key, item };
  }

  async mapToTableItem(data: ModelCoreT<MODEL>): Promise<AttributeValueMap> {
    return (await this.mapModelToTable(data)).item;
  }

  async mapToTableKey(key: ModelCoreT<KEY>): Promise<Table.PrimaryKeyValueMap> {
    return (await this.mapModelToTable(key)).key;
  }

  mapToTableKeyAndItem(data: ModelCoreT<MODEL>) {
    return this.mapModelToTable(data);
  }

  async mapToModel(data: AttributeValueMap): Promise<ModelOutT<MODEL>> {
    const out: ModelOut = {};
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Field = this.schema[name];
      await schema.toModel(name, data, out, this);
    }
    return out as ModelOutT<MODEL>;
  }

  async getParams(key: ModelCoreT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemInput> {
    const tableKey = await this.mapToTableKey(key);
    return this.table.getParams(tableKey, options);
  }
  async putParams(data: ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<DocumentClient.PutItemInput> {
    const tableData = await this.mapToTableKeyAndItem(data);
    return this.table.putParams(tableData.key, tableData.item, options);
  }
  async deleteParams(key: ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<DocumentClient.DeleteItemInput> {
    const tableKey = await this.mapToTableKey(key);
    return this.table.deleteParams(tableKey, options);
  }
  async updateParams(
    data: ModelUpdateT<MODEL>,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemInput> {
    const tableData = await this.mapUpdateModelToTable(data);
    return this.table.updateParams(tableData.key, tableData.item, options);
  }

  async get(key: ModelCoreT<KEY>, options?: Table.GetOptions): Promise<ModelOutT<MODEL> | undefined> {
    const tableKey = await this.mapToTableKey(key);
    const result = await this.table.get(tableKey, options);
    return result.Item ? this.mapToModel(result.Item!) : undefined;
  }
  async put(data: ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<ModelOutT<MODEL>> {
    const tableData = await this.mapToTableKeyAndItem(data);
    await this.table.put(tableData.key, tableData.item, options);
    return this.mapToModel({ ...tableData.key, ...tableData.item });
  }
  async delete(key: ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<ModelOutT<MODEL> | undefined> {
    const tableKey = await this.mapToTableKey(key);
    const result = await this.table.delete(tableKey, options);
    return result.Attributes ? this.mapToModel(result.Attributes) : undefined;
  }
  async update(data: ModelUpdateT<MODEL>, options?: Table.UpdateOptions): Promise<ModelOutT<MODEL> | undefined> {
    const tableData = await this.mapUpdateModelToTable(data);
    const result = await this.table.update(tableData.key, tableData.item, options);
    return result.Attributes ? this.mapToModel(result.Attributes) : undefined;
  }
}

namespace Model {}

export type ModelData = { [key: string]: ModelType };

interface Field {
  name?: string;
  init(name: string): void;
  toModel(name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase): Promise<void>;

  toTable(name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase): Promise<void>;

  toTableUpdate(name: string, modelData: ModelUpdate, tableData: UpdateMapValue, model: ModelBase): Promise<void>;
}

// TODO: provide some basics and auto mapping to update/condition expressions
// Basic functionality:
//  - type validation/restriction
//  - type coerce (base types: string, number, boolean, sets, binary, null; complex types: ??)
//    - both ways: toTable and toModel?
//    NOTE: Attribute values cannot be null. String and Binary type attributes must have lengths
//      greater than zero. Set type attributes cannot be empty.
//  - default - used in put (how about update)
//    - both ways: toTable and toModel?
//    - should remove attribute if equals default
//  - hidden (from table or Model) -
//  - required - put (notExists, exists, always) and update
//  - regex
//  - extensible validation and coerce - how do validate update?
//  - support ... based attributes
//  - compression -
//    - base64 date
//    - base64 guid
//  -

// At Model level:
// - new id (P+S)
//   - w/ type based prefix
// - revision (enforce passed revision == current revision to put/update) = R or Rev
// - created date (type: string, base64, number) = CD
// - modified date = MD
// - model type = T or Type
// - model version (compine with type, like modelType:1.0.2) = V or Ver
// - created/modified user (have global or table based current user) = CU/MU
// - delete = D or TTL
// - hidden = H or Hide
// - readonly = RO or Lock
// -
// - onError
// - model list (collection) == access patterns
//
// At Table level:
// - onError
//
// At Index:
// - delimiter
//
// Global:
// - onError
// - split delimiter
// - composite delimiter
// - validation

// TODO:
// - transactions
// - batch
// - access patterns

// In general there will be a Model class that will contain much of the business logic
// this class is to just make
// General guidances for table attributes is to capilize them like P, S, G0P, G0S, L0S
//   this would also include index projections

export type Validator<T> = (value: T) => Promise<T | void>;
export type UpdateValidator<T> = (value: ModelUpdateValue<T>) => Promise<ModelUpdateValue<T> | void>;

export type DefaultFunction<T> = (
  name: string,
  tableData: AttributeValueMap,
  modelData: ModelData,
  model: ModelBase,
) => T;

export class FieldBase<V, T> implements Field {
  readonly type: T;
  name?: string; // set by init function in Model or Field constructor
  // TODO: is there a default where we don't set or remove the attribute, then toModel will always return?
  _default?: V | DefaultFunction<V>;
  _alias?: string;
  _required?: boolean; // default: false
  _hidden?: boolean; // default: false
  _validator?: Validator<V>;
  _updateValidator?: UpdateValidator<V>;
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
    return this.validator((value: any) => {
      return new Promise<void>(() => {
        regex.exec(value.toString());
      });
    });
  }
  validator(validator: Validator<V>) {
    this._validator = validator;
    return this;
  }
  updateValidator(validator: UpdateValidator<V>) {
    this._updateValidator = validator;
    return this;
  }

  validate(value: V) {
    return this._validator!(value);
  }

  validateUpdate(value: ModelUpdateValue<V>) {
    return this._updateValidator!(value);
  }

  coerce(value: boolean) {
    this._coerce = value;
    return this;
  }

  alias(value: string) {
    this._alias = value;
    return this;
  }

  default(value: V | DefaultFunction<V>) {
    this._default = value;
    return this;
  }

  hidden(value: boolean) {
    this._hidden = value;
    return this;
  }

  required(value: boolean) {
    this._required = value;
    return this;
  }

  async toModel(name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase): Promise<void> {
    const value = tableData[this._alias || name];
    // TODO: Should we use default, validate table data or do other things with data coming out of the table?
    if (value === undefined) return;
    modelData[name] = value;
  }

  async toTable(name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase): Promise<void> {
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
        value = typeof def === 'function' ? (def as DefaultFunction<V>)(name, tableData, modelData, model) : def;
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
    modelData: ModelUpdate,
    tableData: UpdateMapValue,
    model: ModelBase,
  ): Promise<void> {
    let value = modelData[name];
    if (this._updateValidator) {
      const coerced = await this._updateValidator(value as ModelUpdateValue<V>);
      if (this._coerce && coerced !== undefined) {
        value = coerced as ModelUpdateValue<V>;
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

export class FieldCompositeSlot implements Field {
  name?: string;
  composite: FieldComposite;
  slot: number;
  constructor(composite: FieldComposite, slot: number) {
    this.composite = composite;
    this.slot = slot;
  }

  init(name: string): void {
    this.name = name;
  }

  async toModel(name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase) {
    this.composite.toModel(this.slot, name, tableData, modelData, model);
  }

  async toTable(name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase) {
    this.composite.toTable(this.slot, name, modelData, tableData, model);
  }

  async toTableUpdate(name: string, modelData: ModelUpdate, tableData: UpdateMapValue, model: ModelBase) {
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

  toModel(slot: number, name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase): void {
    const value = tableData[this.alias];
    if (typeof value !== 'string') return;
    const parts = value.split(this.delim);
    if (slot >= parts.length) return;
    modelData[name] = parts[slot];
  }

  toTable(slot: number, name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase): void {
    const value = modelData[name];
    if (value === undefined) return;
    if (typeof value === 'function') return; // throw and error
    const slots = (tableData[this.alias] as string)?.split(this.delim) || new Array<string>(this.count);
    slots[slot] = value!.toString();
    tableData[this.alias] = slots.join(this.delim);
  }

  toTableUpdate(slot: number, name: string, modelData: ModelUpdate, tableData: UpdateMapValue, model: ModelBase): void {
    this.toTable(slot, name, modelData, tableData as AttributeValueMap, model);
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
        newSlots[key] = () => new FieldCompositeSlot(this, slot);
      });
      this.slots = newSlots as CompositeSlot<T>;
    }
  }

  slot(value: number | string): FieldCompositeSlot {
    if (typeof value === 'number') return new FieldCompositeSlot(this, value);
    return this.slots[value]();
  }
}

class FieldSplit implements Field {
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
  async toModel(name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase): Promise<void> {
    const parts: string[] = [];
    this.aliases.forEach((alias) => {
      const part = tableData[alias];
      if (part) parts.push(part.toString());
    });
    modelData[name] = parts.join(this.delim);
  }

  async toTable(name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase): Promise<void> {
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
    modelData: ModelUpdate,
    tableData: UpdateMapValue,
    model: ModelBase,
  ): Promise<void> {
    this.toTable(name, modelData, tableData as AttributeValueMap, model);
  }
}

export class FieldExpression<V, T> extends FieldBase<V, T> {
  // Conditions
  path(): ConditionFunction {
    return Condition.path(this.name!);
  }

  size(): ConditionFunction {
    return Condition.size(this.name!);
  }

  eq(v: V): Condition {
    return Condition.eq(this.name!, v);
  }
  equal = this.eq;

  ne(v: V): Condition {
    return Condition.ne(this.name!, v);
  }
  notEqual = this.ne;

  lt(v: V): Condition {
    return Condition.lt(this.name!, v);
  }
  lessThen = this.lt;

  le(v: V): Condition {
    return Condition.le(this.name!, v);
  }
  lessThenEqual = this.le;

  gt(v: V): Condition {
    return Condition.gt(this.name!, v);
  }
  greaterThen = this.gt;

  ge(v: V): Condition {
    return Condition.ge(this.name!, v);
  }
  greaterThenEqual = this.ge;

  between(from: V, to: V): Condition {
    return Condition.between(this.name!, from, to);
  }

  in(v: V[]): Condition {
    return Condition.in(this.name!, v);
  }

  typeOf(type: AttributeType): Condition {
    return Condition.type(this.name!, type);
  }

  exists(): Condition {
    return Condition.exists(this.name!);
  }

  notExists(): Condition {
    return Condition.notExists(this.name!);
  }

  // Update
  getPath(path: string, defaultValue?: V) {
    return defaultValue === undefined ? Update.path(path) : Update.pathWithDefault(path, defaultValue);
  }
  del() {
    return Update.del();
  }
  set(value: V | UpdateFunction) {
    return Update.set(value);
  }
  setDefault(value: V | UpdateFunction) {
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
  inc(value: UpdateNumberValue) {
    return Update.inc(value);
  }
  dec(value: UpdateNumberValue) {
    return Update.dec(value);
  }
  add(left: UpdateNumberValue, right: UpdateNumberValue) {
    return Update.add(left, right);
  }
  sub(left: UpdateNumberValue, right: UpdateNumberValue) {
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
  add(value: AttributeSetValue) {
    return Update.addToSet(value);
  }
  remove(value: AttributeSetValue) {
    return Update.removeFromSet(value);
  }
}

export class FieldBinary extends FieldExpression<BinaryValue, 'B'> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }
}

export class FieldBoolean extends FieldExpression<boolean, 'BOOL'> {}

export class FieldNull extends FieldExpression<null, 'NULL'> {}

export class FieldStringSet extends FieldSet<StringSetValue, 'SS'> {}

export class FieldNumberSet extends FieldSet<NumberSetValue, 'NS'> {}

export class FieldBinarySet extends FieldSet<BinarySetValue, 'BS'> {}

export class FieldHidden extends FieldSet<undefined, 'HIDDEN'> {
  readonly type = 'HIDDEN';
  readonly _hidden = true;
  constructor() {
    super('HIDDEN');
  }
}

export class FieldListT<V extends AttributeValue, T> extends FieldExpression<V[], T> {
  // Condition
  size() {
    return Condition.size(this.name!);
  }

  // Update
  append(value: UpdateListValueT<V>) {
    return Update.append(value);
  }
  prepend(value: UpdateListValueT<V>) {
    return Update.prepend(value);
  }
  join(left: UpdateListValueT<V>, right: UpdateListValueT<V>) {
    return Update.join(left, right);
  }
  delIndexes(indexes: number[]) {
    return Update.delIndexes(indexes);
  }
  setIndexes(indexes: { [key: number]: V | UpdateFunction }) {
    return Update.setIndexes(indexes);
  }
}

export class FieldListTyped<V extends { [key: string]: any }, T> extends FieldListT<V, T> {
  schema?: ModelSchemaT<V>;

  constructor(type: T, schema: ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    if (schema) Object.keys(schema).forEach((key) => schema[key].init(key));
  }
}

export class FieldMapT<V extends AttributeValue, T> extends FieldExpression<{ [key: string]: V }, T> {
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
  schema?: ModelSchemaT<V>;

  constructor(type: T, schema?: ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    if (schema) Object.keys(schema).forEach((key) => schema[key].init(key));
  }
}

export class FieldDate extends FieldExpression<Date, 'DATE'> {
  readonly type = 'DATE';

  async toModel(name: string, tableData: AttributeValueMap, modelData: ModelData, model: ModelBase): Promise<void> {
    if (this._hidden) return;
    const value = tableData[this._alias || name];
    if (value === undefined) return;
    modelData[name] = new Date((value as number) * 1000);
  }

  async toTable(name: string, modelData: ModelData, tableData: AttributeValueMap, model: ModelBase): Promise<void> {
    const value = modelData[name];
    if (value === undefined) return;
    tableData[this._alias || name] = Math.round((value as Date).valueOf() / 1000);
  }

  async toTableUpdate(
    name: string,
    modelData: ModelUpdate,
    tableData: UpdateMapValue,
    model: ModelBase,
  ): Promise<void> {
    this.toTable(name, modelData, tableData as AttributeValueMap, model);
  }
}

export class FieldObject<V extends { [key: string]: any }, T> extends FieldExpression<V, T> {
  schema: ModelSchemaT<V>;

  constructor(type: T, schema: ModelSchemaT<V>, alias?: string) {
    super(type, alias);
    this.schema = schema;
    Object.keys(schema).forEach((key) => schema[key].init(key));
  }

  // Condition
  size() {
    return Condition.size(this.name!);
  }

  // Update
  map(map: { [key: string]: V }) {
    return Update.map(map);
  }
}

export namespace Schema {
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
    return new FieldNamedComposite(alias, slotMap, slots, delim);
  };

  export const compositeSlot = (comp: FieldComposite, slot: number) => {
    return comp.slot(slot);
  };

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

  export const listT = <V, T>(type: T, schema: ModelSchemaT<V>, alias?: string) => {
    return new FieldListTyped<V, T>(type, schema, alias);
  };

  export const list = (alias?: string) => {
    return new FieldListT('L', alias);
  };

  export const mapT = <V, T>(type: T, schema: ModelSchemaT<V>, alias?: string) => {
    return new FieldMapTyped<V, T>(type, schema, alias);
  };

  export const map = (alias?: string) => {
    return new FieldMapT('M', alias);
  };

  export const object = <V, T>(type: T, schema: ModelSchemaT<V>, alias?: string) => {
    return new FieldObject<V, T>(type, schema, alias);
  };

  export const date = (alias?: string) => {
    return new FieldDate('DATE', alias);
  };

  export const hidden = () => {
    return new FieldHidden();
  };
}
