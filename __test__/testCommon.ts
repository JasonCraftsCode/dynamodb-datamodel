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

export function buildUpdateParams(
  updateMap?: Update.ResolverMap,
): { UpdateExpression?: string } & Table.ExpressionAttributeParams {
  const params = {};
  const attributes = new ExpressionAttributes();
  UpdateExpression.addParams(params, attributes, updateMap);
  ExpressionAttributes.addParams(params, attributes);
  return params;
}
