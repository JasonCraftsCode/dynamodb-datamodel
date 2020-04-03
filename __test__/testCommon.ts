// t = milliseconds
export function delay(tms: number, v: any) {
  return new Promise((resolve) => {
    setTimeout(resolve.bind(null, v), tms);
  });
}

export function delayCallback(tms: number, f: () => void) {
  return new Promise((resolve, reject) => {
    f();
  });
}
