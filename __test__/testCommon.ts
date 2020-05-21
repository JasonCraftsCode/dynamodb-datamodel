import { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb';
import { ExpressionAttributes } from '../src/ExpressionAttributes';
import { Table } from '../src/Table';
import { Update, UpdateExpression } from '../src/Update';

// t = milliseconds
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function delay(tms: number, v: any): Promise<unknown> {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, v), tms);
  });
}
/*
export function delayCallback(tms: number, f: () => void) {
  return new Promise((resolve, reject) => {
    f();
  });
}
*/

export function buildUpdate(
  updateMap: Update.ResolverMap,
  exp = new UpdateExpression(),
): {
  UpdateExpression?: string | undefined;
  ExpressionAttributeNames?: ExpressionAttributeNameMap;
  ExpressionAttributeValues?: Table.AttributeValuesMap;
} {
  const params = {};
  UpdateExpression.addParam(updateMap, exp, params);
  ExpressionAttributes.addParams(exp.attributes, params);
  return params;
}
