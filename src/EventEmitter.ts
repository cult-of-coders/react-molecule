import * as BaseEventEmitter from 'eventemitter3';

export type Options = {
  context?: string;
  debug?: boolean | string;
  parent?: EventEmitter;
};

export type ObjectEvent = {
  name: string;
  validate?: (params) => void;
};

export type Event = string | symbol | ObjectEvent;

export default class EventEmitter extends BaseEventEmitter {
  options: Options;

  constructor(options: Options = {}) {
    super();

    this.options = options;
  }

  emit(event: Event, ...args: any[]): boolean {
    if (event && typeof event === 'object' && !!event.name) {
      if (event.validate) {
        event.validate.call(null, ...args);
      }

      event = event.name;
    }

    this.logEmit(event, ...args);

    const result = super.emit(<string | symbol>event, ...args);

    if (this.options.parent) {
      this.options.parent.emit(event, ...args);
    }

    return result;
  }

  on(event: Event, handler: (...args: any[]) => void): this {
    if (typeof event === 'object' && !!event.name) {
      event = event.name;
    }

    this.logOn(event);

    return super.on(<string | symbol>event, handler);
  }

  off(event: Event, handler: (...args: any[]) => void): this {
    if (typeof event === 'object' && !!event.name) {
      event = event.name;
    }

    return super.off(<string | symbol>event, handler);
  }

  once(event: Event, handler: (...args: any[]) => void): this {
    if (typeof event === 'object' && !!event.name) {
      event = event.name;
    }

    this.logOn(event);

    return super.once(<string | symbol>event, handler);
  }

  private logEmit(event: any, ...args) {
    let { context, debug } = this.options;

    if (debug) {
      context = context || 'anonymous';
      console.log(`[${context}] Emitted ${event} with arguments: `, ...args);
    }
  }

  private logOn(event: any) {
    let { context, debug } = this.options;

    if (debug) {
      context = context || 'anonymous';
      console.log(`[${context}] Started listening to "${event}" event`);
    }
  }
}
