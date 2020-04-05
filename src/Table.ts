import { AWSError } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

import { BinaryValue, AttributeValueMap, Optional, PromiseResult } from './Common';
import { Condition, buildConditionInput } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyConditionExpression, buildKeyConditionInput } from './KeyCondition';
import { UpdateMapValue, buildUpdateInput, UpdateExpression } from './Update';

function getKeyName(keySchema: Table.PrimaryKeySchema, type: Table.PrimaryKeyType): string {
  let name = '';
  Object.keys(keySchema).forEach((key) => {
    if (keySchema[key].keyType === type) {
      name = key;
    }
  });
  return name;
}

class AWSEnhancedError extends Error {
  awsError: AWSError;
  args: any[];
  constructor(message: string, error: AWSError, args: any[]) {
    super(message);
    this.awsError = error;
    this.args = args;
  }
}

const functionFor = (target: any, name: string, targetName: string) => (...args: any[]) => {
  const rethrow = (error: AWSError) => {
    throw new AWSEnhancedError(`Error calling ${targetName}.${name}: ${error.message}`, error, args);
  };
  try {
    const result = target[name](...args);
    return result.promise ? result.promise().catch(rethrow) : result;
  } catch (err) {
    return rethrow(err);
  }
};

export interface IndexBase {
  name: string;
  keySchema: Table.PrimaryKeySchema;
  projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  };
  init(table: TableBase): void;

  getPartitionKey(): string;
  getSortKey(): string;

  queryParams(key: Table.PrimaryKeyQuery, options?: Table.QueryOptions): DocumentClient.QueryInput;
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;
  query(
    key: Table.PrimaryKeyQuery,
    options?: Table.QueryOptions,
  ): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>>;
  scan(options?: Table.ScanOptions): Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>>;
}

export interface IndexParams<KEY> {
  name: string;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  };
}

interface DefaultGlobalIndexKey {
  G0P: Table.StringPartitionKey;
  G0S?: Table.StringSortKey;
}
/*
interface DefaultLocalIndexKey {
  P: Table.StringPartitionKey;
  L0S?: Table.StringSortKey;
}
*/
export class Index<KEY = DefaultGlobalIndexKey> implements IndexBase {
  name: string;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  };
  private table?: TableBase;

  constructor(params: IndexParams<KEY>) {
    this.name = params.name;
    this.keySchema = params.keySchema;
    this.projection = params.projection;
  }

  init(table: TableBase) {
    this.table = table;
  }

  getPartitionKey(): string {
    return getKeyName(this.keySchema, Table.PrimaryKeyType.Hash);
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, Table.PrimaryKeyType.Range);
  }

  queryParams(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput {
    const o = {
      IndexName: options?.IndexName || this.name,
      ...options,
    };
    return this.table!.queryParams(key, o);
  }
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    const o = {
      IndexName: options?.IndexName || this.name,
      ...options,
    };
    return this.table!.scanParams(o);
  }

  query(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions) {
    const o = {
      IndexName: options?.IndexName || this.name,
      ...options,
    };
    return this.table!.query(key, o);
  }
  scan(options?: Table.ScanOptions) {
    const o = {
      IndexName: options?.IndexName || this.name,
      ...options,
    };
    return this.table!.scan(o);
  }
}

export interface TableBase {
  name: string;
  keyAttributes: Table.PrimaryAttributeDefinitions;
  keySchema: Table.PrimaryKeySchema;
  globalIndexes?: IndexBase[];
  localIndexes?: IndexBase[];
  client?: DocumentClient;

  getPartitionKey(): string;
  getSortKey(): string;

  getParams(key: Table.PrimaryKeyValueMap, options?: Table.GetOptions): DocumentClient.GetItemInput;
  deleteParams(key: Table.PrimaryKeyValueMap, options?: Table.DeleteOptions): DocumentClient.DeleteItemInput;
  putParams(
    key: Table.PrimaryKeyValueMap,
    item?: AttributeValueMap,
    options?: Table.PutOptions,
  ): DocumentClient.PutItemInput;
  updateParams(
    key: Table.PrimaryKeyValueMap,
    item?: UpdateMapValue,
    options?: Table.UpdateOptions,
  ): DocumentClient.UpdateItemInput;
  queryParams(key: Table.PrimaryKeyQuery, options?: Table.QueryOptions): DocumentClient.QueryInput;
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

  get(key: Table.PrimaryKeyValueMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;
  delete(
    key: Table.PrimaryKeyValueMap,
    options?: Table.DeleteOptions,
  ): Promise<PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>;
  put(
    key: Table.PrimaryKeyValueMap,
    item?: AttributeValueMap,
    options?: Table.PutOptions,
  ): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>>;
  update(
    key: Table.PrimaryKeyValueMap,
    item?: UpdateMapValue,
    options?: Table.UpdateOptions,
  ): Promise<PromiseResult<DocumentClient.UpdateItemOutput, AWSError>>;
  query(
    key: Table.PrimaryKeyQuery,
    options?: Table.QueryOptions,
  ): Promise<PromiseResult<DocumentClient.QueryOutput, AWSError>>;
  scan(options?: Table.ScanOptions): Promise<PromiseResult<DocumentClient.ScanOutput, AWSError>>;
}

export interface TableParams<KEY, ATTRIBUTES> {
  name: string;
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  globalIndexes?: IndexBase[];
  localIndexes?: IndexBase[];
  client?: DocumentClient;
}

// StringSortKey should be optional (?) since for update actions it is optional
interface DefaultTableKey {
  P: Table.StringPartitionKey;
  S?: Table.StringSortKey;
}

export class Table<KEY = DefaultTableKey, ATTRIBUTES = KEY> implements TableBase {
  name: string;
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  globalIndexes?: IndexBase[] = [];
  localIndexes?: IndexBase[] = [];
  client?: DocumentClient;

  constructor(params: TableParams<KEY, ATTRIBUTES>) {
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
    return getKeyName(this.keySchema, Table.PrimaryKeyType.Hash);
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, Table.PrimaryKeyType.Range);
  }

  // Action Params:
  getParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    { client, attributes, ...options }: Table.GetOptions = {},
  ): DocumentClient.GetItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...options,
    };
  }
  deleteParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    { client, attributes, ...options }: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...options,
    };
  }
  putParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    item?: AttributeValueMap,
    { client, attributes, writeOptions, ...options }: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    let condInput;
    switch (writeOptions) {
      case Table.PutWriteOptions.Exists:
        condInput = buildConditionInput(Condition.exists(this.getPartitionKey()), attributes);
        break;
      case Table.PutWriteOptions.NotExists:
        condInput = buildConditionInput(Condition.notExists(this.getPartitionKey()), attributes);
        break;
      default:
        condInput = undefined;
        break;
    }
    return {
      TableName: this.name,
      Item: { ...key, ...item },
      ...condInput,
      ...options,
    };
  }
  updateParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    item?: UpdateMapValue,
    { client, attributes, ...options }: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...buildUpdateInput(item, new UpdateExpression(attributes)),
      ...options,
    };
  }
  queryParams(
    key: Table.PrimaryKeyQueryT<KEY>,
    { client, attributes, ...options }: Table.QueryOptions = {},
  ): DocumentClient.QueryInput {
    return {
      TableName: this.name,
      ...buildKeyConditionInput(key, attributes),
      ...options,
    };
  }
  scanParams({ client, attributes, ...options }: Table.ScanOptions = {}): DocumentClient.ScanInput {
    return {
      TableName: this.name,
      ...options,
    };
  }

  // actions:
  get(key: Table.PrimaryKeyValueMapT<KEY>, options?: Table.GetOptions) {
    const client = options?.client || this.client!;
    const params = this.getParams(key, options);
    return functionFor(client, 'get', 'DocumentClient')(params);
  }
  delete(key: Table.PrimaryKeyValueMapT<KEY>, options?: Table.DeleteOptions) {
    const client = options?.client || this.client!;
    const params = this.deleteParams(key, options);
    return client.delete(params).promise();
  }
  put(key: Table.PrimaryKeyValueMapT<KEY>, items?: AttributeValueMap, options?: Table.PutOptions) {
    const client = options?.client || this.client!;
    const params = this.putParams(key, items, options);
    return client.put(params).promise();
  }
  update(key: Table.PrimaryKeyValueMapT<KEY>, items?: UpdateMapValue, options?: Table.UpdateOptions) {
    const client = options?.client || this.client!;
    const params = this.updateParams(key, items, options);
    return client.update(params).promise();
  }
  // query and scan are also used to access indexes
  query(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions) {
    const client = options?.client || this.client!;
    const params = this.queryParams(key, options);
    return client.query(params).promise();
  }
  scan(options?: Table.ScanOptions) {
    const client = options?.client || this.client!;
    const params = this.scanParams(options);
    return client.scan(params).promise();
  }
}

export namespace Table {
  // Omit legacy attributes
  type GetInput = Omit<DocumentClient.GetItemInput, 'AttributesToGet'>;
  type PutInput = Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'>;
  type DeleteInput = Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'>;
  type UpdateInput = Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'>;
  type QueryInput = Omit<
    DocumentClient.QueryInput,
    'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
  >;
  type ScanInput = Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'>;

  export type PrimaryAttributeValue = string | number | DocumentClient.binaryType;

  // ScalarAttributeType
  export type PrimaryAttributeType = 'B' | 'N' | 'S';
  export const PrimaryAttribute = { Binary: 'B', Number: 'N', String: 'S' };
  Object.freeze(PrimaryAttribute);
  /*
  export enum PrimaryAttributeType {
    Binary = 'B',
    Number = 'N',
    String = 'S',
  }
  */

  // KeyType
  // export type PrimaryKeyType = 'HASH' | 'RANGE';
  // export const PrimaryKey = { Partition: 'HASH', Sort: 'RANGE' }; Object.freeze(PrimaryKey);
  export enum PrimaryKeyType {
    Hash = 'HASH',
    Range = 'RANGE',
  }

  // export type SortComparisionOperator = '=' | '<' | '<=' | '>' | '>=' | 'BETWEEN' | begins_with'
  /*
  export const SortComparisionOperator = {
    EqualL: '=',
    LessThen: '<',
    LessThenEqual: '<=',
    GreaterThen: '>',
    GreaterThenEqual: '>=',
    Between: 'BETWEEN',
    BeginsWidth: 'begins_with',
  };
  */
  // ComparisonOperator (minus )
  export enum SortComparisonOperator {
    Equal = '=',
    LessThen = '<',
    LessThenEqual = '<=',
    GreaterThen = '>',
    GreaterThenEqual = '>=',
    Between = 'BETWEEN',
    BeginsWidth = 'begins_with',
  }

  // export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';
  // export const ProjectionType = { All: 'ALL', KeysOnly: 'KEYS_ONLY', Include: 'INCLUDE' }; Object.freeze(ProjectionType);
  // ProjectionType
  export enum ProjectionType {
    All = 'ALL',
    KeysOnly = 'KEYS_ONLY',
    Include = 'INCLUDE',
  }

  export type ValueKeyConditionBase<T extends PrimaryAttributeType> = (
    name: string,
    exp: KeyConditionExpression,
    type?: T,
  ) => void;

  export type StringKeyCondition = ValueKeyConditionBase<'S'>;
  export type NumberKeyCondition = ValueKeyConditionBase<'N'>;
  export type BinaryKeyCondition = ValueKeyConditionBase<'B'>;
  export type KeyConditionValue = StringKeyCondition | NumberKeyCondition | BinaryKeyCondition;

  type StringType = string | { type: 'S' };
  type NumberType = number | { type: 'N' };
  type BinaryType = BinaryValue | { type: 'B' };
  type PrimaryAttributeDefinition = { type: PrimaryAttributeType }; // keyof typeof PrimaryAttributeType;

  type HashKeyType = { keyType: PrimaryKeyType.Hash };
  type RangeKeyType = undefined | { keyType: PrimaryKeyType.Range };
  type PrimarySchemaKeyType = { keyType: PrimaryKeyType };

  export type StringPartitionKey = StringType | HashKeyType;
  export type NumberPartitionKey = NumberType | HashKeyType;
  export type BinaryPartitionKey = BinaryType | HashKeyType;

  export type StringSortKey = StringType | RangeKeyType | StringKeyCondition;
  export type NumberSortKey = NumberType | RangeKeyType | NumberKeyCondition;
  export type BinarySortKey = BinaryType | RangeKeyType | BinaryKeyCondition;

  export type PrimaryAttributeDefinitionsT<T> = {
    [P in keyof Required<T>]: Extract<T[P], PrimaryAttributeDefinition>;
  };
  export type PrimaryAttributeDefinitions = {
    [key: string]: PrimaryAttributeDefinition;
  };

  export type PrimaryKeySchemaT<T> = {
    [P in keyof Required<T>]: Extract<T[P], PrimarySchemaKeyType>;
  };
  export type PrimaryKeySchema = { [key: string]: PrimarySchemaKeyType };

  export type PrimaryKeyQueryT<T> = {
    [P in keyof T]: Extract<T[P], PrimaryAttributeValue | KeyConditionValue>;
  };
  export type PrimaryKeyQuery = {
    [key: string]: PrimaryAttributeValue | KeyConditionValue;
  };

  export type PrimaryKeyValueMapT<T> = {
    [P in keyof Required<T>]: Extract<T[P], PrimaryAttributeValue>;
  };
  export type PrimaryKeyValueMap = {
    [key: string]: PrimaryAttributeValue;
  };

  export interface BaseOptions {
    // Setting TableBase (or IndexBase) allows the input to be validated
    client?: DocumentClient;
    attributes?: ExpressionAttributes;
  }
  export interface GetOptions extends BaseOptions, Optional<GetInput> {}
  export interface DeleteOptions extends BaseOptions, Optional<DeleteInput> {}
  export enum PutWriteOptions {
    Always,
    Exists,
    NotExists,
  }
  export interface PutOptions extends BaseOptions, Optional<PutInput> {
    writeOptions?: PutWriteOptions;
  }
  export interface UpdateOptions extends BaseOptions, Optional<UpdateInput> {}
  export interface QueryOptions extends BaseOptions, Optional<QueryInput> {}
  export interface ScanOptions extends BaseOptions, Optional<ScanInput> {}
}
