/**
 * Table.ts contains the classes used to model a single DynamoDB table with both local and global secondary indexes.
 * @packageDocumentation
 */
import { DocumentClient, ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { Condition, ConditionExpression } from './Condition';
import { ExpressionAttributes } from './ExpressionAttributes';
import { KeyCondition, KeyConditionExpression } from './KeyCondition';
import { Update, UpdateExpression } from './Update';

/**
 * Object that represents the DynamoDB table.
 *
 * In most single table designs secondary indexes will be used like in the following example:
 * @example [examples/Table.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Table.ts} (imports: [examples/Index.ts]{@link https://github.com/jasoncraftscode/dynamodb-datamodel/tree/main/examples/Index.ts})
 * ```typescript
 * [[include:Table.ts]]
 * ```
 *
 * @public
 */
export class Table {
  private _client?: DocumentClient;
  private _createClient: () => DocumentClient;

  /**
   * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
   */
  name: string;

  /**
   * Definition of the attribute types required for table and index primary key and for index projected attributes.
   * These need to be defined at the table level since the attributes are table wide concept.
   */
  keyAttributes: Table.PrimaryKey.AttributeTypesMap;

  /**
   * Schema map for the Table's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
   */
  keySchema: Table.PrimaryKey.KeyTypesMap;

  /**
   * Determines how errors should be handled.
   * The default is to throw on any errors.
   */
  onError: (msg: string) => void = (msg: string) => {
    throw new Error(msg);
  };

  /**
   * @param params - Initialize the Table's name, attributes, keySchema and index properties.
   */
  constructor(params: Table.TableParams) {
    this.name = params.name;
    this.keyAttributes = params.keyAttributes;
    this.keySchema = params.keySchema;
    this._createClient =
      typeof params.client === 'function' ? params.client : (): DocumentClient => params.client as DocumentClient;
  }

  /**
   * Gets the DocumentClient associated with this Table, which may mean creating one.
   * @returns The DocumentClient used for all Table operations.
   */
  get client(): DocumentClient {
    if (!this._client) this._client = this._createClient();
    return this._client;
  }

  /**
   * Gets the partition key name for the Table.
   * @returns The name of the primary (or HASH) key attribute.
   */
  getPartitionKey(): string {
    return Table.getKeyName(this.keySchema, 'HASH');
  }

  /**
   * Gets the sort key name for the Table.
   * @returns The name of the sort (or RANGE) key attribute.
   */
  getSortKey(): string {
    return Table.getKeyName(this.keySchema, 'RANGE');
  }

  /**
   * Wrapper around the [DocumentClient.createSet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#createSet-property}
   * used by the below create*Set methods to create type safe sets. Choose to leverage DocumentClient
   * implementation of set to allow DocumentClient to correctly auto convert to DynamoDB's native types.
   * @param list - Array of items to create the set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createSet(
    list: string[] | number[] | Table.BinaryValue[],
    options?: DocumentClient.CreateSetOptions,
  ): Table.AttributeSetValues {
    return this.client.createSet(list, options);
  }

  /**
   * Create a string set from a string array.
   * @param list - String array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createStringSet(list: string[], options?: DocumentClient.CreateSetOptions): Table.StringSetValue {
    return this.createSet(list, options) as Table.StringSetValue;
  }

  /**
   * Create a number set from a number array.
   * @param list - Number array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createNumberSet(list: number[], options?: DocumentClient.CreateSetOptions): Table.NumberSetValue {
    return this.createSet(list, options) as Table.NumberSetValue;
  }

  /**
   * Create a binary set from a binary array.
   * @param list - Binary array to create set from.
   * @param options - Options to pass DocumentClient createSet.
   */
  createBinarySet(list: Table.BinaryValue[], options?: DocumentClient.CreateSetOptions): Table.BinarySetValue {
    return this.createSet(list, options) as Table.BinarySetValue;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   * @param key - Primary key of the item to get.
   * @param options - Additional optional options to use for get.
   * @returns Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}.
   */
  getParams(key: Table.PrimaryKey.AttributeValuesMap, options: Table.GetOptions = {}): Table.GetInput {
    const params = { TableName: this.name, Key: key };
    return options.params ? Object.assign(params, options.params) : params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   * @param key - Primary key of the item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}.
   */
  deleteParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    options: Table.DeleteOptions = {},
  ): DocumentClient.DeleteItemInput {
    return Table.addParams<DocumentClient.DeleteItemInput>({ TableName: this.name, Key: key }, options, 'condition');
  }

  /**
   * Get the condition that is needed to support a specific PutWriteOptions.
   * @param options - Type of put to get the condition for.
   * @returns Condition resolver that maps to the PutWriteOptions.
   */
  getPutCondition(options: Table.PutWriteOptions | undefined): Condition.Resolver | void {
    if (options === 'Exists') return Condition.exists(this.getPartitionKey());
    if (options === 'NotExists') return Condition.notExists(this.getPartitionKey());
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   * @param key - Primary key of item to put.
   * @param item - Attributes of the item to put.
   * @param options - Additional optional options to use for put.
   * @returns Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}.
   */
  putParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Table.AttributeValuesMap,
    options: Table.PutOptions = {},
  ): DocumentClient.PutItemInput {
    let conditions = options.conditions;
    const resolver = this.getPutCondition(options.writeOptions);
    if (resolver) conditions = conditions ? conditions.concat(resolver) : [resolver];
    return Table.addParams<DocumentClient.PutItemInput>(
      { TableName: this.name, Item: item ? Object.assign(Object.assign({}, key), item) : key },
      { attributes: options.attributes, conditions },
      'condition',
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   * By default this method uses `ReturnValues: 'ALL_NEW'` to return all of the properties for an item,
   * since many APIs or server code use the updated values in some way.
   * @param key - Primary key of item to update.
   * @param item - Attributes of the item to update.
   * @param options - Additional optional options to use for update.
   * @returns Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}.
   */
  updateParams(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.ResolverMap,
    options: Table.UpdateOptions = {},
  ): DocumentClient.UpdateItemInput {
    return Table.addParams<DocumentClient.UpdateItemInput>(
      { TableName: this.name, Key: key, ReturnValues: 'ALL_NEW' },
      options,
      'condition',
      (params, attributes) => UpdateExpression.addParams(params, attributes, item),
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property} method.
   * @param key - Primary key with optional KeyCondition to query the table with.
   * @param options - Used in building the query params.
   * @returns Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   */
  queryParams(key: Table.PrimaryKey.KeyQueryMap, options: Table.QueryOptions = {}): DocumentClient.QueryInput {
    return Table.addParams<DocumentClient.QueryInput>(
      { TableName: this.name },
      options,
      'filter',
      (params, attributes) => KeyConditionExpression.addParams(params, attributes, key),
    );
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   * @param options - Used in building the scan params.
   * @returns Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property} method.
   */
  scanParams(options: Table.ScanOptions = {}): DocumentClient.ScanInput {
    return Table.addParams<DocumentClient.ScanInput>({ TableName: this.name }, options, 'filter');
  }

  // TODO:
  // Add Generics Table methods
  /**
   * Creates the params that can be used when calling [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   * @param keys - Keys of items to get.
   * @param options - Used in building the batchGet params.
   * @returns Input params for [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   */
  batchGetParams(
    keys: Table.PrimaryKey.AttributeValuesMap[],
    options: Table.BatchGetTableOptions = {},
  ): DocumentClient.BatchGetItemInput {
    const params: DocumentClient.BatchGetItemInput = { RequestItems: {} };
    Table.addBatchParams(options, params);
    params.RequestItems[this.name] = Table.addItemAttributes<Table.BatchGetTableInput>(
      { Keys: keys },
      options.itemAttributes,
    );
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   * @param putItems - Items to put in the table.
   * @param delKeys - Keys of items to delete from the table.
   * @param options - Used in building the batchWrite params.
   * @returns Input params for [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   */
  batchWriteParams(
    putItems?: Table.PutItem[],
    delKeys?: Table.PrimaryKey.AttributeValuesMap[],
    options: Table.BatchWriteTableOptions = {},
  ): DocumentClient.BatchWriteItemInput {
    const params: DocumentClient.BatchWriteItemInput = { RequestItems: {} };
    Table.addBatchParams(options, params);
    const items: DocumentClient.WriteRequest[] = [];
    if (putItems)
      putItems.forEach((item) =>
        items.push({
          PutRequest: {
            Item: item.item ? Object.assign(Object.assign({}, item.key), item.item) : item.key,
          },
        }),
      );
    if (delKeys) delKeys.forEach((key) => items.push({ DeleteRequest: { Key: key } }));
    params.RequestItems[this.name] = items;
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @param keys - Keys of items to get.
   * @param getItems - Keys of items and associated attributes to get.
   * @param options - Used in building the transactGet params.
   * @returns Input params for [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   */
  transactGetParams(
    keys?: Table.PrimaryKey.AttributeValuesMap[],
    getItems?: Table.TransactGetItem[],
    options: Table.TransactGetTableOptions = {},
  ): DocumentClient.TransactGetItemsInput {
    const items: DocumentClient.TransactGetItemList = [];
    const params: DocumentClient.TransactGetItemsInput = { TransactItems: items };
    Table.addBatchParams(options, params);
    if (keys) keys.forEach((key) => items.push({ Get: { Key: key, TableName: this.name } }));
    if (getItems)
      getItems.forEach((item) =>
        items.push({
          Get: Table.addItemAttributes<DocumentClient.Get>(
            { Key: item.key, TableName: this.name },
            item.itemAttributes,
          ),
        }),
      );
    return params;
  }

  /**
   * Creates the params that can be used when calling [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   * @param write - Set of operations to write in the transaction.
   * @param options - Used in building the transactWrite params.
   * @returns Input params for [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   */
  transactWriteParams(
    write: Table.TransactWrite,
    options: Table.TransactWriteTableOptions = {},
  ): DocumentClient.TransactWriteItemsInput {
    const items: DocumentClient.TransactWriteItemList = [];
    const params: DocumentClient.TransactWriteItemsInput = { TransactItems: items };
    Table.addBatchParams(options, params);

    write.conditionCheck?.forEach((item) =>
      items.push({
        ConditionCheck: Table.addWriteParams<DocumentClient.ConditionCheck>(
          { TableName: this.name, Key: item.key } as DocumentClient.ConditionCheck,
          item,
        ),
      }),
    );

    write.delete?.forEach((item) =>
      items.push({
        Delete: Table.addWriteParams<DocumentClient.Delete>({ TableName: this.name, Key: item.key }, item),
      }),
    );

    write.put?.forEach((item) =>
      items.push({
        Put: Table.addWriteParams<DocumentClient.Put>(
          { TableName: this.name, Item: { ...item.key, ...item.item } },
          item,
        ),
      }),
    );

    write.update?.forEach((item) =>
      items.push({
        Update: Table.addWriteParams<DocumentClient.Update>(
          { TableName: this.name, Key: item.key } as DocumentClient.Update,
          item,
          (params, attributes) => UpdateExpression.addParams(params, attributes, item.item),
        ),
      }),
    );
    return params;
  }

  /**
   * Wrapper method for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   * @param key - Primary key of item to get.
   * @param options - Additional optional options to use for get.
   * @returns Async promise returned by [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property} method.
   */
  get(key: Table.PrimaryKey.AttributeValuesMap, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput> {
    return this.client.get(this.getParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   * @param key - Primary key of item to delete.
   * @param options - Additional optional options to use for delete.
   * @returns Async promise returned by [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property} method.
   */
  delete(
    key: Table.PrimaryKey.AttributeValuesMap,
    options?: Table.DeleteOptions,
  ): Promise<DocumentClient.DeleteItemOutput> {
    return this.client.delete(this.deleteParams(key, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   * @param key - Primary key of item to put.
   * @param item - Attributes of the item to put.
   * @param options - Additional optional options to use for put.
   * @returns Async promise returned by [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property} method.
   */
  put(
    key: Table.PrimaryKey.AttributeValuesMap,
    items?: Table.AttributeValuesMap,
    options?: Table.PutOptions,
  ): Promise<DocumentClient.PutItemOutput> {
    return this.client.put(this.putParams(key, items, options)).promise();
  }

  /**
   * Wrapper method for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   * @param key - Primary key of item to update.
   * @param item - Attributes of the item to update.
   * @param options - Additional optional options to use for update.
   * @returns Async promise returned by [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property} method.
   */
  update(
    key: Table.PrimaryKey.AttributeValuesMap,
    item?: Update.ResolverMap,
    options?: Table.UpdateOptions,
  ): Promise<DocumentClient.UpdateItemOutput> {
    return this.client.update(this.updateParams(key, item, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}.
   * method that uses the index and table properties with the key and options params.
   * @param key - Primary key with optional KeyCondition to query the secondary index with.
   * @param options - Used in building the query params.
   * @returns Promise with the query results, including items fetched.
   */
  query(key: Table.PrimaryKey.KeyQueryMap, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput> {
    return this.client.query(this.queryParams(key, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}.
   * method that uses the index and table properties with the options param.
   * @param options - Used in building the scan params.
   * @returns Promise with the scan results, including items fetched.
   */
  scan(options?: Table.ScanOptions): Promise<DocumentClient.ScanOutput> {
    return this.client.scan(this.scanParams(options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property} method.
   * @param keys - Keys of items to get.
   * @param options - Used in building the batchGet params.
   * @returns Promise with the batchGet results, including responses fetched.
   */
  batchGet(
    keys: Table.PrimaryKey.AttributeValuesMap[],
    options?: Table.BatchGetTableOptions,
  ): Promise<DocumentClient.BatchGetItemOutput> {
    return this.client.batchGet(this.batchGetParams(keys, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.batchWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchWrite-property} method.
   * @param putItems - Items to put in the table.
   * @param delKeys - Keys of items to delete from the table.
   * @param options - Used in building the batchGet params.
   * @returns Promise with the batchWrite results, including responses fetched.
   */
  batchWrite(
    putItems?: Table.PutItem[],
    delKeys?: Table.PrimaryKey.AttributeValuesMap[],
    options?: Table.BatchWriteTableOptions,
  ): Promise<DocumentClient.BatchWriteItemOutput> {
    return this.client.batchWrite(this.batchWriteParams(putItems, delKeys, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.transactGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactGet-property} method.
   * @param keys - Keys of items to get.
   * @param getItems - Keys of items and associated attributes to get.
   * @param options - Used in building the transactGet params.
   * @returns Promise with the transactGet results, including responses fetched.
   */
  transactGet(
    keys?: Table.PrimaryKey.AttributeValuesMap[],
    getItems?: Table.TransactGetItem[],
    options?: Table.TransactGetTableOptions,
  ): Promise<DocumentClient.TransactGetItemsOutput> {
    return this.client.transactGet(this.transactGetParams(keys, getItems, options)).promise();
  }

  /**
   * Wrapper around [DocumentClient.transactWrite]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#transactWrite-property} method.
   * @param write - Set of operations to write in the transaction.
   * @param options - Used in building the transactWrite params.
   * @returns IPromise with the transactWrite results, including responses fetched.
   */
  transactWrite(
    write: Table.TransactWrite,
    options: Table.TransactWriteTableOptions = {},
  ): Promise<DocumentClient.TransactWriteItemsOutput> {
    return this.client.transactWrite(this.transactWriteParams(write, options)).promise();
  }

  /**
   * Maps PutWriteOptions to one of the put based ItemActions used by Fields to tell the type of put operation.
   * @param options - Put write option to map into a put item action.
   */
  static getPutAction(options?: Table.PutWriteOptions): Table.PutItemActions {
    if (options === 'NotExists') return 'put-new';
    if (options === 'Exists') return 'put-replace';
    return 'put';
  }

  /**
   * Checks if item action is a put based action.
   * @param action - Item actions to check if put.
   * @returns True if item action is a put action.
   */
  static isPutAction(action: Table.ItemActions): boolean {
    return action === 'put' || action === 'put-new' || action === 'put-replace';
  }

  /**
   * Appends attributes names to the ProjectionExpression for input params.
   * @param params - Params to add ProjectionExpression on.
   * @param itemAttributes - List of attribute names to return.
   * @param attributes - Definition of the attribute types required for table and index primary key and for index projected attributes.
   * @returns Params that have ProjectionExpression added to.
   */
  static addItemAttributes<T extends Table.ExpressionParams>(
    params: T,
    itemAttributes?: string[],
    attributes?: Table.ExpressionAttributes,
  ): T & Table.ExpressionParams {
    if (itemAttributes && itemAttributes.length > 0) {
      const exp = attributes || new ExpressionAttributes();
      itemAttributes.forEach((value) => exp.addPath(value));
      return Object.assign(params, {
        ProjectionExpression: itemAttributes.join(', '),
        ExpressionAttributeNames: exp.getPaths(),
      });
    }
    return params;
  }

  /**
   * Add expressions properties to the params object.
   * @param T - Type of table action input params
   * @param params - The params object to add expression properties to.
   * @param options - Options used to build params.
   * @param type - The type of expression to set either 'filter' or 'condition',
   * @param addParam - Function to add additional expression params.
   * @returns Params object that was passed in with expression added.
   */
  static addParams<T extends Table.ExpressionParams>(
    params: T,
    options: Table.BaseOptions,
    type: 'filter' | 'condition',
    addParams?: Table.AddExpressionParams,
  ): T & Table.ExpressionParams {
    const attributes = options.attributes || new ExpressionAttributes();
    ConditionExpression.addParams(params, attributes, type, options.conditions);
    if (addParams) addParams(params, attributes);
    ExpressionAttributes.addParams(params, attributes);
    return options.params ? Object.assign(params, options.params) : params;
  }

  /**
   * Add expressions properties to the params object.
   * @param T - Type of table transact write item input params
   * @param params - The params object to add expression properties to.
   * @param item - Transact write item used to build params.
   * @param addParam - Function to add additional expression params.
   * @returns Params object that was passed in with expression added.
   */
  static addWriteParams<
    T extends Table.ExpressionParams & {
      ReturnValuesOnConditionCheckFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }
  >(
    params: T,
    item: {
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    },
    addParams?: Table.AddExpressionParams,
  ): T & Table.ExpressionParams {
    if (item.returnFailure) params.ReturnValuesOnConditionCheckFailure = item.returnFailure;
    return Table.addParams(params, item, 'condition', addParams);
  }

  /**
   * Translates options into batch or transact based input params.
   * @param options - Common batch or transact options to set on params.
   * @param params - Input params to set based on options.
   */
  static addBatchParams(
    options: {
      token?: DocumentClient.ClientRequestToken;
      consumed?: DocumentClient.ReturnConsumedCapacity;
      metrics?: DocumentClient.ReturnItemCollectionMetrics;
    },
    params: {
      ClientRequestToken?: DocumentClient.ClientRequestToken;
      ReturnConsumedCapacity?: DocumentClient.ReturnConsumedCapacity;
      ReturnItemCollectionMetrics?: DocumentClient.ReturnItemCollectionMetrics;
    },
  ): void {
    if (options.token) params.ClientRequestToken = options.token;
    if (options.consumed) params.ReturnConsumedCapacity = options.consumed;
    if (options.metrics) params.ReturnItemCollectionMetrics = options.metrics;
  }

  /**
   * Finds the partition or sort key name for a table or index key schema.
   * @param keySchema - Table key schema to find the primary key in.
   * @param type - Primary key type to look for, either HASH or RANGE.
   * @returns Name of the key if it exists otherwise an empty string.
   */
  static getKeyName(keySchema: Table.PrimaryKey.KeyTypesMap, type: Table.PrimaryKey.KeyTypes): string {
    const keys = Object.keys(keySchema);
    for (const key of keys) if (keySchema[key].keyType === type) return key;
    return '';
  }
}

/**
 * Is also a namespace for scoping Table based interfaces and types.
 * @public
 */
// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
export namespace Table /* istanbul ignore next: needed for ts with es5 */ {
  /**
   * TypeScript utility type that constructs a type consisting of all properties of T set to optional.
   * Does the opposite of [Required]{@link https://www.typescriptlang.org/docs/handbook/utility-types.html#requiredt}.
   */
  export type Optional<T> = { [P in keyof T]?: T[P] };

  /**
   * Attribute types support by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type AttributeTypes = 'B' | 'N' | 'S' | 'BOOL' | 'NULL' | 'L' | 'M' | 'BS' | 'NS' | 'SS';

  /**
   * Binary value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinaryValue = DocumentClient.binaryType;

  /**
   * String set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type StringSetValue = DocumentClient.StringSet;

  /**
   * Number set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type NumberSetValue = DocumentClient.NumberSet;

  /**
   * Binary set value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type BinarySetValue = DocumentClient.BinarySet;

  /**
   * Map value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type MapValue = { [key: string]: AttributeValues };

  /**
   * List value supported by {@link Table} and [DocumentClient]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html}.
   */
  export type ListValue = AttributeValues[];

  /**
   * Supported Table set based values.
   */
  export type AttributeSetValues = StringSetValue | NumberSetValue | BinarySetValue;

  /**
   * Supported Table attribute values.
   */
  export type AttributeValues =
    | null
    | string
    | number
    | boolean
    | BinaryValue
    | AttributeSetValues
    | MapValue
    | ListValue;

  /**
   * Supported Table value map used for {@link put} method.
   */
  export type AttributeValuesMap = { [key: string]: AttributeValues };

  /**
   * Put based item actions, used by {@link Fields} to determine what put based table operation will be executed.
   */
  export type PutItemActions = 'put' | 'put-new' | 'put-replace';
  /**
   * Item actions used by {@link Fields} to determine what table operation will be executed.
   */
  export type ItemActions = 'get' | 'delete' | PutItemActions | 'update';

  /**
   * Params used to construct a {@link Table}.
   */
  export interface TableParams {
    /**
     * Name of the DynamoDB table, used to set the TableName when calling DynamoDB methods.
     */
    name: string;

    /**
     * Definition of the attribute types required for table and index primary key and for index projected attributes.
     * These need to be defined at the table level since the attributes are table wide concept.
     */
    keyAttributes: Table.PrimaryKey.AttributeTypesMap;

    /**
     * Schema map for the Table's primary key, in the form of \{ \<partition key name\>: \{ keyType: 'HASH' \} \}.
     */
    keySchema: Table.PrimaryKey.KeyTypesMap;

    /**
     * DocumentClient to use in the {@link Table}.  Can be a function to support creating the DocumentClient on demand.
     */
    client: DocumentClient | (() => DocumentClient);

    /**
     * Determines how errors should be handled.
     */
    onError?: (msg: string) => void;
  }

  /**
   * Contains the primary key type and key type values.  Used when definition {@link Table.keyAttributes},
   * {@link Table.keySchema} and {@link Index.keySchema}
   */
  export class PrimaryKey {
    /**
     * Use for defining string based {@link Table.keyAttributes}
     */
    static readonly StringType: { type: 'S' } = { type: 'S' };

    /**
     * Use for defining number based {@link Table.keyAttributes}
     */
    static readonly NumberType: { type: 'N' } = { type: 'N' };

    /**
     * Use for defining binary based {@link Table.keyAttributes}
     */
    static readonly BinaryType: { type: 'B' } = { type: 'B' };

    /**
     * Use for defining partition (HASH) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly PartitionKeyType: { keyType: 'HASH' } = { keyType: 'HASH' };

    /**
     * Use for defining sort (RANGE) key {@link Table.keySchema} or {@link Index.keySchema}
     */
    static readonly SortKeyType: { keyType: 'RANGE' } = { keyType: 'RANGE' };
  }

  /**
   * Is also a namespace for scoping PrimaryKey based interfaces and types.
   * @public
   * */
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace PrimaryKey {
    /**
     * Support primary key attribute values types.
     */
    export type AttributeValues = string | number | Table.BinaryValue;

    /**
     * Supported primary key attribute types (see DocumentClient.ScalarAttributeType)
     */
    export type AttributeTypes = 'B' | 'N' | 'S';

    /**
     * Supported primary key types.
     */
    export type KeyTypes = 'HASH' | 'RANGE';

    /**
     * Definition for partition string.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionString = string | { type: 'S' } | { keyType: 'HASH' };

    /**
     * Definition for partition number.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionNumber = number | { type: 'N' } | { keyType: 'HASH' };

    /**
     * Definition for partition number.  Used for defining the primary key for Tables and Indexes
     */
    export type PartitionBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'HASH' };

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortString = string | { type: 'S' } | { keyType: 'RANGE' } | KeyCondition.StringResolver;

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortNumber = number | { type: 'N' } | { keyType: 'RANGE' } | KeyCondition.NumberResolver;

    /**
     * Definition for sort string.  Used for defining the primary key for Tables and Indexes
     */
    export type SortBinary = Table.BinaryValue | { type: 'B' } | { keyType: 'RANGE' } | KeyCondition.BinaryResolver;

    /**
     * Definition for the {@link Table.keyAttributes}
     */
    export type AttributeTypesMap = { [key: string]: { type: AttributeTypes } };

    /**
     * Definition for the {@link Table.keySchema} and {@link Index.keySchema}
     */
    export type KeyTypesMap = { [key: string]: { keyType: KeyTypes } };

    /**
     * Definition for the key argument used in {@link Table.queryParams}, {@link Table.query},
     * {@link Index.query} and {@link Index.queryParams}
     */
    export type KeyQueryMap = { [key: string]: AttributeValues | KeyCondition.AttributeResolver };

    /**
     * Definition for the key argument used in {@link Table.get}, {@link Table.delete}, {@link Table.put},
     * {@link Table.update} and associated Params methods.
     */
    export type AttributeValuesMap = { [key: string]: AttributeValues };

    /**
     * Typed based version of {@link Table.PrimaryKey.AttributeTypesMap} used in {@link Table.TableT}
     */
    export type AttributeTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { type: AttributeTypes }>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.KeyTypesMap} used in {@link Table.TableT} and {@link Index.IndexT}
     */
    export type KeyTypesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], { keyType: KeyTypes }>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.KeyQueryMap} used in {@link Table.TableT} and {@link Index.IndexT}
     */
    export type KeyQueryMapT<T> = {
      [P in keyof T]: Extract<T[P], Table.AttributeValues | KeyCondition.AttributeResolver>;
    };

    /**
     * Typed based version of {@link Table.PrimaryKey.AttributeValuesMap} used in {@link Table.TableT}
     */
    export type AttributeValuesMapT<T> = {
      [P in keyof Required<T>]: Extract<T[P], Table.AttributeValues>;
    };

    /**
     * Attribute query value of the primary key for tables and indexes.
     */
    export interface KeyQuery {
      /**
       * Partition key query value.
       */
      pk: Table.AttributeValues;

      /**
       * Sort key query value.
       */
      sk?: Table.AttributeValues | KeyCondition.AttributeResolver;
    }
  }

  /**
   * Interface that allows expressions to get aliases for path and values and store that mapping to then
   * allow ExpressionAttributeNames and ExpressionAttributeValues to be set on params.
   */
  export interface ExpressionAttributes {
    /**
     * Parse an attribute path and adds the names to the expression attribute names and hands back an alias
     * to use in condition, update, filter, and other expressions.
     * @param name - Attribute path to get an alias for.
     * @returns Alias path to use in place of the attribute name.
     */
    addPath(name: string): string;

    /**
     * Adds the value to the expression attribute values and hands back an alias
     * to use in condition, update, filter, and other expressions.
     * @param value - Value to add to the values map.
     * @returns Alias to use in place of the attribute value.
     */
    addValue(value: Table.AttributeValues): string;

    /**
     * Gets the names map to assign to ExpressionAttributeNames.
     */
    getPaths(): ExpressionAttributeNameMap | void;

    /**
     * Gets the values map to assign to ExpressionAttributeValues.
     */
    getValues(): Table.AttributeValuesMap | void;
  }

  /**
   * The ExpressionAttributes params used by dynamodb.
   */
  export type ExpressionAttributeParams = {
    ExpressionAttributeNames?: ExpressionAttributeNameMap;
    ExpressionAttributeValues?: Table.AttributeValuesMap;
  };

  /**
   * The set of expression params used by dynamodb.
   */
  export type ExpressionParams = {
    ConditionExpression?: string;
    FilterExpression?: string;
    KeyConditionExpression?: string;
    UpdateExpression?: string;
    ProjectionExpression?: string;
  } & ExpressionAttributeParams;

  /**
   * Method to add additional expressions to the params.
   */
  export type AddExpressionParams = (params: ExpressionParams, attributes: ExpressionAttributes) => void;

  /**
   * Defines what general set of attributes are projected into the secondary index.
   * @param ALL - All of the attributes of an item are projected into the secondary index.
   * @param KEYS_ONLY - The table and the secondary index primary keys are projected into the secondary index.
   */
  export type ProjectionType = 'ALL' | 'KEYS_ONLY' | 'INCLUDE';

  /**
   * Input params for [DocumentClient.get]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#get-property}
   * Removes legacy parameters from the type definition, including AttributesToGet.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetInput extends Omit<DocumentClient.GetItemInput, 'AttributesToGet'> {}

  /**
   * Input params for [DocumentClient.put]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface PutInput extends Omit<DocumentClient.PutItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.delete]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#delete-property}
   * Removes legacy parameters from the type definition, including Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteInput extends Omit<DocumentClient.DeleteItemInput, 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.update]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property}
   * Removes legacy parameters from the type definition, including AttributeUpdates, Expected and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateInput
    extends Omit<DocumentClient.UpdateItemInput, 'AttributeUpdates' | 'Expected' | 'ConditionalOperator'> {}

  /**
   * Input params for [DocumentClient.query]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, KeyConditions, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryInput
    extends Omit<
      DocumentClient.QueryInput,
      'AttributesToGet' | 'KeyConditions' | 'QueryFilter' | 'ConditionalOperator'
    > {}

  /**
   * Input params for [DocumentClient.scan]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#scan-property}
   * Removes legacy parameters from the type definition, including AttributesToGet, QueryFilter and ConditionalOperator
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanInput
    extends Omit<DocumentClient.ScanInput, 'AttributesToGet' | 'ScanFilter' | 'ConditionalOperator'> {}

  /**
   * Input per table params for [DocumentClient.batchGet]{@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#batchGet-property}
   * Removes legacy parameters from the type definition, including AttributesToGet
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BatchGetTableInput extends Omit<DocumentClient.KeysAndAttributes, 'AttributesToGet'> {}

  /**
   * Base options for all table operations like get, put, delete, update and others.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export interface BaseOptions<T = {}> {
    /**
     * Expression attributes to use for resolving conditions and updates.  Will be used to generate the
     * ExpressionAttributeNames and ExpressionAttributeValues params in table operations.
     */
    attributes?: Table.ExpressionAttributes;

    /**
     * Array of expression condition resolvers that are joined together with AND, then used as
     * ConditionExpression or FilterExpression params in table operations.
     */
    conditions?: Condition.Resolver[];

    /**
     * Params to append on to the params that get passed to dynamodb.  This does mean these params can
     * be used to override any of the values generated by Table, so just be careful on what params you pass.
     */
    params?: Optional<T>;

    /**
     * User defined context that gets passed through to all Fields.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: any;
  }

  /**
   * Options used in following methods:  {@link Table.get}, {@link Table.getParams},
   * {@link Model.get} and {@link Model.getParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface GetOptions extends BaseOptions<GetInput> {}

  /**
   * Options used in following methods:  {@link Table.delete}, {@link Table.deleteParams}, {@link Model.delete}
   * and {@link Model.deleteParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DeleteOptions extends BaseOptions<DeleteInput> {}

  /**
   * Put method write options that determine how put will execute.
   *
   * - 'Always' - Default put behavior, that will always set the item weather it exists or now.
   * - 'Exists' - Only set the item if the item already exists, adds
   * - ConditionExpression="attribute_exists(#pk)", where #pk is the partition key name.
   * - 'NotExists' - Only set the item if the item does not exist, add
   * ConditionExpression="attribute_not_exists(#pk)", where #pk is the partition key name.
   */
  export type PutWriteOptions = 'Always' | 'Exists' | 'NotExists';

  /**
   * Options to used for put and putParams methods on {@link Table} and {@link Model}, along with
   * {@link Model.new} and {@link Model.replace}.
   */
  export interface PutOptions extends BaseOptions<PutInput> {
    /**
     * Allows put to be conditional based on if the item already exists.
     */
    writeOptions?: PutWriteOptions;
  }

  /**
   * Options used in following methods:  {@link Table.update}, {@link Table.updateParams},
   * {@link Model.update} and {@link Model.updateParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface UpdateOptions extends BaseOptions<UpdateInput> {}

  /**
   * Options used in following methods: {@link Table.query}, {@link Table.queryParams},
   * {@link Index.query} and {@link Index.queryParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface QueryOptions extends BaseOptions<QueryInput> {}

  /**
   * Options used in following methods: {@link Table.scan}, {@link Table.scanParams},
   * {@link Index.scan} and {@link Index.scanParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ScanOptions extends BaseOptions<ScanInput> {}

  /**
   * Options used in following methods: {@link Table.batchGet}, {@link Table.batchGetParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BatchGetTableOptions extends Omit<BaseOptions<BatchGetTableInput>, 'conditions'> {
    /** List of attributes to return from table for operation. */
    itemAttributes?: string[];

    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;
  }

  /**
   * Options used in following methods: {@link Table.batchWrite}, {@link Table.batchWriteParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface BatchWriteTableOptions extends Omit<BaseOptions, 'conditions'> {
    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;

    /** Returns the ReturnItemCollectionMetrics for the table operation. */
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
  }

  /**
   * Options used in following methods: {@link Table.transactGet}, {@link Table.transactGetParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TransactGetTableOptions extends Omit<BaseOptions, 'conditions' | 'attributes'> {
    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;
  }

  /** Key and item attributes for used when putting and item */
  export interface PutItem {
    /** Primary key of item to put. */
    key: Table.PrimaryKey.AttributeValuesMap;

    /** Attributes of the item to put. */
    item?: Table.AttributeValuesMap;
  }

  /** Param to transactGet* methods */
  export interface TransactGetItem {
    /** Primary key of items to get.  */
    key: Table.PrimaryKey.AttributeValuesMap;

    /** Attributes of the items to get. */
    itemAttributes?: string[];
  }

  /**
   * Options used in following methods: {@link Table.transactWrite}, {@link Table.transactWriteParams}.
   */
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface TransactWriteTableOptions extends Omit<BaseOptions, 'conditions' | 'attributes'> {
    /** Token to use for the transact request. */
    token?: DocumentClient.ClientRequestToken;

    /** Returns the ConsumedCapacity for the table operation. */
    consumed?: DocumentClient.ReturnConsumedCapacity;

    /** Returns the ReturnItemCollectionMetrics for the table operation. */
    metrics?: DocumentClient.ReturnItemCollectionMetrics;
  }

  /** Param to transactWrite* methods that contains the key and items for each operation supported. */
  export interface TransactWrite {
    /** Transaction based conditionCheck to validate a condition before writing. */
    conditionCheck?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      conditions: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based delete item. */
    delete?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based put item. */
    put?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      item?: Table.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Transaction based update item. */
    update?: {
      key: Table.PrimaryKey.AttributeValuesMap;
      item?: Update.ResolverMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];
  }

  /**
   * Default and Example table primary key with a generalized compact format.
   */
  export interface DefaultTableKey {
    /**
     * Table partition key.
     */
    P: PrimaryKey.PartitionString;

    /**
     * Table sort key. The sort key is optional to support the sort key as being option for queryParams
     * and query methods.
     */
    S?: PrimaryKey.SortString;
  }

  /**
   * Table constructor param for the generic form of {@link TableParams}.
   * @param KEY - Interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including table
   * and index primary key and all defined index projected attributes.
   */
  export interface TableParamsT<KEY, ATTRIBUTES> extends TableParams {
    /** Generic form of {@link TableParam.keyAttributes}. */
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /** Generic form of {@link TableParam.keySchema}. */
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;
  }

  /** Generic form of {@link Table.PutItem}. */
  export interface PutItemT<KEY> extends PutItem {
    /** Primary key of item to put. */
    key: Table.PrimaryKey.AttributeValuesMapT<KEY>;

    /** Attributes of the item to put. */
    item?: Table.AttributeValuesMap;
  }

  /** Generic form of {@link Table.TransactGetItem}. */
  export interface TransactGetItemT<KEY> extends TransactGetItem {
    /** Keys of items to get.  */
    key: Table.PrimaryKey.AttributeValuesMapT<KEY>;

    /** Attributes of the items to get. */
    itemAttributes?: string[];
  }

  /**  Generic form of {@link Table.TransactWrite}. */
  export interface TransactWriteT<KEY> extends TransactWrite {
    /** Generic form of {@link Table.TransactWrite.conditionCheck}. */
    conditionCheck?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      conditions: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.delete}. */
    delete?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.put}. */
    put?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      item?: Table.AttributeValuesMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];

    /** Generic form of {@link Table.TransactWrite.update}. */
    update?: {
      key: Table.PrimaryKey.AttributeValuesMapT<KEY>;
      item?: Update.ResolverMap;
      conditions?: Condition.Resolver[];
      returnFailure?: DocumentClient.ReturnValuesOnConditionCheckFailure;
    }[];
  }

  /**
   * Generic form of {@link Table}.
   * @param KEY - The interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including
   * table and index primary key and all defined index projected attributes.
   */
  export interface TableT<KEY = DefaultTableKey, ATTRIBUTES = KEY> extends Table {
    /** Generic form of {@link Table.keyAttributes}. */
    keyAttributes: PrimaryKey.AttributeTypesMapT<ATTRIBUTES>;

    /** Generic form of {@link Table.keySchema}. */
    keySchema: PrimaryKey.KeyTypesMapT<KEY>;

    /**
     * See Generic form of {@link Table.getParams}.
     */
    getParams(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): DocumentClient.GetItemInput;

    /** See Generic form of {@link Table.deleteParams}. */
    deleteParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): DocumentClient.DeleteItemInput;

    /** See Generic form of {@link Table.putParams}. */
    putParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): DocumentClient.PutItemInput;

    /** See Generic form of {@link Table.updateParams}. */
    updateParams(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.ResolverMap,
      options?: Table.UpdateOptions,
    ): DocumentClient.UpdateItemInput;

    /** See Generic form of {@link Table.queryParams}. */
    queryParams(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): DocumentClient.QueryInput;

    /** See Generic form of {@link Table.scanParams}. */
    scanParams(options?: Table.ScanOptions): DocumentClient.ScanInput;

    /** See Generic form of {@link Table.batchGetParams}. */
    batchGetParams(
      keys: PrimaryKey.AttributeValuesMapT<KEY>[],
      options?: Table.BatchGetTableOptions,
    ): DocumentClient.BatchGetItemInput;

    /** See Generic form of {@link Table.batchWriteParams}. */
    batchWriteParams(
      putItems?: Table.PutItemT<KEY>[],
      delKeys?: PrimaryKey.AttributeValuesMapT<KEY>[],
      options?: Table.BatchWriteTableOptions,
    ): DocumentClient.BatchWriteItemInput;

    /** See Generic form of {@link Table.transactGetParams}. */
    transactGetParams(
      keys?: PrimaryKey.AttributeValuesMapT<KEY>[],
      getItems?: Table.TransactGetItemT<KEY>[],
      options?: Table.TransactGetTableOptions,
    ): DocumentClient.TransactGetItemsInput;

    /** See Generic form of {@link Table.transactWriteParams}. */
    transactWriteParams(
      write: Table.TransactWriteT<KEY>,
      options?: Table.TransactWriteTableOptions,
    ): DocumentClient.TransactWriteItemsInput;

    /** See Generic form of {@link Table.get}. */
    get(key: PrimaryKey.AttributeValuesMapT<KEY>, options?: Table.GetOptions): Promise<DocumentClient.GetItemOutput>;

    /** See Generic form of {@link Table.delete}. */
    delete(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      options?: Table.DeleteOptions,
    ): Promise<DocumentClient.DeleteItemOutput>;

    /** See Generic form of {@link Table.put}. */
    put(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Table.AttributeValuesMap,
      options?: Table.PutOptions,
    ): Promise<DocumentClient.PutItemOutput>;

    /** See Generic form of {@link Table.update}. */
    update(
      key: PrimaryKey.AttributeValuesMapT<KEY>,
      item?: Update.ResolverMap,
      options?: UpdateOptions,
    ): Promise<DocumentClient.UpdateItemOutput>;

    /** See Generic form of {@link Table.query}. */
    query(key: PrimaryKey.KeyQueryMapT<KEY>, options?: Table.QueryOptions): Promise<DocumentClient.QueryOutput>;

    /** See Generic form of {@link Table.scan}. */
    scan(options?: ScanOptions): Promise<DocumentClient.ScanOutput>;

    /** See Generic form of {@link Table.batchGetParams}. */
    batchGet(
      keys: PrimaryKey.AttributeValuesMapT<KEY>[],
      options?: Table.BatchGetTableOptions,
    ): Promise<DocumentClient.BatchGetItemOutput>;

    /** See Generic form of {@link Table.batchWriteParams}. */
    batchWrite(
      putItems?: Table.PutItemT<KEY>[],
      delKeys?: PrimaryKey.AttributeValuesMapT<KEY>[],
      options?: Table.BatchWriteTableOptions,
    ): Promise<DocumentClient.BatchWriteItemOutput>;

    /** See Generic form of {@link Table.transactGetParams}. */
    transactGet(
      keys?: PrimaryKey.AttributeValuesMapT<KEY>[],
      getItems?: Table.TransactGetItemT<KEY>[],
      options?: Table.TransactGetTableOptions,
    ): Promise<DocumentClient.TransactGetItemsOutput>;

    /** See Generic form of {@link Table.transactWriteParams}. */
    transactWrite(
      write: Table.TransactWriteT<KEY>,
      options?: Table.TransactWriteTableOptions,
    ): Promise<DocumentClient.TransactWriteItemsOutput>;
  }

  /**
   * Creates the generic form of {@link Table} used in TypeScript to get strong typing.
   *
   *
   * So you may ask, why have createTable over just using new {@link Table.TableT}?  The reason is that since the method
   * signature is exactly the same (same method names with same params, only typings are more strict) between
   * TableT and Table there is no need to have TableT class with just a bunch of pass through wrapper methods.
   * This also makes the {@link Table} TSDocs easier to read without all of the TypeScript Generic types.  Same
   * approach is taken with {@link Index} and {@link Model}.
   * @param KEY - The interface of the table's primary key.
   * @param ATTRIBUTES - The interface or type that has all required attributes, including table and index
   * primary key and all defined index projected attributes.
   * @param params - Table constructor params.
   * @returns A new table as TableT.
   */
  export function createTable<KEY = Table.DefaultTableKey, ATTRIBUTES = KEY>(
    params: TableParamsT<KEY, ATTRIBUTES>,
  ): TableT<KEY, ATTRIBUTES> {
    return new Table(params) as TableT<KEY, ATTRIBUTES>;
  }
}
