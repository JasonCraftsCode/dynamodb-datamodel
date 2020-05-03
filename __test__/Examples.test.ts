// Add all documentation examples here to ensure they compile and work
// TODO:
// - ideally documentation could just be extracted and compiled
// - imports will need to be different
// - how to organize? either separate by well defined comments or functions

import { Condition } from '../src/Condition';

it('Validate Condition exports', () => {
  expect(typeof Condition.eq).toEqual('function');
  expect(typeof Condition.ne).toEqual('function');
});
