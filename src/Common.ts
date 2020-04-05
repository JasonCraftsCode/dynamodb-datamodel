import { Response } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

export type PromiseResult<D, E> = D & { $response: Response<D, E> };

export type Optional<T> = { [P in keyof T]?: T[P] };

export type BinaryValue = DocumentClient.binaryType;
export type StringSetValue = DocumentClient.StringSet;
export type NumberSetValue = DocumentClient.NumberSet;
export type BinarySetValue = DocumentClient.BinarySet;
export type MapValue = { [key: string]: AttributeValue };
export type ListValue = AttributeValue[];

export let onError = (msg: string) => {
  throw new Error(msg);
};

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

export type PrimaryKeyValue = string | number | Buffer;

export enum AttributeType {
  Binary = 'B',
  Number = 'N',
  String = 'S',
  Boolean = 'BOOL',
  Null = 'NULL',
  List = 'L',
  Map = 'M',
  BinarySet = 'BS',
  NumberSet = 'NS',
  StringSet = 'SS',
}

export enum AttributeSetType {
  BinarySet = 'BS',
  NumberSet = 'NS',
  StringSet = 'SS',
}

export enum IndexProjection {
  KeyOnly,
  Partial,
  All,
}

export enum ConditionOperator {
  Equal = '=',
  NotEqual = '<>',
  LessThen = '<',
  LessThenEqual = '<=',
  GreaterThen = '>',
  GreaterThenEqual = '>=',
  And = 'AND',
  Or = 'OR',
  Not = 'NOT',
  Between = 'BETWEEN',
  In = 'IN',
  BeginsWith = 'begins_with',
  Contains = 'contains',
  Type = 'attribute_type',
  Exists = 'attribute_exists',
  NotExists = 'attribute_not_exists',
  Size = 'size',
}

export enum SortConditionOperator {
  Equal = '=',
  LessThen = '<',
  LessThenEqual = '<=',
  GreaterThen = '>',
  GreaterThenEqual = '>=',
  Between = 'BETWEEN',
  BeginsWidth = 'begins_with',
}
/*
export function isBinary(value: any): value is BinaryValue {
  return (
    typeof value === 'object' &&
    value.constructor &&
    value.constructor.name === 'Buffer'
  );
}

export function isSet(
  value: object
): value is StringSetValue | NumberSetValue | BinarySetValue {
  return (
    typeof value === 'object' &&
    value.constructor &&
    value.constructor.name === 'Set'
  );
}

export function getAttributeSetType(value: any): AttributeType | undefined {
  if (value.size > 0) {
    const setValue = value.values().next().value;
    switch (typeof setValue) {
      case 'bigint':
      case 'number':
        return AttributeType.NumberSet;
      case 'string':
        return AttributeType.StringSet;
      case 'object':
        if (isBinary(setValue)) return AttributeType.BinarySet;
    }
  }
  return undefined;
}

export function isValueSet(value: any): value is AttributeSetValue {
  return isSet(value) && getAttributeSetType(value) !== undefined;
}

export function isStringSet(value: any): value is StringSetValue {
  return isSet(value) && getAttributeSetType(value) === AttributeType.StringSet;
}

export function isNumberSet(value: any): value is NumberSetValue {
  return isSet(value) && getAttributeSetType(value) === AttributeType.NumberSet;
}

export function isBinarySet(value: any): value is BinarySetValue {
  return isSet(value) && getAttributeSetType(value) === AttributeType.BinarySet;
}

export function getAttributeType(value: AttributeValue): AttributeType {
  if (value === null || value === undefined) return AttributeType.Null;
  switch (typeof value) {
    case 'bigint':
      return AttributeType.Number;
    case 'boolean':
      return AttributeType.Boolean;
    case 'number':
      return AttributeType.Number;
    case 'string':
      return AttributeType.String;
    case 'function':
      throw new Error('function is not a AttributeValue');
    case 'object':
      if (Array.isArray(value)) return AttributeType.List;
      if (isBinary(value)) return AttributeType.Binary;
      if (isSet(value)) {
        //if (value.size === 0)
        //  throw new Error('Cannot determine type of empty Set');
        const setType = getAttributeSetType(value);
        if (setType) return setType;
        throw new Error(`Unsupported set type: `);
      }
      return AttributeType.Map;
  }
}
*/
