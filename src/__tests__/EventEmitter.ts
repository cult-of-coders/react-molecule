import EventEmitter from '../EventEmitter';
import { describe, it } from 'mocha';
import { assert } from 'chai';

describe('EventEmitter', () => {
  it('Should work with on and smart event', done => {
    const emitter = new EventEmitter({
      context: 'test',
    });

    const Events = {
      DEMO: {
        name: 'demo',
      },
    };

    emitter.on(Events.DEMO, () => {
      done();
      emitter.removeAllListeners();
    });

    emitter.emit(Events.DEMO, 'Hello!');
  });

  it('Shuld throw error when validation does not work', done => {
    const emitter = new EventEmitter({
      context: 'test',
      debug: true,
    });

    const Events = {
      DEMO: {
        name: 'demo',
        validate() {
          throw 'I am not allowing!';
        },
      },
    };

    try {
      emitter.emit(Events.DEMO);
    } catch (e) {
      assert.isString(e);
      done();
    }
  });

  it('Shuld work with once()', done => {
    const emitter = new EventEmitter({
      context: 'test',
      debug: true,
    });

    const Events = {
      DEMO: {
        name: 'demo',
      },
    };

    let inAlready = false;
    emitter.once(Events.DEMO, () => {
      if (!inAlready) {
        inAlready = true;
        done();
      } else {
        done('Should not be here any more!');
      }
    });

    emitter.emit(Events.DEMO);
    emitter.emit(Events.DEMO);
    emitter.emit(Events.DEMO);
  });
});
