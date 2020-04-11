import { AWSError, Response } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Condition } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyConditionExpression, KeyCondition } from './KeyCondition';
import { Update, UpdateExpression } from './Update';

function getKeyName(keySchema: Table.PrimaryKeySchema, type: Table.PrimaryKeyType): string {
  let name = '';
  Object.keys(keySchema).forEach((key) => {
    if (keySchema[key].keyType === type) {
      name = key;
    }
  });
  return name;
}

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
  ): Promise<Table.PromiseResult<DocumentClient.QueryOutput, AWSError>>;
  scan(options?: Table.ScanOptions): Promise<Table.PromiseResult<DocumentClient.ScanOutput, AWSError>>;
}

export interface IndexParams<KEY> {
  name: string;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  projection: {
    type: Table.ProjectionType;
    attributes?: string[];
  };
}

export interface DefaultGlobalIndexKey {
  G0P: Table.StringPartitionKey;
  G0S?: Table.StringSortKey;
}

export interface DefaultLocalIndexKey {
  P: Table.StringPartitionKey;
  L0S?: Table.StringSortKey;
}

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
    return getKeyName(this.keySchema, 'HASH');
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  queryParams(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput {
    const o = {
      IndexName: this.name,
      ...options,
    };
    return this.table!.queryParams(key, o);
  }
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput {
    const o = {
      IndexName: this.name,
      ...options,
    };
    return this.table!.scanParams(o);
  }

  query(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions) {
    const o = {
      IndexName: this.name,
      ...options,
    };
    return this.table!.query(key, o);
  }
  scan(options?: Table.ScanOptions) {
    const o = {
      IndexName: this.name,
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
  onError: (msg: string) => void;

  getPartitionKey(): string;
  getSortKey(): string;

  getParams(key: Table.PrimaryKeyValueMap, options?: Table.GetOptions): DocumentClient.GetItemInput;
  deleteParams(key: Table.PrimaryKeyValueMap, options?: Table.DeleteOptions): DocumentClient.DeleteItemInput;
  putParams(
    key: Table.PrimaryKeyValueMap,
    item?: Table.AttributeValueMap,
    options?: Table.PutOptions,
  ): DocumentClient.PutItemInput;
  updateParams(
    key: Table.PrimaryKeyValueMap,
    item?: Update.UpdateMapValue,
    options?: Table.UpdateOptions,
  ): DocumentClient.UpdateItemInput;
  queryParams(key: Table.PrimaryKeyQuery, options?: Table.QueryOptions): DocumentClient.QueryInput;
  scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

  get(key: Table.PrimaryKeyValueMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;
  delete(
    key: Table.PrimaryKeyValueMap,
    options?: Table.DeleteOptions,
  ): Promise<Table.PromiseResult<DocumentClient.DeleteItemOutput, AWSError>>;
  put(
    key: Table.PrimaryKeyValueMap,
    item?: Table.AttributeValueMap,
    options?: Table.PutOptions,
  ): Promise<Table.PromiseResult<DocumentClient.PutItemOutput, AWSError>>;
  update(
    key: Table.PrimaryKeyValueMap,
    item?: Update.UpdateMapValue,
    options?: Table.UpdateOptions,
  ): Promise<Table.PromiseResult<DocumentClient.UpdateItemOutput, AWSError>>;
  query(
    key: Table.PrimaryKeyQuery,
    options?: Table.QueryOptions,
  ): Promise<Table.PromiseResult<DocumentClient.QueryOutput, AWSError>>;
  scan(options?: Table.ScanOptions): Promise<Table.PromiseResult<DocumentClient.ScanOutput, AWSError>>;
}

export interface TableParams<KEY, ATTRIBUTES> {
  name: string;
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  globalIndexes?: IndexBase[];
  localIndexes?: IndexBase[];
  client: DocumentClient;
  onError?: (msg: string) => void;
}

// StringSortKey should be optional (?) since for update actions it is optional
export interface DefaultTableKey {
  P: Table.StringPartitionKey;
  S?: Table.StringSortKey;
}

export class Table<KEY = DefaultTableKey, ATTRIBUTES = KEY> implements TableBase {
  name: string;
  keyAttributes: Table.PrimaryAttributeDefinitionsT<ATTRIBUTES>;
  keySchema: Table.PrimaryKeySchemaT<KEY>;
  globalIndexes?: IndexBase[] = [];
  localIndexes?: IndexBase[] = [];
  client: DocumentClient;
  onError = (msg: string) => {
    throw new Error(msg);
  };

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
    return getKeyName(this.keySchema, 'HASH');
  }

  getSortKey(): string {
    return getKeyName(this.keySchema, 'RANGE');
  }

  // Action Params:
  getParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    { attributes, ...options }: Table.GetOptions = {},
  ): DocumentClient.GetItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...options,
    };
  }
  deleteParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    { attributes, ...options }: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...options,
    };
  }
  putParams(
    key: Table.PrimaryKeyValueMapT<KEY>,
    item?: Table.AttributeValueMap,
    { attributes, writeOptions, ...options }: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    let condInput;
    switch (writeOptions) {
      case 'Exists':
        condInput = Condition.buildInput(Condition.exists(this.getPartitionKey()), attributes);
        break;
      case 'NotExists':
        condInput = Condition.buildInput(Condition.notExists(this.getPartitionKey()), attributes);
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
    item?: Update.UpdateMapValue,
    { attributes, ...options }: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    return {
      TableName: this.name,
      Key: key,
      ...Update.buildInput(item, new UpdateExpression(attributes)),
      ...options,
    };
  }
  queryParams(
    key: Table.PrimaryKeyQueryT<KEY>,
    { attributes, ...options }: Table.QueryOptions = {},
  ): DocumentClient.QueryInput {
    return {
      TableName: this.name,
      ...KeyCondition.buildInput(key, new KeyConditionExpression(attributes)),
      ...options,
    };
  }
  scanParams({ attributes, ...options }: Table.ScanOptions = {}): DocumentClient.ScanInput {
    return {
      TableName: this.name,
      ...options,
    };
  }

  // actions:
  get(key: Table.PrimaryKeyValueMapT<KEY>, options?: Table.GetOptions) {
    const params = this.getParams(key, options);
    return this.client.get(params).promise(); // functionFor(client, 'get', 'DocumentClient')(params);
  }
  delete(key: Table.PrimaryKeyValueMapT<KEY>, options?: Table.DeleteOptions) {
    const params = this.deleteParams(key, options);
    return this.client.delete(params).promise();
  }
  put(key: Table.PrimaryKeyValueMapT<KEY>, items?: Table.AttributeValueMap, options?: Table.PutOptions) {
    const params = this.putParams(key, items, options);
    return this.client.put(params).promise();
  }
  update(key: Table.PrimaryKeyValueMapT<KEY>, items?: Update.UpdateMapValue, options?: Table.UpdateOptions) {
    const params = this.updateParams(key, items, options);
    return this.client.update(params).promise();
  }
  // query and scan are also used to access indexes
  query(key: Table.PrimaryKeyQueryT<KEY>, options?: Table.QueryOptions) {
    const params = this.queryParams(key, options);
    return this.client.query(params).promise();
  }
  scan(options?: Table.ScanOptions) {
    const params = this.scanParams(options);
    return this.client.scan(params).promise();
  }
}

/* tslint:disable:no-namespace */
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

  // KeyType
  export type PrimaryKeyType = 'HASH' | 'RANGE';
  export type SortComparisonOperator = '=' | '<' | '<=' | '>' | '>=' | 'BETWEEN' | 'begins_with';
  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  export type ValueKeyConditionBase<T extends PrimaryAttributeType> = (
    name: string,
    exp: KeyConditionExpression,
    type?: T,
  ) => void;

  export type StringKeyCondition = ValueKeyConditionBase<'S'>;
  export type NumberKeyCondition = ValueKeyConditionBase<'N'>;
  export type BinaryKeyCondition = ValueKeyConditionBase<'B'>;
  export type KeyConditionValue = StringKeyCondition | NumberKeyCondition | BinaryKeyCondition;

  // export const PrimaryStringType: { type: 'S' } = { type: 'S' };
  // export const PrimaryNumberType: { type: 'N' } = { type: 'N' };
  // export const PrimaryBinaryType: { type: 'B' } = { type: 'B' };

  export type StringType = string | { type: 'S' };
  export type NumberType = number | { type: 'N' };
  export type BinaryType = BinaryValue | { type: 'B' };
  export type PrimaryAttributeDefinition = { type: PrimaryAttributeType };

  // export const PrimaryHashKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };
  // export const PrimaryRangeKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };

  export type HashKeyType = { keyType: 'HASH' };
  export type RangeKeyType = undefined | { keyType: 'RANGE' };
  export type PrimarySchemaKeyType = { keyType: PrimaryKeyType };

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
    attributes?: ExpressionAttributes;
  }
  export interface GetOptions extends BaseOptions, Optional<GetInput> {}
  export interface DeleteOptions extends BaseOptions, Optional<DeleteInput> {}
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';

  export interface PutOptions extends BaseOptions, Optional<PutInput> {
    writeOptions?: PutWriteOptions;
  }
  export interface UpdateOptions extends BaseOptions, Optional<UpdateInput> {}
  export interface QueryOptions extends BaseOptions, Optional<QueryInput> {}
  export interface ScanOptions extends BaseOptions, Optional<ScanInput> {}

  export type AttributeType = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';
  export type CompareOperator = '=' | '<>' | '<' | '<=' | '>' | '>=';
  export type LogicalOperator = 'AND' | 'OR' | 'NOT';
  export type ConditionOperator =
    | CompareOperator
    | 'BETWEEN'
    | 'IN'
    | 'begins_with'
    | 'contains'
    | 'attribute_type'
    | 'attribute_exists'
    | 'attribute_not_exists'
    | 'size'
    | LogicalOperator;

  export type PromiseResult<D, E> = D & { $response: Response<D, E> };

  export type Optional<T> = { [P in keyof T]?: T[P] };

  export type BinaryValue = DocumentClient.binaryType;
  export type StringSetValue = DocumentClient.StringSet;
  export type NumberSetValue = DocumentClient.NumberSet;
  export type BinarySetValue = DocumentClient.BinarySet;
  export type MapValue = { [key: string]: AttributeValue };
  export type ListValue = AttributeValue[];

  export type AttributeValue =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | StringSetValue
    | NumberSetValue
    | BinarySetValue
    | MapValue
    | ListValue;

  export type AttributeSetValue = StringSetValue | NumberSetValue | BinarySetValue;

  export type AttributeValueMap = { [key: string]: AttributeValue };
}
