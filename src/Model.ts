import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Condition } from './Condition';
import { Fields } from './Fields';
import { Table } from './Table';
import { Update } from './Update';

export class Model implements Model.ModelBase {
  name?: string;
  schema: Model.ModelSchema;
  table: Table;
  onError?: () => void;

  constructor(params: Model.ModelParams) {
    this.name = params.name;
    this.schema = params.schema;
    this.table = params.table;
    Object.keys(this.schema).forEach((key) => this.schema[key].init(key));
  }

  private splitTableData(data: Table.AttributeValuesMap) {
    const key: Table.PrimaryKey.AttributeValuesMap = {};
    const item: Table.AttributeValuesMap = { ...data };
    Object.keys(this.table.keySchema).forEach((name) => {
      if (data[name] === undefined) return;
      key[name] = data[name] as Table.PrimaryKey.AttributeValues;
      delete item[name];
    });
    return { key, item };
  }

  async toTable(data: Model.ModelData, context: Fields.TableContext): Promise<Model.TableData> {
    const tableData: Table.AttributeValuesMap = {};
    // enumerate schema so each field gets called
    // ... handled by table to* if supported (do we need each field to return array of names proccessed)
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Fields.Field = this.schema[name];
      const result = schema.toTable(name, data, tableData, context);
      if (result !== undefined) await result;
    }
    const { key, item } = this.splitTableData(tableData);
    return { key, item, conditions: context.conditions };
  }

  async toTableKey(key: Model.ModelCore, context: Fields.TableContext): Promise<Table.PrimaryKey.AttributeValuesMap> {
    return (await this.toTable(key, context)).key;
  }

  async toTableUpdate(data: Model.ModelUpdate, context: Fields.TableContext): Promise<Model.TableUpdateData> {
    const tableData: Table.AttributeValuesMap = {};
    // enumerate schema so each field gets called
    // ... handled by table to* if supported (do we need each field to return array of names proccessed)
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Fields.Field = this.schema[name];
      const result = schema.toTableUpdate(name, data, tableData, context);
      if (result !== undefined) await result;
    }
    const { key, item } = this.splitTableData(tableData);
    return { key, item, conditions: context.conditions };
  }

  async toModel(
    data: Table.AttributeValuesMap | undefined,
    context: Fields.ModelContext,
  ): Promise<Model.ModelOut | undefined> {
    data = data || {};
    const out: Model.ModelOut = {};
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Fields.Field = this.schema[name];
      const result = schema.toModel(name, data, out, context);
      if (result !== undefined) await result;
    }
    if (Object.keys(out).length > 0) return out as Model.ModelOut;
    return undefined;
  }

  async getParams(key: Model.ModelCore, options?: Table.GetOptions): Promise<DocumentClient.GetItemInput> {
    const tableKey = await this.toTableKey(key, { action: 'get', model: this });
    return this.table.getParams(tableKey, options);
  }
  async putParams(data: Model.ModelCore, options: Table.PutOptions = {}): Promise<DocumentClient.PutItemInput> {
    const tableData = await this.toTable(data, { action: 'put', conditions: [], model: this });
    return this.table.putParams(tableData.key, tableData.item, options);
  }
  async deleteParams(key: Model.ModelCore, options?: Table.DeleteOptions): Promise<DocumentClient.DeleteItemInput> {
    const tableKey = await this.toTableKey(key, { action: 'delete', conditions: [], model: this });
    return this.table.deleteParams(tableKey, options);
  }
  async updateParams(data: Model.ModelUpdate, options?: Table.UpdateOptions): Promise<DocumentClient.UpdateItemInput> {
    const tableData = await this.toTableUpdate(data, { action: 'update', conditions: [], model: this });
    return this.table.updateParams(tableData.key, tableData.item, options);
  }

  async get(key: Model.ModelCore, options?: Table.GetOptions): Promise<Model.ModelOut | undefined> {
    const tableKey = await this.toTableKey(key, { action: 'get', model: this });
    const result = await this.table.get(tableKey, options);
    return this.toModel(result.Item, { action: 'get', model: this });
  }
  async put(data: Model.ModelCore, options?: Table.PutOptions): Promise<Model.ModelOut | undefined> {
    const context: Fields.TableContext = { action: 'put', conditions: [], model: this };
    const tableData = await this.toTable(data, context);
    await this.table.put(tableData.key, tableData.item, options);
    return this.toModel({ ...tableData.key, ...tableData.item }, { action: 'put', model: this });
  }
  async delete(key: Model.ModelCore, options?: Table.DeleteOptions): Promise<Model.ModelOut | undefined> {
    const tableKey = await this.toTableKey(key, { action: 'delete', conditions: [], model: this });
    const result = await this.table.delete(tableKey, options);
    return this.toModel(result.Attributes, { action: 'delete', model: this });
  }
  async update(data: Model.ModelUpdate, options?: Table.UpdateOptions): Promise<Model.ModelOut | undefined> {
    const tableData = await this.toTableUpdate(data, { action: 'update', conditions: [], model: this });
    const result = await this.table.update(tableData.key, tableData.item, options);
    return this.toModel(result.Attributes, { action: 'update', model: this });
  }
}

/* tslint:disable:no-namespace */
export namespace Model /* istanbul ignore next: needed for ts with es5 */ {
  export interface ModelBase {
    name?: string;
    schema: Model.ModelSchema;
    table: Table;
    onError?: () => void;
  }

  export type ModelType = number | string | boolean | null | object;
  export type ModelData = { [key: string]: ModelType };

  export type TableData = {
    key: Table.PrimaryKey.AttributeValuesMap;
    item?: Table.AttributeValuesMap;
    conditions?: Condition.Resolver[];
  };

  export type TableUpdateData = {
    key: Table.PrimaryKey.AttributeValuesMap;
    item?: Update.UpdateMapValue;
    conditions?: Condition.Resolver[];
  };

  export interface ModelParams {
    name?: string;
    schema: ModelSchema;
    table: Table;
  }

  export type ModelUpdateValue<T> = Extract<T, ModelType> | null | Update.UpdateInput<string>;

  // *Map used as model data based params in Model
  export type ModelSchema = { [key: string]: Fields.Field };
  export type ModelCore = { [key: string]: ModelType };
  export type ModelOut = { [key: string]: ModelType };
  export type ModelUpdate = {
    [key: string]: ModelUpdateValue<ModelType>;
  };

  // ModelT
  // *MapT used as model data based params in ModelT
  export type ModelSchemaT<T extends { [key: string]: any }> = {
    [P in keyof Required<T>]: Fields.Field;
  };
  export type ModelCoreT<T> = {
    [P in keyof T]: Extract<T[P], ModelType>;
  };
  export type ModelOutT<T> = {
    [P in keyof T]: Extract<T[P], ModelType>;
  };
  export type ModelUpdateT<T> = {
    [P in keyof Table.Optional<T>]: ModelUpdateValue<T[P]>;
  };

  export interface ModelParamsT<KEY, MODEL extends KEY = KEY> extends ModelParams {
    schema: ModelSchemaT<MODEL>;
  }

  export interface ModelT<KEY extends { [key: string]: any }, MODEL extends KEY = KEY> extends Model {
    schema: Model.ModelSchemaT<MODEL>;

    toTable(data: Model.ModelCoreT<MODEL>): Promise<Model.TableData>;
    toTableKey(data: Model.ModelCoreT<KEY>): Promise<Table.PrimaryKey.AttributeValuesMap>;
    toTableUpdate(data: Model.ModelUpdateT<MODEL>): Promise<Model.TableUpdateData>;
    toModel(data: Table.AttributeValuesMap): Promise<Model.ModelOutT<MODEL>>;

    getParams(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemInput>;
    putParams(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<DocumentClient.PutItemInput>;
    deleteParams(key: Model.ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<DocumentClient.DeleteItemInput>;
    updateParams(
      data: Model.ModelUpdateT<MODEL>,
      options?: Table.UpdateOptions,
    ): Promise<DocumentClient.UpdateItemInput>;

    get(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): Promise<Model.ModelOutT<MODEL> | undefined>;
    put(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<Model.ModelOutT<MODEL>>;
    delete(key: Model.ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<Model.ModelOutT<MODEL> | undefined>;
    update(data: Model.ModelUpdateT<MODEL>, options?: Table.UpdateOptions): Promise<Model.ModelOutT<MODEL> | undefined>;
  }

  export function createModel<KEY extends { [key: string]: any }, MODEL extends KEY = KEY>(
    params: ModelParamsT<KEY, MODEL>,
  ) {
    return new Model(params) as Model.ModelT<KEY, MODEL>;
  }
}
