import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Field } from './Fields';
import { TableBase, Table } from './Table';
import { Update } from './Update';

export interface ModelBase {
  name?: string;
  schema: Model.ModelSchema;
  table: TableBase;
  onError?: () => void;
}

export class Model<KEY extends { [key: string]: any }, MODEL extends KEY = KEY> implements ModelBase {
  name?: string;
  schema: Model.ModelSchemaT<MODEL>;
  table: TableBase;
  onError?: () => void;

  constructor(params: Model.ModelParams<KEY, MODEL>) {
    this.name = params.name;
    this.schema = params.schema;
    this.table = params.table;
    Object.keys(this.schema).forEach((key) => this.schema[key].init(key));
  }

  createSet(list: string[] | number[] | Table.BinaryValue[], options?: DocumentClient.CreateSetOptions) {
    return this.table.client!.createSet(list, options);
  }

  createStringSet(list: string[], options: DocumentClient.CreateSetOptions = {}): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  createNumberSet(list: number[], options: DocumentClient.CreateSetOptions = {}): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  createBinarySet(list: Table.BinaryValue[], options: DocumentClient.CreateSetOptions = {}): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  private async mapUpdateModelToTable(
    data: Model.ModelUpdateT<MODEL>,
  ): Promise<{
    key: Table.PrimaryKeyValueMap;
    item: Update.UpdateMapValue;
  }> {
    const tableData: Table.AttributeValueMap = {};
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
    data: Model.ModelData,
  ): Promise<{
    key: Table.PrimaryKeyValueMap;
    item: Table.AttributeValueMap;
  }> {
    const tableData: Table.AttributeValueMap = {};
    // enumerate schema so each field gets called
    // ... handled by table to* if supported (do we need each field to return array of names proccessed)
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Field = this.schema[name];
      await schema.toTable(name, data, tableData, this);
    }
    return this.splitTableData(tableData);
  }

  splitTableData(data: Table.AttributeValueMap) {
    const key: Table.PrimaryKeyValueMap = {};
    const item: Table.AttributeValueMap = { ...data };
    Object.keys(this.table.keySchema).forEach((name) => {
      if (data[name] === undefined) return;
      key[name] = data[name] as Table.PrimaryAttributeValue;
      delete item[name];
    });
    return { key, item };
  }

  async mapToTableKey(key: Model.ModelCoreT<KEY>): Promise<Table.PrimaryKeyValueMap> {
    return (await this.mapModelToTable(key)).key;
  }

  mapToTableKeyAndItem(data: Model.ModelCoreT<MODEL>) {
    return this.mapModelToTable(data);
  }

  async mapToModel(data: Table.AttributeValueMap): Promise<Model.ModelOutT<MODEL>> {
    const out: Model.ModelOut = {};
    const keys = Object.keys(this.schema);
    for (const name of keys) {
      const schema: Field = this.schema[name];
      await schema.toModel(name, data, out, this);
    }
    return out as Model.ModelOutT<MODEL>;
  }

  async getParams(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemInput> {
    const tableKey = await this.mapToTableKey(key);
    return this.table.getParams(tableKey, options);
  }
  async putParams(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<DocumentClient.PutItemInput> {
    const tableData = await this.mapToTableKeyAndItem(data);
    return this.table.putParams(tableData.key, tableData.item, options);
  }
  async deleteParams(
    key: Model.ModelCoreT<KEY>,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemInput> {
    const tableKey = await this.mapToTableKey(key);
    return this.table.deleteParams(tableKey, options);
  }
  async updateParams(
    data: Model.ModelUpdateT<MODEL>,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemInput> {
    const tableData = await this.mapUpdateModelToTable(data);
    return this.table.updateParams(tableData.key, tableData.item, options);
  }

  async get(key: Model.ModelCoreT<KEY>, options?: Table.GetOptions): Promise<Model.ModelOutT<MODEL> | undefined> {
    const tableKey = await this.mapToTableKey(key);
    const result = await this.table.get(tableKey, options);
    return result.Item ? this.mapToModel(result.Item!) : undefined;
  }
  async put(data: Model.ModelCoreT<MODEL>, options?: Table.PutOptions): Promise<Model.ModelOutT<MODEL>> {
    const tableData = await this.mapToTableKeyAndItem(data);
    await this.table.put(tableData.key, tableData.item, options);
    return this.mapToModel({ ...tableData.key, ...tableData.item });
  }
  async delete(key: Model.ModelCoreT<KEY>, options?: Table.DeleteOptions): Promise<Model.ModelOutT<MODEL> | undefined> {
    const tableKey = await this.mapToTableKey(key);
    const result = await this.table.delete(tableKey, options);
    return result.Attributes ? this.mapToModel(result.Attributes) : undefined;
  }
  async update(
    data: Model.ModelUpdateT<MODEL>,
    options?: Table.UpdateOptions,
  ): Promise<Model.ModelOutT<MODEL> | undefined> {
    const tableData = await this.mapUpdateModelToTable(data);
    const result = await this.table.update(tableData.key, tableData.item, options);
    return result.Attributes ? this.mapToModel(result.Attributes) : undefined;
  }
}

/* tslint:disable:no-namespace */
export namespace Model {
  export type ModelType = number | string | boolean | null | object;
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

  export type ModelUpdateValue<T> = Extract<T, ModelType> | null | Update.UpdateInput<string>;
  export type ModelUpdateT<T> = {
    [P in keyof Table.Optional<T>]: ModelUpdateValue<T[P]>;
  };
  export type ModelUpdate = {
    [key: string]: ModelUpdateValue<ModelType>;
  };

  export interface ModelParams<KEY, MODEL extends KEY = KEY> {
    name?: string;
    schema: ModelSchemaT<MODEL>;
    table: TableBase;
  }
  export type ModelData = { [key: string]: ModelType };
}
