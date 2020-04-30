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
