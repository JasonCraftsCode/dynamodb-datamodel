// import { AWSError, Response } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
// <reference types="aws-sdk/clients/dynamodb" />
import { Condition } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyConditionExpression, KeyCondition } from './KeyCondition';
import { Update, UpdateExpression } from './Update';

function getKeyName(keySchema: Table.PrimaryKey.KeyTypesMap, type: Table.PrimaryKey.KeyTypes): string {
  let name = '';
  Object.keys(keySchema).forEach((key) => {
    if (keySchema[key].keyType === type) {
      name = key;
    }
  });
  return name;
}

export class Index {
  name: string;
  keySchema: Table.PrimaryKey.KeyTypesMap;
  projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  };
  table?: Table;

  constructor(params: Index.IndexParams) {
    this.name = params.name;
    this.keySchema = params.keySchema;
    this.projection = params.projection;
  }

  init(table: Table) {
    this.table = table;
  }

  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }
  // CC: here to {
  getQueryOptions(options: Table.QueryOptions = {}): Table.QueryOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }

  getScanOptions(options: Table.ScanOptions = {}): Table.ScanOptions {
    return { ...options, params: { IndexName: this.name, ...options.params } };
  }
  // } CC
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): DocumentClient.QueryInput {
    return this.table!.queryParams(key, this.getQueryOptions(options));
  }
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    return this.table!.scanParams(this.getScanOptions(options));
  }

  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions) {
    return this.table!.query(key, this.getQueryOptions(options));
  }
  scan(options?: Table.ScanOptions) {
    return this.table!.scan(this.getScanOptions(options));
  }
}

/* tslint:disable:no-namespace */
export namespace Index /* istanbul ignore next: needed for ts with es5 */ {
  export interface IndexParams {
    name: string;
    keySchema: Table.PrimaryKey.KeyTypesMap;
    projection: {
      type: Table.ProjectionType;
      attributes?: string[];
    };
  }

  export interface DefaultGlobalIndexKey {
    G0P: Table.PrimaryKey.PartitionString;
    G0S?: Table.PrimaryKey.SortString;
  }

  export interface DefaultLocalIndexKey {
    P: Table.PrimaryKey.PartitionString;
    L0S?: Table.PrimaryKey.SortString;
  }

  // IndexT
  export interface IndexParamsT<KEY> extends IndexParams {
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;
  }

  export interface IndexT<KEY = DefaultGlobalIndexKey> extends Index {
    keySchema: Table.PrimaryKey.KeyTypesMapT<KEY>;

    queryParams(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;
    query(key: Table.PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
  }

  export function createIndex<KEY = DefaultGlobalIndexKey>(params: IndexParamsT<KEY>): IndexT<KEY> {
    return new Index(params) as IndexT<KEY>;
  }
}

export class Table {
  name: string;
  keyAttributes: Table.PrimaryKey.AttributeTypesMap;
  keySchema: Table.PrimaryKey.KeyTypesMap;
  globalIndexes?: Index[] = [];
  localIndexes?: Index[] = [];
  client: DocumentClient;
  onError: (msg: string) => void = (msg: string) => {
    throw new Error(msg);
  };

  constructor(params: Table.TableParams) {
    // validateTable(params);
    this.name = params.name;
    this.keyAttributes = params.keyAttributes;
    this.keySchema = params.keySchema;
    this.globalIndexes = params.globalIndexes;
    this.globalIndexes?.forEach((gsi) => gsi.init(this));
    this.localIndexes = params.localIndexes;
    this.localIndexes?.forEach((lsi) => lsi.init(this));
    this.client = params.client;
  }

  getPartitionKey(): string {
    return getKeyName(this.keySchema, 'HASH');
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  createSet(list: string[] | number[] | Table.BinaryValue[], options?: DocumentClient.CreateSetOptions) {
    return this.client!.createSet(list, options);
  }

  createStringSet(list: string[], options?: DocumentClient.CreateSetOptions): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  createNumberSet(list: number[], options?: DocumentClient.CreateSetOptions): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  createBinarySet(list: Table.BinaryValue[], options?: DocumentClient.CreateSetOptions): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  // Action Params:
  /**
   * @returns Input params for {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property | DocumentClient.get}
   */
  getParams(key: Table.PrimaryKey.AttributeValuesMap, options: Table.GetOptions = {}): Table.GetInput {
    return {
      TableName: this.name,
      Key: key,
      ...options.params,
    };
  }
  deleteParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    options: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...options.params,
    };
  }
  putParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    options: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    let condInput;
    switch (options.writeOptions) {
      case 'Exists':
        condInput = Condition.buildInput(Condition.exists(this.getPartitionKey()), options.attributes);
        break;
      case 'NotExists':
        condInput = Condition.buildInput(Condition.notExists(this.getPartitionKey()), options.attributes);
        break;
      default:
        condInput = undefined;
        break;
    }
    return {
      TableName: this.name,
      Item: { ...key, ...item },
      ...condInput,
      ...options.params,
    };
  }
  updateParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.UpdateMapValue,
    options: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...Update.buildInput(item, new UpdateExpression(options.attributes)),
      ...options.params,
    };
  }
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options: Table.QueryOptions = {}): DocumentClient.QueryInput {
    return {
      TableName: this.name,
      ...KeyCondition.buildInput(key, new KeyConditionExpression(options.attributes)),
      ...options.params,
    };
  }
  scanParams(options: Table.ScanOptions = {}): DocumentClient.ScanInput {
    return {
      TableName: this.name,
      ...options.params,
    };
  }

  // actions:
  get(key: Table.PrimaryKey.AttributeValuesMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(this.getParams(key, options)).promise();
  }
  delete(
    key: Table.PrimaryKey.AttributeValuesMap,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(this.deleteParams(key, options)).promise();
  }
  put(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Table.AttributeValuesMap,
    options?: Table.PutOptions,
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(this.putParams(key, items, options)).promise();
  }
  update(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Update.UpdateMapValue,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(this.updateParams(key, items, options)).promise();
  }
  // query and scan are also used to access indexes
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    return this.client.query(this.queryParams(key, options)).promise();
  }
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(this.scanParams(options)).promise();
  }
}

/* tslint:disable:no-namespace */
export namespace Table /* istanbul ignore next: needed for ts with es5 */ {
  // export type PromiseResult<D, E> = D & { $response: Response<D, E> };
  export type Optional<T> = { [P in keyof T]?: T[P] };

  export type AttributeTypes = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';

  export type BinaryValue = DocumentClient.binaryType;
  export type StringSetValue = DocumentClient.StringSet;
  export type NumberSetValue = DocumentClient.NumberSet;
  export type BinarySetValue = DocumentClient.BinarySet;
  export type MapValue = { [key: string]: AttributeValues };
  export type ListValue = AttributeValues[];

  export type AttributeSetValues = StringSetValue | NumberSetValue | BinarySetValue;
  export type AttributeValues =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | AttributeSetValues
    | MapValue
    | ListValue;

  export type AttributeValuesMap = { [key: string]: AttributeValues };

  export interface TableParams {
    name: string;
    keyAttributes: PrimaryKey.AttributeTypesMap;
    keySchema: PrimaryKey.KeyTypesMap;
    globalIndexes?: Index[];
    localIndexes?: Index[];
    client: DocumentClient;
    onError?: (msg: string) => void;
  }

  export class PrimaryKey {
    static readonly StringType: { type: 'S' } = { type: 'S' };
    static readonly NumberType: { type: 'N' } = { type: 'N' };
    static readonly BinaryType: { type: 'B' } = { type: 'B' };
    static readonly PartitionKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };
    static readonly SortKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };
  }
  export namespace PrimaryKey {
    /* tslint:disable:no-shadowed-variable */
    export type AttributeValues = string | number | Table.BinaryValue;
    // ScalarAttributeType
    /* tslint:disable:no-shadowed-variable */
    export type AttributeTypes = 'B' | 'N' | 'S';
    export type KeyTypes = 'HASH' | 'RANGE';

    export type PartitionString = string | { type: 'S' } | { keyType: 'HASH' };
    export type PartitionNumber = number | { type: 'N' } | { keyType: 'HASH' };
    export type PartitionBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'HASH' };

    export type SortString = string | { type: 'S' } | { keyType: 'RANGE' } | KeyCondition.StringResolver;
    export type SortNumber = number | { type: 'N' } | { keyType: 'RANGE' } | KeyCondition.NumberResolver;
    export type SortBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'RANGE' } | KeyCondition.BinaryResolver;

    // *Map used as key based params in Table
    export type AttributeTypesMap = { [key: string]: { type: AttributeTypes } };
    export type KeyTypesMap = { [key: string]: { keyType: KeyTypes } };
    export type KeyQueryMap = { [key: string]: AttributeValues | KeyCondition.AttributeResolver };
    /* tslint:disable:sno-shadowed-variable */
    export type AttributeValuesMap = { [key: string]: AttributeValues };

    // *MapT used as key based params in TableT
    export type AttributeTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { type: AttributeTypes }>;
    };
    export type KeyTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { keyType: KeyTypes }>;
    };
    export type KeyQueryMapT<T> = {
      [P in keyof T]: Extract<T[P], Table.AttributeValues | KeyCondition.AttributeResolver>;
    };
    export type AttributeValuesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], Table.AttributeValues>;
    };
  }

  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  // Omit legacy attributes
  //   * @typedef GetInput DocumentClient.GetItemInput
  /**
   * Input params for {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property | DocumentClient.get}
   */
  export interface GetInput extends Omit<DocumentClient.GetItemInput, 'AttributesToGet'> {}
  export interface PutInput extends Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'> {}
  export interface DeleteInput extends Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'> {}
  export interface UpdateInput
    extends Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {}
  export interface QueryInput
    extends Omit<
      DocumentClient.QueryInput,
      'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
    > {}
  export interface ScanInput
    extends Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'> {}

  export interface BaseOptions<T> {
    attributes?: ExpressionAttributes;
    params?: Optional<T>;
  }
  export interface GetOptions extends BaseOptions<GetInput> {}
  export interface DeleteOptions extends BaseOptions<DeleteInput> {}
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';
  export interface PutOptions extends BaseOptions<PutInput> {
    writeOptions?: PutWriteOptions;
  }
  export interface UpdateOptions extends BaseOptions<UpdateInput> {}
  export interface QueryOptions extends BaseOptions<QueryInput> {}
  export interface ScanOptions extends BaseOptions<ScanInput> {}

  // Default Key definitions
  // StringSortKey should be optional (?) since for update actions it is optional
  export interface DefaultTableKey {
    P: PrimaryKey.PartitionString;
    S?: PrimaryKey.SortString;
  }

  // TableT
  export interface TableParamsT<KEY, ATTRIBUTES> extends TableParams {
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;
  }

  export interface TableT<KEY = DefaultTableKey, ATTRIBUTES = KEY> extends Table {
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;

    getParams(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Table.GetInput;
    deleteParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): DocumentClient.DeleteItemInput;
    putParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): DocumentClient.PutItemInput;
    updateParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: Table.UpdateOptions,
    ): DocumentClient.UpdateItemInput;
    queryParams(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;
    scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

    // actions:
    get(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;
    delete(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): Promise<DocumentClient.DeleteItemOutput>;
    put(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): Promise<DocumentClient.PutItemOutput>;
    update(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.UpdateMapValue,
      options?: UpdateOptions,
    ): Promise<DocumentClient.UpdateItemOutput>;
    // query and scan are also used to access indexes
    query(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;
    scan(options?: ScanOptions): Promise<DocumentClient.ScanOutput>;
  }

  export function createTable<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY>(
    params: TableParamsT<KEY, ATTRIBUTES>,
  ): TableT<KEY, ATTRIBUTES> {
    return new Table(params) as TableT<KEY, ATTRIBUTES>;
  }
}
