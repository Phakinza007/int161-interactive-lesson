export class EventEmitter {
  #h = new Map();
  on(name, fn) {
    if (!this.#h.has(name)) this.#h.set(name, []);
    this.#h.get(name).push(fn);
    return this;
  }
  once(name, fn) {
    const w = (...a) => { this.off(name, w); fn(...a); };
    return this.on(name, w);
  }
  off(name, fn) {
    this.#h.set(name, (this.#h.get(name) || []).filter((f) => f !== fn));
    return this;
  }
  emit(name, ...args) {
    const list = this.#h.get(name) || [];
    for (const f of [...list]) f(...args);
    return list.length > 0;
  }
}
