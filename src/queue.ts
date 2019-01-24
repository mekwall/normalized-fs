const queue: any[] = [];

export function enqueue(elem: any) {
  // debug('ENQUEUE', elem[0].name, elem[1]);
  queue.push(elem);
}

export function retry() {
  const elem = queue.shift();
  if (elem) {
    // debug('RETRY', elem[0].name, elem[1]);
    elem[0].apply(null, elem[1]);
  }
}
