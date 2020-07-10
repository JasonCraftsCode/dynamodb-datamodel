import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Table } from './Table';
import { Condition } from './Condition';
import { UpdateExpression, Update } from './Update';

export interface TableResult {
  getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function equalMap(keys: string[], item1?: { [key: string]: any }, item2?: { [key: string]: any }): boolean {
  if (!item1 || !item2) return false;
  for (const name of keys) if (item1[name] !== item2[name]) return false;
  return true;
}

/**
 * Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
 */
export class BatchGet implements TableResult {
  private reads: { [key: string]: Table.PrimaryKey.AttributeValuesMap[] } = {};
  private getTableReads(name: string): Table.PrimaryKey.AttributeValuesMap[] {
    const keys = this.reads[name];
    if (keys) return keys;
    return (this.reads[name] = []);
  }
  private result?: DocumentClient.BatchGetItemOutput;

  /**
   * @param client - The DocumentClient used for the batch get operations.
   * @param options - Used in building the batchGet params.
   */
  constructor(public client: DocumentClient, public options: Table.BatchGetTableOptions = {}) {}

  /**
   *
   * @param tableName - Name of table to for batch get.
   * @param keys - Keys of items to get.
   */
  set(tableName: string, keys: Table.PrimaryKey.AttributeValuesMap[]): void {
    this.reads[tableName] = keys;
  }

  /**
   *
   * @param tableName - Name of table to for batch get.
   * @param keys - Key of item to get.
   */
  addGet(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): void {
    this.getTableReads(tableName).push(key);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   * @returns Input params for [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   */
  getParams(): DocumentClient.BatchGetItemInput {
    const params: DocumentClient.BatchGetItemInput = { RequestItems: {} };
    Table.addBatchParams(this.options, params);
    Object.keys(this.reads).forEach((name) => {
      params.RequestItems[name] = Table.addItemAttributes<Table.BatchGetTableInput>(
        { Keys: this.reads[name] },
        this.options.itemAttributes,
      );
    });
    return params;
  }

  /**
   * Wrapper around [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   * @returns Promise with the batchGet results, including responses fetched.
   */
  async execute(): Promise<DocumentClient.BatchGetItemOutput> {
    this.result = await this.client.batchGet(this.getParams()).promise();
    return this.result;
  }

  getResult(): DocumentClient.BatchGetItemOutput | undefined {
    return this.result;
  }

  getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
    const responses = this.result?.Responses?.[tableName];
    if (!responses) return;
    const keyNames = Object.keys(key);
    for (const item of responses) if (equalMap(keyNames, key, item)) return item;
  }
}

interface TableBatchWrites {
  putItems: Table.PutItem[];
  delKeys: Table.PrimaryKey.AttributeValuesMap[];
}

/**
 * Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
 */
export class BatchWrite implements TableResult {
  private writes: { [key: string]: TableBatchWrites } = {};
  private getTableWrites(name: string): TableBatchWrites {
    const writes = this.writes[name];
    if (writes) return writes;
    return (this.writes[name] = { putItems: [], delKeys: [] });
  }
  private result?: DocumentClient.BatchWriteItemOutput;

  /**
   * @param client - The DocumentClient used for the batch write operations.
   * @param options - Used in building the batchWrite params.
   */
  constructor(public client: DocumentClient, public options: Table.BatchWriteTableOptions = {}) {}

  /**
   * @param tableName - Name of table to for batch write.
   * @param putItems - Items to put in the table.
   * @param delKeys - Keys of items to delete from the table.
   */
  set(tableName: string, putItems: Table.PutItem[], delKeys: Table.PrimaryKey.AttributeValuesMap[]): void {
    this.writes[tableName] = { putItems: putItems, delKeys: delKeys };
  }

  /**
   * @param tableName - Name of table to for batch write.
   * @param item - Items to put in the table.
   */
  addPut(tableName: string, item: Table.PutItem): void {
    this.getTableWrites(tableName).putItems.push(item);
  }

  /**
   * @param tableName - Name of table to for batch write.
   * @param key - Keys of item to delete from the table.
   */
  addDelete(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): void {
    this.getTableWrites(tableName).delKeys.push(key);
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   * @returns Input params for [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   */
  getParams(): DocumentClient.BatchWriteItemInput {
    const params: DocumentClient.BatchWriteItemInput = { RequestItems: {} };
    Table.addBatchParams(this.options, params);

    Object.keys(this.writes).forEach((tableName) => {
      const items: DocumentClient.WriteRequest[] = [];
      const { putItems, delKeys } = this.writes[tableName];
      putItems.forEach((item) =>
        items.push({
          PutRequest: { Item: item.item ? Object.assign(Object.assign({}, item.key), item.item) : item.key },
        }),
      );
      delKeys.forEach((key) => items.push({ DeleteRequest: { Key: key } }));
      params.RequestItems[tableName] = items;
    });
    return params;
  }

  /**
   * Wrapper around [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   * @returns Promise with the batchWrite results, including responses fetched.
   */
  async execute(): Promise<DocumentClient.BatchWriteItemOutput> {
    this.result = await this.client.batchWrite(this.getParams()).promise();
    return this.result;
  }

  getResult(): DocumentClient.BatchWriteItemOutput | undefined {
    return this.result;
  }

  getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
    const metrics = this.result?.ItemCollectionMetrics?.[tableName];
    if (!metrics) return;
    const keyNames = Object.keys(key);
    for (const item of metrics) if (equalMap(keyNames, key, item.ItemCollectionKey)) return item.ItemCollectionKey;
    // NOTE: For put items may need to return the stored writes
  }
}

/**
 * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
 */
export class TransactGet implements TableResult {
  private reads: { [key: string]: Table.TransactGetItem[] } = {};
  private getTableReads(name: string): Table.TransactGetItem[] {
    const keys = this.reads[name];
    if (!keys) return keys;
    return (this.reads[name] = []);
  }
  private request?: DocumentClient.TransactGetItemsInput;
  private result?: DocumentClient.TransactGetItemsOutput;

  /**
   * @param client - The DocumentClient used for the transact get operations.
   * @param options - Used in building the transactGet params.
   */
  constructor(public client: DocumentClient, public options: Table.TransactGetTableOptions = {}) {}

  /**
   * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @param tableName - Name of table to for transact get.
   * @param items - Keys of items and associated attributes to get.
   */
  set(tableName: string, items: Table.TransactGetItem[]): void {
    this.reads[tableName] = items;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @param tableName - Name of table to for transact get.
   * @param key - Primary key of items to get.
   * @param itemAttributes - List of attribute names to return.
   */
  addGet(tableName: string, key: Table.PrimaryKey.AttributeValuesMap, itemAttributes?: string[]): void {
    this.getTableReads(tableName).push({ key, itemAttributes });
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @returns Input params for [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   */
  getParams(): DocumentClient.TransactGetItemsInput {
    const items: DocumentClient.TransactGetItemList = [];
    const params: DocumentClient.TransactGetItemsInput = { TransactItems: items };
    Table.addBatchParams(this.options, params);
    Object.keys(this.reads).forEach((name) =>
      this.reads[name].forEach((item) =>
        items.push({
          Get: Table.addItemAttributes<DocumentClient.Get>({ Key: item.key, TableName: name }, item.itemAttributes),
        }),
      ),
    );
    return params;
  }
  /**
   * Wrapper around [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   */
  async execute(): Promise<DocumentClient.TransactGetItemsOutput> {
    this.request = this.getParams();
    this.result = await this.client.transactGet(this.request).promise();
    return this.result;
  }

  getResult(): DocumentClient.TransactGetItemsOutput | undefined {
    return this.result;
  }

  getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
    if (!this.result?.Responses || !this.request?.TransactItems) return;
    const keyNames = Object.keys(key);
    const items = this.request.TransactItems;
    for (let i = 0; i < items.length; i++) {
      const item = items[i].Get;
      if (item.TableName === tableName && equalMap(keyNames, key, item.Key)) return this.result.Responses[i].Item;
    }
  }
}

/**
 * Wrapper around [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
 */
export class TransactWrite implements TableResult {
  private writes: { [key: string]: Required<Table.TransactWriteData> } = {};
  private getTableWrites(name: string): Required<Table.TransactWriteData> {
    const writes = this.writes[name];
    if (writes) return writes;
    return (this.writes[name] = { conditionCheck: [], delete: [], put: [], update: [] });
  }
  private result?: DocumentClient.TransactWriteItemsOutput;

  /**
   * @param client - The DocumentClient used for the transact write operations.
   * @param options - Used in building the transactWrite params.
   */
  constructor(public client: DocumentClient, public options: Table.TransactWriteTableOptions = {}) {}

  /**
   * Creates the params that can be used when calling  [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   * @param tableName - Name of table to for transact get.
   * @param write - Set of operations to write in the transaction.
   */
  set(tableName: string, writes: Required<Table.TransactWriteData>): void {
    this.writes[tableName] = writes;
  }

  /**
   * Add checkCondition statement to transactGet.
   * @param tableName - Name of table to for transact get.
   */
  addCheckCondition(
    tableName: string,
    key: Table.PrimaryKey.AttributeValuesMap,
    conditions: Condition.Resolver[],
    returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
  ): void {
    this.getTableWrites(tableName).conditionCheck.push({ key, conditions, returnFailure });
  }

  /**
   * Add checkCondition statement to transactGet.
   * @param tableName - Name of table to for transact get.
   */
  addDelete(
    tableName: string,
    key: Table.PrimaryKey.AttributeValuesMap,
    conditions?: Condition.Resolver[],
    returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
  ): void {
    this.getTableWrites(tableName).delete.push({ key, conditions, returnFailure });
  }

  /**
   * Add checkCondition statement to transactGet.
   * @param tableName - Name of table to for transact get.
   */
  addPut(
    tableName: string,
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    conditions?: Condition.Resolver[],
    returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure,
  ): void {
    this.getTableWrites(tableName).put.push({ key, item, conditions, returnFailure });
  }

  /**
   * Add checkCondition statement to transactGet.
   * @param tableName - Name of table to for transact get.
   */
  addUpdate(
    tableName: string,
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.ResolverMap,
    conditions?: Condition.Resolver[],
    returnFailure: DocumentClient.ReturnValue = 'ALL_NEW',
  ): void {
    this.getTableWrites(tableName).update.push({ key, item, conditions, returnFailure });
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   * @returns Input params for [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   */
  getParams(): DocumentClient.TransactWriteItemsInput {
    const items: DocumentClient.TransactWriteItemList = [];
    const params: DocumentClient.TransactWriteItemsInput = { TransactItems: items };
    Table.addBatchParams(this.options, params);
    Object.keys(this.writes).forEach((name) => {
      const writes = this.writes[name];
      writes.conditionCheck.forEach((item) =>
        items.push({
          ConditionCheck: Table.addWriteParams<DocumentClient.ConditionCheck>(
            { TableName: name, Key: item.key } as DocumentClient.ConditionCheck,
            item,
          ),
        }),
      );

      writes.delete.forEach((item) =>
        items.push({
          Delete: Table.addWriteParams<DocumentClient.Delete>({ TableName: name, Key: item.key }, item),
        }),
      );

      writes.put.forEach((item) =>
        items.push({
          Put: Table.addWriteParams<DocumentClient.Put>({ TableName: name, Item: { ...item.key, ...item.item } }, item),
        }),
      );

      writes.update.forEach((item) =>
        items.push({
          Update: Table.addWriteParams<DocumentClient.Update>(
            { TableName: name, Key: item.key } as DocumentClient.Update,
            item,
            (params, attributes) => UpdateExpression.addParams(params, attributes, item.item),
          ),
        }),
      );
    });
    return params;
  }

  /**
   * Wrapper around [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   */
  async execute(): Promise<DocumentClient.TransactWriteItemsOutput> {
    this.result = await this.client.transactWrite(this.getParams()).promise();
    return this.result;
  }

  getResult(): DocumentClient.TransactWriteItemsOutput | undefined {
    return this.result;
  }

  getItem(tableName: string, key: Table.PrimaryKey.AttributeValuesMap): Table.AttributeValuesMap | void {
    const tableMetrics = this.result?.ItemCollectionMetrics?.[tableName];
    if (!tableMetrics) return;
    const keyNames = Object.keys(key);
    for (const metrics of tableMetrics) {
      const item = metrics.ItemCollectionKey;
      if (equalMap(keyNames, key, item)) return item;
    }
    // NOTE: For put return the stored writes
  }
}
