// node_modules/solid-js/dist/solid.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
function setHydrateContext(context) {
  sharedConfig.context = context;
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: sharedConfig.getNextContextId(),
    count: 0
  };
}
var IS_DEV = false;
var equalFn = (a, b) => a === b;
var $PROXY = Symbol("solid-proxy");
var SUPPORTS_PROXY = typeof Proxy === "function";
var $TRACK = Symbol("solid-track");
var $DEVCOMP = Symbol("solid-dev-component");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var NO_INIT = {};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = (value2) => {
    if (typeof value2 === "function") {
      if (Transition && Transition.running && Transition.sources.has(s)) value2 = value2(s.tValue);
      else value2 = value2(s.value);
    }
    return writeSignal(s, value2);
  };
  return [readSignal.bind(s), setter];
}
function createComputed(fn, value, options) {
  const c = createComputation(fn, value, true, STALE);
  if (Scheduler && Transition && Transition.running) Updates.push(c);
  else updateComputation(c);
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  if (Scheduler && Transition && Transition.running) Updates.push(c);
  else updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
  if (s) c.suspense = s;
  if (!options || !options.render) c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || void 0;
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE;
    Updates.push(c);
  } else updateComputation(c);
  return readSignal.bind(c);
}
function isPromise(v) {
  return v && typeof v === "object" && "then" in v;
}
function createResource(pSource, pFetcher, pOptions) {
  let source;
  let fetcher;
  let options;
  if (typeof pFetcher === "function") {
    source = pSource;
    fetcher = pFetcher;
    options = pOptions || {};
  } else {
    source = true;
    fetcher = pSource;
    options = pFetcher || {};
  }
  let pr = null, initP = NO_INIT, id = null, loadedUnderTransition = false, scheduled = false, resolved = "initialValue" in options, dynamic = typeof source === "function" && createMemo(source);
  const contexts = /* @__PURE__ */ new Set(), [value, setValue] = (options.storage || createSignal)(options.initialValue), [error, setError] = createSignal(void 0), [track, trigger] = createSignal(void 0, {
    equals: false
  }), [state, setState] = createSignal(resolved ? "ready" : "unresolved");
  if (sharedConfig.context) {
    id = sharedConfig.getNextContextId();
    if (options.ssrLoadFrom === "initial") initP = options.initialValue;
    else if (sharedConfig.load && sharedConfig.has(id)) initP = sharedConfig.load(id);
  }
  function loadEnd(p, v, error2, key) {
    if (pr === p) {
      pr = null;
      key !== void 0 && (resolved = true);
      if ((p === initP || v === initP) && options.onHydrated) queueMicrotask(() => options.onHydrated(key, {
        value: v
      }));
      initP = NO_INIT;
      if (Transition && p && loadedUnderTransition) {
        Transition.promises.delete(p);
        loadedUnderTransition = false;
        runUpdates(() => {
          Transition.running = true;
          completeLoad(v, error2);
        }, false);
      } else completeLoad(v, error2);
    }
    return v;
  }
  function completeLoad(v, err) {
    runUpdates(() => {
      if (err === void 0) setValue(() => v);
      setState(err !== void 0 ? "errored" : resolved ? "ready" : "unresolved");
      setError(err);
      for (const c of contexts.keys()) c.decrement();
      contexts.clear();
    }, false);
  }
  function read() {
    const c = SuspenseContext && useContext(SuspenseContext), v = value(), err = error();
    if (err !== void 0 && !pr) throw err;
    if (Listener && !Listener.user && c) {
      createComputed(() => {
        track();
        if (pr) {
          if (c.resolved && Transition && loadedUnderTransition) Transition.promises.add(pr);
          else if (!contexts.has(c)) {
            c.increment();
            contexts.add(c);
          }
        }
      });
    }
    return v;
  }
  function load(refetching = true) {
    if (refetching !== false && scheduled) return;
    scheduled = false;
    const lookup = dynamic ? dynamic() : source;
    loadedUnderTransition = Transition && Transition.running;
    if (lookup == null || lookup === false) {
      loadEnd(pr, untrack(value));
      return;
    }
    if (Transition && pr) Transition.promises.delete(pr);
    let error2;
    const p = initP !== NO_INIT ? initP : untrack(() => {
      try {
        return fetcher(lookup, {
          value: value(),
          refetching
        });
      } catch (fetcherError) {
        error2 = fetcherError;
      }
    });
    if (error2 !== void 0) {
      loadEnd(pr, void 0, castError(error2), lookup);
      return;
    } else if (!isPromise(p)) {
      loadEnd(pr, p, void 0, lookup);
      return p;
    }
    pr = p;
    if ("v" in p) {
      if (p.s === 1) loadEnd(pr, p.v, void 0, lookup);
      else loadEnd(pr, void 0, castError(p.v), lookup);
      return p;
    }
    scheduled = true;
    queueMicrotask(() => scheduled = false);
    runUpdates(() => {
      setState(resolved ? "refreshing" : "pending");
      trigger();
    }, false);
    return p.then((v) => loadEnd(p, v, void 0, lookup), (e) => loadEnd(p, void 0, castError(e), lookup));
  }
  Object.defineProperties(read, {
    state: {
      get: () => state()
    },
    error: {
      get: () => error()
    },
    loading: {
      get() {
        const s = state();
        return s === "pending" || s === "refreshing";
      }
    },
    latest: {
      get() {
        if (!resolved) return read();
        const err = error();
        if (err && !pr) throw err;
        return value();
      }
    }
  });
  let owner = Owner;
  if (dynamic) createComputed(() => (owner = Owner, load(false)));
  else load(false);
  return [read, {
    refetch: (info) => runWithOwner(owner, () => load(info)),
    mutate: setValue
  }];
}
function batch(fn) {
  return runUpdates(fn, false);
}
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
function on(deps, fn, options) {
  const isArray = Array.isArray(deps);
  let prevInput;
  let defer = options && options.defer;
  return (prevValue) => {
    let input;
    if (isArray) {
      input = Array(deps.length);
      for (let i = 0; i < deps.length; i++) input[i] = deps[i]();
    } else input = deps();
    if (defer) {
      defer = false;
      return prevValue;
    }
    const result = untrack(() => fn(input, prevInput, prevValue));
    prevInput = input;
    return result;
  };
}
function onCleanup(fn) {
  if (Owner === null) ;
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
function getListener() {
  return Listener;
}
function getOwner() {
  return Owner;
}
function runWithOwner(o, fn) {
  const prev = Owner;
  const prevListener = Listener;
  Owner = o;
  Listener = null;
  try {
    return runUpdates(fn, true);
  } catch (err) {
    handleError(err);
  } finally {
    Owner = prev;
    Listener = prevListener;
  }
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true
      });
      t.done || (t.done = new Promise((res) => t.resolve = res));
      t.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : void 0;
  });
}
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
function resumeEffects(e) {
  Effects.push.apply(Effects, e);
  e.length = 0;
}
function createContext(defaultValue, options) {
  const id = Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
}
function children(fn) {
  const children2 = createMemo(fn);
  const memo2 = createMemo(() => resolveChildren(children2()));
  memo2.toArray = () => {
    const c = memo2();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo2;
}
var SuspenseContext;
function getSuspenseContext() {
  return SuspenseContext || (SuspenseContext = createContext());
}
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const observers = this.observers;
    if (!observers || observers[observers.length - 1] !== Listener) {
      const sSlot = observers ? observers.length : 0;
      if (!Listener.sources) {
        Listener.sources = [this];
        Listener.sourceSlots = [sSlot];
      } else {
        Listener.sources.push(this);
        Listener.sourceSlots.push(sSlot);
      }
      if (!observers) {
        this.observers = [Listener];
        this.observerSlots = [Listener.sources.length - 1];
      } else {
        observers.push(Listener);
        this.observerSlots.push(Listener.sources.length - 1);
      }
    }
  }
  if (runningTransition && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning) node.value = value;
    } else node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o)) continue;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
          else o.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = void 0;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      if (!Transition.sources.has(node)) node.value = nextValue;
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c.state = 0;
    c.tState = state;
  }
  if (Owner === null) ;
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c];
      else Owner.tOwned.push(c);
    } else {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  if (ExternalSourceConfig && c.fn) {
    const sourceFn = c.fn;
    const [track, trigger] = createSignal(void 0, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(sourceFn, trigger);
    onCleanup(() => ordinary.dispose());
    let inTransition;
    const triggerInTransition = () => startTransition(trigger).then(() => {
      if (inTransition) {
        inTransition.dispose();
        inTransition = void 0;
      }
    });
    c.fn = (x) => {
      track();
      if (Transition && Transition.running) {
        if (!inTransition) inTransition = ExternalSourceConfig.factory(sourceFn, triggerInTransition);
        return inTransition.track(x);
      }
      return ordinary.track(x);
    };
  }
  return c;
}
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0) return;
  if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (runningTransition ? node.tState : node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
    else runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e2 of Effects) {
        "tState" in e2 && (e2.state = e2.tState);
        delete e2.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d of disposed) cleanNode(d);
        for (const v of sources) {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
          }
          if (v.tOwned) v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
          v.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
  if (res) res();
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function scheduleQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition) node.tState = 0;
  else node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition) o.tState = PENDING;
      else o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  if (Transition && Transition.running) node.tState = 0;
  else node.state = 0;
}
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
  }
}
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
function runErrors(err, fns, owner) {
  try {
    for (const f of fns) f(err);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  if (Effects) Effects.push({
    fn() {
      runErrors(error, fns, owner);
    },
    state: STALE
  });
  else runErrors(error, fns, owner);
}
function resolveChildren(children2) {
  if (typeof children2 === "function" && !children2.length) return resolveChildren(children2());
  if (Array.isArray(children2)) {
    const results = [];
    for (let i = 0; i < children2.length; i++) {
      const result = resolveChildren(children2[i]);
      if (Array.isArray(result)) {
        if (result.length < 32768) results.push.apply(results, result);
        else for (let j = 0; j < result.length; j++) results.push(result[j]);
      } else {
        results.push(result);
      }
    }
    return results;
  }
  return children2;
}
function createProvider(id, options) {
  return function provider(props) {
    let res;
    createRenderEffect(() => res = untrack(() => {
      Owner.context = {
        ...Owner.context,
        [id]: props.value
      };
      return children(() => props.children);
    }), void 0);
    return res;
  };
}
var FALLBACK = Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++) ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === void 0 ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== void 0 && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
  };
}
var hydrationEnabled = false;
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c = sharedConfig.context;
      setHydrateContext(nextHydrateContext());
      const r = untrack(() => Comp(props || {}));
      setHydrateContext(c);
      return r;
    }
  }
  return untrack(() => Comp(props || {}));
}
function trueFn() {
  return true;
}
var propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function resolveSources() {
  for (let i = 0, length = this.length; i < length; ++i) {
    const v = this[i]();
    if (v !== void 0) return v;
  }
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (SUPPORTS_PROXY && proxy) {
    return new Proxy({
      get(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          const v = resolveSource(sources[i])[property];
          if (v !== void 0) return v;
        }
      },
      has(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          if (property in resolveSource(sources[i])) return true;
        }
        return false;
      },
      keys() {
        const keys = [];
        for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
        return [...new Set(keys)];
      }
    }, propTraps);
  }
  const sourcesMap = {};
  const defined = /* @__PURE__ */ Object.create(null);
  for (let i = sources.length - 1; i >= 0; i--) {
    const source = sources[i];
    if (!source) continue;
    const sourceKeys = Object.getOwnPropertyNames(source);
    for (let i2 = sourceKeys.length - 1; i2 >= 0; i2--) {
      const key = sourceKeys[i2];
      if (key === "__proto__" || key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (!defined[key]) {
        defined[key] = desc.get ? {
          enumerable: true,
          configurable: true,
          get: resolveSources.bind(sourcesMap[key] = [desc.get.bind(source)])
        } : desc.value !== void 0 ? desc : void 0;
      } else {
        const sources2 = sourcesMap[key];
        if (sources2) {
          if (desc.get) sources2.push(desc.get.bind(source));
          else if (desc.value !== void 0) sources2.push(() => desc.value);
        }
      }
    }
  }
  const target = {};
  const definedKeys = Object.keys(defined);
  for (let i = definedKeys.length - 1; i >= 0; i--) {
    const key = definedKeys[i], desc = defined[key];
    if (desc && desc.get) Object.defineProperty(target, key, desc);
    else target[key] = desc ? desc.value : void 0;
  }
  return target;
}
function splitProps(props, ...keys) {
  const len = keys.length;
  if (SUPPORTS_PROXY && $PROXY in props) {
    const blocked = len > 1 ? keys.flat() : keys[0];
    const res = keys.map((k) => {
      return new Proxy({
        get(property) {
          return k.includes(property) ? props[property] : void 0;
        },
        has(property) {
          return k.includes(property) && property in props;
        },
        keys() {
          return k.filter((property) => property in props);
        }
      }, propTraps);
    });
    res.push(new Proxy({
      get(property) {
        return blocked.includes(property) ? void 0 : props[property];
      },
      has(property) {
        return blocked.includes(property) ? false : property in props;
      },
      keys() {
        return Object.keys(props).filter((k) => !blocked.includes(k));
      }
    }, propTraps));
    return res;
  }
  const objects = [];
  for (let i = 0; i <= len; i++) {
    objects[i] = {};
  }
  for (const propName of Object.getOwnPropertyNames(props)) {
    let keyIndex = len;
    for (let i = 0; i < keys.length; i++) {
      if (keys[i].includes(propName)) {
        keyIndex = i;
        break;
      }
    }
    const desc = Object.getOwnPropertyDescriptor(props, propName);
    const isDefaultDesc = !desc.get && !desc.set && desc.enumerable && desc.writable && desc.configurable;
    isDefaultDesc ? objects[keyIndex][propName] = desc.value : Object.defineProperty(objects[keyIndex], propName, desc);
  }
  return objects;
}
var narrowedError = (name) => `Stale read from <${name}>.`;
function For(props) {
  const fallback = "fallback" in props && {
    fallback: () => props.fallback
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, void 0, void 0);
  const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, {
    equals: (a, b) => !a === !b
  });
  return createMemo(() => {
    const c = condition();
    if (c) {
      const child = props.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(keyed ? c : () => {
        if (!untrack(condition)) throw narrowedError("Show");
        return conditionValue();
      })) : child;
    }
    return props.fallback;
  }, void 0, void 0);
}
var Errors;
function resetErrorBoundaries() {
  Errors && [...Errors].forEach((fn) => fn());
}
var SuspenseListContext = /* @__PURE__ */ createContext();
function Suspense(props) {
  let counter = 0, show, ctx, p, flicker, error;
  const [inFallback, setFallback] = createSignal(false), SuspenseContext2 = getSuspenseContext(), store = {
    increment: () => {
      if (++counter === 1) setFallback(true);
    },
    decrement: () => {
      if (--counter === 0) setFallback(false);
    },
    inFallback,
    effects: [],
    resolved: false
  }, owner = getOwner();
  if (sharedConfig.context && sharedConfig.load) {
    const key = sharedConfig.getContextId();
    let ref = sharedConfig.load(key);
    if (ref) {
      if (typeof ref !== "object" || ref.s !== 1) p = ref;
      else sharedConfig.gather(key);
    }
    if (p && p !== "$$f") {
      const [s, set] = createSignal(void 0, {
        equals: false
      });
      flicker = s;
      p.then(() => {
        if (sharedConfig.done) return set();
        sharedConfig.gather(key);
        setHydrateContext(ctx);
        set();
        setHydrateContext();
      }, (err) => {
        error = err;
        set();
      });
    }
  }
  const listContext = useContext(SuspenseListContext);
  if (listContext) show = listContext.register(store.inFallback);
  let dispose2;
  onCleanup(() => dispose2 && dispose2());
  return createComponent(SuspenseContext2.Provider, {
    value: store,
    get children() {
      return createMemo(() => {
        if (error) throw error;
        ctx = sharedConfig.context;
        if (flicker) {
          flicker();
          return flicker = void 0;
        }
        if (ctx && p === "$$f") setHydrateContext();
        const rendered = createMemo(() => props.children);
        return createMemo((prev) => {
          const inFallback2 = store.inFallback(), {
            showContent = true,
            showFallback = true
          } = show ? show() : {};
          if ((!inFallback2 || p && p !== "$$f") && showContent) {
            store.resolved = true;
            dispose2 && dispose2();
            dispose2 = ctx = p = void 0;
            resumeEffects(store.effects);
            return rendered();
          }
          if (!showFallback) return;
          if (dispose2) return prev;
          return createRoot((disposer) => {
            dispose2 = disposer;
            if (ctx) {
              setHydrateContext({
                id: ctx.id + "F",
                count: 0
              });
              ctx = void 0;
            }
            return props.fallback;
          }, owner);
        });
      });
    }
  });
}

// node_modules/solid-js/web/dist/web.js
var booleans = [
  "allowfullscreen",
  "async",
  "alpha",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "disabled",
  "formnovalidate",
  "hidden",
  "indeterminate",
  "inert",
  "ismap",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "seamless",
  "selected",
  "adauctionheaders",
  "browsingtopics",
  "credentialless",
  "defaultchecked",
  "defaultmuted",
  "defaultselected",
  "defer",
  "disablepictureinpicture",
  "disableremoteplayback",
  "preservespitch",
  "shadowrootclonable",
  "shadowrootcustomelementregistry",
  "shadowrootdelegatesfocus",
  "shadowrootserializable",
  "sharedstoragewritable"
];
var Properties = /* @__PURE__ */ new Set([
  "className",
  "value",
  "readOnly",
  "noValidate",
  "formNoValidate",
  "isMap",
  "noModule",
  "playsInline",
  "adAuctionHeaders",
  "allowFullscreen",
  "browsingTopics",
  "defaultChecked",
  "defaultMuted",
  "defaultSelected",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "preservesPitch",
  "shadowRootClonable",
  "shadowRootCustomElementRegistry",
  "shadowRootDelegatesFocus",
  "shadowRootSerializable",
  "sharedStorageWritable",
  ...booleans
]);
var ChildProperties = /* @__PURE__ */ new Set(["innerHTML", "textContent", "innerText", "children"]);
var Aliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  className: "class",
  htmlFor: "for"
});
var PropAliases = /* @__PURE__ */ Object.assign(/* @__PURE__ */ Object.create(null), {
  class: "className",
  novalidate: {
    $: "noValidate",
    FORM: 1
  },
  formnovalidate: {
    $: "formNoValidate",
    BUTTON: 1,
    INPUT: 1
  },
  ismap: {
    $: "isMap",
    IMG: 1
  },
  nomodule: {
    $: "noModule",
    SCRIPT: 1
  },
  playsinline: {
    $: "playsInline",
    VIDEO: 1
  },
  readonly: {
    $: "readOnly",
    INPUT: 1,
    TEXTAREA: 1
  },
  adauctionheaders: {
    $: "adAuctionHeaders",
    IFRAME: 1
  },
  allowfullscreen: {
    $: "allowFullscreen",
    IFRAME: 1
  },
  browsingtopics: {
    $: "browsingTopics",
    IMG: 1
  },
  defaultchecked: {
    $: "defaultChecked",
    INPUT: 1
  },
  defaultmuted: {
    $: "defaultMuted",
    AUDIO: 1,
    VIDEO: 1
  },
  defaultselected: {
    $: "defaultSelected",
    OPTION: 1
  },
  disablepictureinpicture: {
    $: "disablePictureInPicture",
    VIDEO: 1
  },
  disableremoteplayback: {
    $: "disableRemotePlayback",
    AUDIO: 1,
    VIDEO: 1
  },
  preservespitch: {
    $: "preservesPitch",
    AUDIO: 1,
    VIDEO: 1
  },
  shadowrootclonable: {
    $: "shadowRootClonable",
    TEMPLATE: 1
  },
  shadowrootdelegatesfocus: {
    $: "shadowRootDelegatesFocus",
    TEMPLATE: 1
  },
  shadowrootserializable: {
    $: "shadowRootSerializable",
    TEMPLATE: 1
  },
  sharedstoragewritable: {
    $: "sharedStorageWritable",
    IFRAME: 1,
    IMG: 1
  }
});
function getPropAlias(prop, tagName) {
  const a = PropAliases[prop];
  return typeof a === "object" ? a[tagName] ? a["$"] : void 0 : a;
}
var DelegatedEvents = /* @__PURE__ */ new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
var SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};
var memo = (fn) => createMemo(() => fn());
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length, aEnd = a.length, bEnd = bLength, aStart = 0, bStart = 0, after = a[aEnd - 1].nextSibling, map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart, sequence = 1, t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}
var $$EVENTS = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  let disposer;
  createRoot((dispose2) => {
    disposer = dispose2;
    element === document ? code() : insert(element, code(), element.firstChild ? null : void 0, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template(html, isImportNode, isSVG, isMathML) {
  let node;
  const create = () => {
    const t = isMathML ? document.createElementNS("http://www.w3.org/1998/Math/MathML", "template") : document.createElement("template");
    t.innerHTML = html;
    return isSVG ? t.content.firstChild.firstChild : isMathML ? t.firstChild : t.content.firstChild;
  };
  const fn = isImportNode ? () => untrack(() => document.importNode(node || (node = create()), true)) : () => (node || (node = create())).cloneNode(true);
  fn.cloneNode = fn;
  return fn;
}
function delegateEvents(eventNames, document2 = window.document) {
  const e = document2[$$EVENTS] || (document2[$$EVENTS] = /* @__PURE__ */ new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document2.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute(name);
  else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttributeNS(namespace, name);
  else node.setAttributeNS(namespace, name, value);
}
function setBoolAttribute(node, name, value) {
  if (isHydrating(node)) return;
  value ? node.setAttribute(name, "") : node.removeAttribute(name);
}
function className(node, value) {
  if (isHydrating(node)) return;
  if (value == null) node.removeAttribute("class");
  else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = (e) => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler, typeof handler !== "function" && handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}), prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i], classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = void 0);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function setStyleProperty(node, name, value) {
  value != null ? node.style.setProperty(name, value) : node.style.removeProperty(name);
}
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(() => prevProps.children = insertExpression(node, props.children, prevProps.children));
  }
  createRenderEffect(() => typeof props.ref === "function" && use(props.ref, node));
  createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression(parent, accessor, initial, marker);
  createRenderEffect((current) => insertExpression(parent, accessor(), current, marker), initial);
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef, props);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef, props);
  }
}
function isHydrating(node) {
  return !!sharedConfig.context && !sharedConfig.done && (!node || node.isConnected);
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++) node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef, props) {
  let isCE, isProp, isChildProp, propAlias, forceProp;
  if (prop === "style") return style(node, value, prev);
  if (prop === "classList") return classList(node, value, prev);
  if (value === prev) return prev;
  if (prop === "ref") {
    if (!skipRef) value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev, typeof prev !== "function" && prev);
    value && node.addEventListener(e, value, typeof value !== "function" && value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if (prop.slice(0, 5) === "attr:") {
    setAttribute(node, prop.slice(5), value);
  } else if (prop.slice(0, 5) === "bool:") {
    setBoolAttribute(node, prop.slice(5), value);
  } else if ((forceProp = prop.slice(0, 5) === "prop:") || (isChildProp = ChildProperties.has(prop)) || !isSVG && ((propAlias = getPropAlias(prop, node.tagName)) || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-") || "is" in props)) {
    if (forceProp) {
      prop = prop.slice(5);
      isProp = true;
    } else if (isHydrating(node)) return value;
    if (prop === "class" || prop === "className") className(node, value);
    else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;
    else node[propAlias || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);
    else setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  if (sharedConfig.registry && sharedConfig.events) {
    if (sharedConfig.events.find(([el, ev]) => ev === e)) return;
  }
  let node = e.target;
  const key = `$$${e.type}`;
  const oriTarget = e.target;
  const oriCurrentTarget = e.currentTarget;
  const retarget = (value) => Object.defineProperty(e, "target", {
    configurable: true,
    value
  });
  const handleNode = () => {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== void 0 ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node.host && typeof node.host !== "string" && !node.host._$host && node.contains(e.target) && retarget(node.host);
    return true;
  };
  const walkUpTree = () => {
    while (handleNode() && (node = node._$host || node.parentNode || node.host)) ;
  };
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = _$HY.done = true;
  if (e.composedPath) {
    const path = e.composedPath();
    retarget(path[0]);
    for (let i = 0; i < path.length - 2; i++) {
      node = path[i];
      if (!handleNode()) break;
      if (node._$host) {
        node = node._$host;
        walkUpTree();
        break;
      }
      if (node.parentNode === oriCurrentTarget) {
        break;
      }
    }
  } else walkUpTree();
  retarget(oriTarget);
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  const hydrating = isHydrating(parent);
  if (hydrating) {
    !current && (current = [...parent.childNodes]);
    let cleaned = [];
    for (let i = 0; i < current.length; i++) {
      const node = current[i];
      if (node.nodeType === 8 && node.data.slice(0, 2) === "!$") node.remove();
      else cleaned.push(node);
    }
    current = cleaned;
  }
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value, multi = marker !== void 0;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (hydrating) return current;
    if (t === "number") {
      value = value.toString();
      if (value === current) return current;
    }
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data !== value && (node.data = value);
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (hydrating) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (hydrating) {
      if (!array.length) return current;
      if (marker === void 0) return current = [...parent.childNodes];
      let node = array[0];
      if (node.parentNode !== parent) return current;
      const nodes = [node];
      while ((node = node.nextSibling) !== marker) nodes.push(node);
      return current = nodes;
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value.nodeType) {
    if (hydrating && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else ;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i], prev = current && current[normalized.length], t;
    if (item == null || item === true || item === false) ;
    else if ((t = typeof item) === "object" && item.nodeType) {
      normalized.push(item);
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if (t === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) normalized.push(prev);
      else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);
        else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}
var voidFn = () => void 0;
var RequestContext = Symbol();
var isServer = false;

// node_modules/@solidjs/router/dist/index.js
function createBeforeLeave() {
  let listeners = /* @__PURE__ */ new Set();
  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
  let ignore = false;
  function confirm(to, options) {
    if (ignore) return !(ignore = false);
    const e = {
      to,
      options,
      defaultPrevented: false,
      preventDefault: () => e.defaultPrevented = true
    };
    for (const l of listeners) l.listener({
      ...e,
      from: l.location,
      retry: (force) => {
        force && (ignore = true);
        l.navigate(to, {
          ...options,
          resolve: false
        });
      }
    });
    return !e.defaultPrevented;
  }
  return {
    subscribe,
    confirm
  };
}
var depth;
function saveCurrentDepth() {
  if (!window.history.state || window.history.state._depth == null) {
    window.history.replaceState({
      ...window.history.state,
      _depth: window.history.length - 1
    }, "");
  }
  depth = window.history.state._depth;
}
if (!isServer) {
  saveCurrentDepth();
}
function keepDepth(state) {
  return {
    ...state,
    _depth: window.history.state && window.history.state._depth
  };
}
function notifyIfNotBlocked(notify, block) {
  let ignore = false;
  return () => {
    const prevDepth = depth;
    saveCurrentDepth();
    const delta = prevDepth == null ? null : depth - prevDepth;
    if (ignore) {
      ignore = false;
      return;
    }
    if (delta && block(delta)) {
      ignore = true;
      window.history.go(-delta);
    } else {
      notify();
    }
  };
}
var hasSchemeRegex = /^(?:[a-z0-9]+:)?\/\//i;
var trimPathRegex = /^\/+|(\/)\/+$/g;
var mockBase = "http://sr";
function normalizePath(path, omitSlash = false) {
  const s = path.replace(trimPathRegex, "$1");
  return s ? omitSlash || /^[?#]/.test(s) ? s : "/" + s : "";
}
function resolvePath(base, path, from) {
  if (hasSchemeRegex.test(path)) {
    return void 0;
  }
  const basePath = normalizePath(base);
  const fromPath = from && normalizePath(from);
  let result = "";
  if (!fromPath || path.startsWith("/")) {
    result = basePath;
  } else if (fromPath.toLowerCase().indexOf(basePath.toLowerCase()) !== 0) {
    result = basePath + fromPath;
  } else {
    result = fromPath;
  }
  return (result || "/") + normalizePath(path, !result);
}
function invariant(value, message) {
  if (value == null) {
    throw new Error(message);
  }
  return value;
}
function joinPaths(from, to) {
  return normalizePath(from).replace(/\/*(\*.*)?$/g, "") + normalizePath(to);
}
function extractSearchParams(url) {
  const params = {};
  url.searchParams.forEach((value, key) => {
    if (key in params) {
      if (Array.isArray(params[key])) params[key].push(value);
      else params[key] = [params[key], value];
    } else params[key] = value;
  });
  return params;
}
function createMatcher(path, partial, matchFilters) {
  const [pattern, splat] = path.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  const len = segments.length;
  return (location2) => {
    const locSegments = location2.split("/").filter(Boolean);
    const lenDiff = locSegments.length - len;
    if (lenDiff < 0 || lenDiff > 0 && splat === void 0 && !partial) {
      return null;
    }
    const match = {
      path: len ? "" : "/",
      params: {}
    };
    const matchFilter = (s) => matchFilters === void 0 ? void 0 : matchFilters[s];
    for (let i = 0; i < len; i++) {
      const segment = segments[i];
      const dynamic = segment[0] === ":";
      const locSegment = dynamic ? locSegments[i] : locSegments[i].toLowerCase();
      const key = dynamic ? segment.slice(1) : segment.toLowerCase();
      if (dynamic && matchSegment(locSegment, matchFilter(key))) {
        match.params[key] = locSegment;
      } else if (dynamic || !matchSegment(locSegment, key)) {
        return null;
      }
      match.path += `/${locSegment}`;
    }
    if (splat) {
      const remainder = lenDiff ? locSegments.slice(-lenDiff).join("/") : "";
      if (matchSegment(remainder, matchFilter(splat))) {
        match.params[splat] = remainder;
      } else {
        return null;
      }
    }
    return match;
  };
}
function matchSegment(input, filter) {
  const isEqual = (s) => s === input;
  if (filter === void 0) {
    return true;
  } else if (typeof filter === "string") {
    return isEqual(filter);
  } else if (typeof filter === "function") {
    return filter(input);
  } else if (Array.isArray(filter)) {
    return filter.some(isEqual);
  } else if (filter instanceof RegExp) {
    return filter.test(input);
  }
  return false;
}
function scoreRoute(route) {
  const [pattern, splat] = route.pattern.split("/*", 2);
  const segments = pattern.split("/").filter(Boolean);
  return segments.reduce((score, segment) => score + (segment.startsWith(":") ? 2 : 3), segments.length - (splat === void 0 ? 0 : 1));
}
function createMemoObject(fn) {
  const map = /* @__PURE__ */ new Map();
  const owner = getOwner();
  return new Proxy({}, {
    get(_, property) {
      if (!map.has(property)) {
        runWithOwner(owner, () => map.set(property, createMemo(() => fn()[property])));
      }
      return map.get(property)();
    },
    getOwnPropertyDescriptor() {
      return {
        enumerable: true,
        configurable: true
      };
    },
    ownKeys() {
      return Reflect.ownKeys(fn());
    }
  });
}
function expandOptionals(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match) return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map((p) => p + expansion)], []);
}
var MAX_REDIRECTS = 100;
var RouterContextObj = createContext();
var RouteContextObj = createContext();
var useRouter = () => invariant(useContext(RouterContextObj), "<A> and 'use' router primitives can be only used inside a Route.");
var useRoute = () => useContext(RouteContextObj) || useRouter().base;
var useResolvedPath = (path) => {
  const route = useRoute();
  return createMemo(() => route.resolvePath(path()));
};
var useHref = (to) => {
  const router = useRouter();
  return createMemo(() => {
    const to_ = to();
    return to_ !== void 0 ? router.renderPath(to_) : to_;
  });
};
var useNavigate = () => useRouter().navigatorFactory();
var useLocation = () => useRouter().location;
var useParams = () => useRouter().params;
function createRoutes(routeDef, base = "") {
  const {
    component,
    preload,
    load,
    children: children2,
    info
  } = routeDef;
  const isLeaf = !children2 || Array.isArray(children2) && !children2.length;
  const shared = {
    key: routeDef,
    component,
    preload: preload || load,
    info
  };
  return asArray(routeDef.path).reduce((acc, originalPath) => {
    for (const expandedPath of expandOptionals(originalPath)) {
      const path = joinPaths(base, expandedPath);
      let pattern = isLeaf ? path : path.split("/*", 1)[0];
      pattern = pattern.split("/").map((s) => {
        return s.startsWith(":") || s.startsWith("*") ? s : encodeURIComponent(s);
      }).join("/");
      acc.push({
        ...shared,
        originalPath,
        pattern,
        matcher: createMatcher(pattern, !isLeaf, routeDef.matchFilters)
      });
    }
    return acc;
  }, []);
}
function createBranch(routes, index = 0) {
  return {
    routes,
    score: scoreRoute(routes[routes.length - 1]) * 1e4 - index,
    matcher(location2) {
      const matches = [];
      for (let i = routes.length - 1; i >= 0; i--) {
        const route = routes[i];
        const match = route.matcher(location2);
        if (!match) {
          return null;
        }
        matches.unshift({
          ...match,
          route
        });
      }
      return matches;
    }
  };
}
function asArray(value) {
  return Array.isArray(value) ? value : [value];
}
function createBranches(routeDef, base = "", stack = [], branches = []) {
  const routeDefs = asArray(routeDef);
  for (let i = 0, len = routeDefs.length; i < len; i++) {
    const def = routeDefs[i];
    if (def && typeof def === "object") {
      if (!def.hasOwnProperty("path")) def.path = "";
      const routes = createRoutes(def, base);
      for (const route of routes) {
        stack.push(route);
        const isEmptyArray = Array.isArray(def.children) && def.children.length === 0;
        if (def.children && !isEmptyArray) {
          createBranches(def.children, route.pattern, stack, branches);
        } else {
          const branch = createBranch([...stack], branches.length);
          branches.push(branch);
        }
        stack.pop();
      }
    }
  }
  return stack.length ? branches : branches.sort((a, b) => b.score - a.score);
}
function getRouteMatches(branches, location2) {
  for (let i = 0, len = branches.length; i < len; i++) {
    const match = branches[i].matcher(location2);
    if (match) {
      return match;
    }
  }
  return [];
}
function createLocation(path, state, queryWrapper) {
  const origin = new URL(mockBase);
  const url = createMemo((prev) => {
    const path_ = path();
    try {
      return new URL(path_, origin);
    } catch (err) {
      console.error(`Invalid path ${path_}`);
      return prev;
    }
  }, origin, {
    equals: (a, b) => a.href === b.href
  });
  const pathname = createMemo(() => url().pathname);
  const search = createMemo(() => url().search, true);
  const hash = createMemo(() => url().hash);
  const key = () => "";
  const queryFn = on(search, () => extractSearchParams(url()));
  return {
    get pathname() {
      return pathname();
    },
    get search() {
      return search();
    },
    get hash() {
      return hash();
    },
    get state() {
      return state();
    },
    get key() {
      return key();
    },
    query: queryWrapper ? queryWrapper(queryFn) : createMemoObject(queryFn)
  };
}
var intent;
function getIntent() {
  return intent;
}
var inPreloadFn = false;
function getInPreloadFn() {
  return inPreloadFn;
}
function setInPreloadFn(value) {
  inPreloadFn = value;
}
function createRouterContext(integration, branches, getContext, options = {}) {
  const {
    signal: [source, setSource],
    utils = {}
  } = integration;
  const parsePath = utils.parsePath || ((p) => p);
  const renderPath = utils.renderPath || ((p) => p);
  const beforeLeave = utils.beforeLeave || createBeforeLeave();
  const basePath = resolvePath("", options.base || "");
  if (basePath === void 0) {
    throw new Error(`${basePath} is not a valid base path`);
  } else if (basePath && !source().value) {
    setSource({
      value: basePath,
      replace: true,
      scroll: false
    });
  }
  const [isRouting, setIsRouting] = createSignal(false);
  let lastTransitionTarget;
  const transition = (newIntent, newTarget) => {
    if (newTarget.value === reference() && newTarget.state === state()) return;
    if (lastTransitionTarget === void 0) setIsRouting(true);
    intent = newIntent;
    lastTransitionTarget = newTarget;
    startTransition(() => {
      if (lastTransitionTarget !== newTarget) return;
      setReference(lastTransitionTarget.value);
      setState(lastTransitionTarget.state);
      resetErrorBoundaries();
      if (!isServer) submissions[1]([]);
    }).finally(() => {
      if (lastTransitionTarget !== newTarget) return;
      batch(() => {
        intent = void 0;
        if (newIntent === "navigate") navigateEnd(lastTransitionTarget);
        setIsRouting(false);
        lastTransitionTarget = void 0;
      });
    });
  };
  const [reference, setReference] = createSignal(source().value);
  const [state, setState] = createSignal(source().state);
  const location2 = createLocation(reference, state, utils.queryWrapper);
  const referrers = [];
  const submissions = createSignal(isServer ? initFromFlash() : []);
  const matches = createMemo(() => {
    if (typeof options.transformUrl === "function") {
      return getRouteMatches(branches(), options.transformUrl(location2.pathname));
    }
    return getRouteMatches(branches(), location2.pathname);
  });
  const buildParams = () => {
    const m = matches();
    const params2 = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params2, m[i].params);
    }
    return params2;
  };
  const params = utils.paramsWrapper ? utils.paramsWrapper(buildParams, branches) : createMemoObject(buildParams);
  const baseRoute = {
    pattern: basePath,
    path: () => basePath,
    outlet: () => null,
    resolvePath(to) {
      return resolvePath(basePath, to);
    }
  };
  createRenderEffect(on(source, (source2) => transition("native", source2), {
    defer: true
  }));
  return {
    base: baseRoute,
    location: location2,
    params,
    isRouting,
    renderPath,
    parsePath,
    navigatorFactory,
    matches,
    beforeLeave,
    preloadRoute,
    singleFlight: options.singleFlight === void 0 ? true : options.singleFlight,
    submissions
  };
  function navigateFromRoute(route, to, options2) {
    untrack(() => {
      if (typeof to === "number") {
        if (!to) ;
        else if (utils.go) {
          utils.go(to);
        } else {
          console.warn("Router integration does not support relative routing");
        }
        return;
      }
      const queryOnly = !to || to[0] === "?";
      const {
        replace,
        resolve,
        scroll,
        state: nextState
      } = {
        replace: false,
        resolve: !queryOnly,
        scroll: true,
        ...options2
      };
      const resolvedTo = resolve ? route.resolvePath(to) : resolvePath(queryOnly && location2.pathname || "", to);
      if (resolvedTo === void 0) {
        throw new Error(`Path '${to}' is not a routable path`);
      } else if (referrers.length >= MAX_REDIRECTS) {
        throw new Error("Too many redirects");
      }
      const current = reference();
      if (resolvedTo !== current || nextState !== state()) {
        if (isServer) {
          const e = voidFn();
          e && (e.response = {
            status: 302,
            headers: new Headers({
              Location: resolvedTo
            })
          });
          setSource({
            value: resolvedTo,
            replace,
            scroll,
            state: nextState
          });
        } else if (beforeLeave.confirm(resolvedTo, options2)) {
          referrers.push({
            value: current,
            replace,
            scroll,
            state: state()
          });
          transition("navigate", {
            value: resolvedTo,
            state: nextState
          });
        }
      }
    });
  }
  function navigatorFactory(route) {
    route = route || useContext(RouteContextObj) || baseRoute;
    return (to, options2) => navigateFromRoute(route, to, options2);
  }
  function navigateEnd(next) {
    const first = referrers[0];
    if (first) {
      setSource({
        ...next,
        replace: first.replace,
        scroll: first.scroll
      });
      referrers.length = 0;
    }
  }
  function preloadRoute(url, preloadData) {
    const matches2 = getRouteMatches(branches(), url.pathname);
    const prevIntent = intent;
    intent = "preload";
    for (let match in matches2) {
      const {
        route,
        params: params2
      } = matches2[match];
      route.component && route.component.preload && route.component.preload();
      const {
        preload
      } = route;
      inPreloadFn = true;
      preloadData && preload && runWithOwner(getContext(), () => preload({
        params: params2,
        location: {
          pathname: url.pathname,
          search: url.search,
          hash: url.hash,
          query: extractSearchParams(url),
          state: null,
          key: ""
        },
        intent: "preload"
      }));
      inPreloadFn = false;
    }
    intent = prevIntent;
  }
  function initFromFlash() {
    const e = voidFn();
    return e && e.router && e.router.submission ? [e.router.submission] : [];
  }
}
function createRouteContext(router, parent, outlet, match) {
  const {
    base,
    location: location2,
    params
  } = router;
  const {
    pattern,
    component,
    preload
  } = match().route;
  const path = createMemo(() => match().path);
  component && component.preload && component.preload();
  inPreloadFn = true;
  const data = preload ? preload({
    params,
    location: location2,
    intent: intent || "initial"
  }) : void 0;
  inPreloadFn = false;
  const route = {
    parent,
    pattern,
    path,
    outlet: () => component ? createComponent(component, {
      params,
      location: location2,
      data,
      get children() {
        return outlet();
      }
    }) : outlet(),
    resolvePath(to) {
      return resolvePath(base.path(), to, path());
    }
  };
  return route;
}
var createRouterComponent = (router) => (props) => {
  const {
    base
  } = props;
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(routeDefs(), props.base || ""));
  let context;
  const routerState = createRouterContext(router, branches, () => context, {
    base,
    singleFlight: props.singleFlight,
    transformUrl: props.transformUrl
  });
  router.create && router.create(routerState);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return createComponent(Root, {
        routerState,
        get root() {
          return props.root;
        },
        get preload() {
          return props.rootPreload || props.rootLoad;
        },
        get children() {
          return [memo(() => (context = getOwner()) && null), createComponent(Routes, {
            routerState,
            get branches() {
              return branches();
            }
          })];
        }
      });
    }
  });
};
function Root(props) {
  const location2 = props.routerState.location;
  const params = props.routerState.params;
  const data = createMemo(() => props.preload && untrack(() => {
    setInPreloadFn(true);
    props.preload({
      params,
      location: location2,
      intent: getIntent() || "initial"
    });
    setInPreloadFn(false);
  }));
  return createComponent(Show, {
    get when() {
      return props.root;
    },
    keyed: true,
    get fallback() {
      return props.children;
    },
    children: (Root2) => createComponent(Root2, {
      params,
      location: location2,
      get data() {
        return data();
      },
      get children() {
        return props.children;
      }
    })
  });
}
function Routes(props) {
  if (isServer) {
    const e = voidFn();
    if (e && e.router && e.router.dataOnly) {
      dataOnly(e, props.routerState, props.branches);
      return;
    }
    e && ((e.router || (e.router = {})).matches || (e.router.matches = props.routerState.matches().map(({
      route,
      path,
      params
    }) => ({
      path: route.originalPath,
      pattern: route.pattern,
      match: path,
      params,
      info: route.info
    }))));
  }
  const disposers = [];
  let root;
  const routeStates = createMemo(on(props.routerState.matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot((dispose2) => {
          disposers[i] = dispose2;
          next[i] = createRouteContext(props.routerState, next[i - 1] || props.routerState.base, createOutlet(() => routeStates()[i + 1]), () => props.routerState.matches()[i]);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach((dispose2) => dispose2());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createOutlet(() => routeStates() && root)();
}
var createOutlet = (child) => {
  return () => createComponent(Show, {
    get when() {
      return child();
    },
    keyed: true,
    children: (child2) => createComponent(RouteContextObj.Provider, {
      value: child2,
      get children() {
        return child2.outlet();
      }
    })
  });
};
var Route = (props) => {
  const childRoutes = children(() => props.children);
  return mergeProps(props, {
    get children() {
      return childRoutes();
    }
  });
};
function dataOnly(event, routerState, branches) {
  const url = new URL(event.request.url);
  const prevMatches = getRouteMatches(branches, new URL(event.router.previousUrl || event.request.url).pathname);
  const matches = getRouteMatches(branches, url.pathname);
  for (let match = 0; match < matches.length; match++) {
    if (!prevMatches[match] || matches[match].route !== prevMatches[match].route) event.router.dataOnly = true;
    const {
      route,
      params
    } = matches[match];
    route.preload && route.preload({
      params,
      location: routerState.location,
      intent: "preload"
    });
  }
}
function intercept([value, setValue], get, set) {
  return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function createRouter(config) {
  let ignore = false;
  const wrap = (value) => typeof value === "string" ? {
    value
  } : value;
  const signal = intercept(createSignal(wrap(config.get()), {
    equals: (a, b) => a.value === b.value && a.state === b.state
  }), void 0, (next) => {
    !ignore && config.set(next);
    if (sharedConfig.registry && !sharedConfig.done) sharedConfig.done = true;
    return next;
  });
  config.init && onCleanup(config.init((value = config.get()) => {
    ignore = true;
    signal[1](wrap(value));
    ignore = false;
  }));
  return createRouterComponent({
    signal,
    create: config.create,
    utils: config.utils
  });
}
function bindEvent(target, type, handler) {
  target.addEventListener(type, handler);
  return () => target.removeEventListener(type, handler);
}
function scrollToHash(hash, fallbackTop) {
  const el = hash && document.getElementById(hash);
  if (el) {
    el.scrollIntoView();
  } else if (fallbackTop) {
    window.scrollTo(0, 0);
  }
}
function getPath(url) {
  const u = new URL(url);
  return u.pathname + u.search;
}
function StaticRouter(props) {
  let e;
  const obj = {
    value: props.url || (e = voidFn()) && getPath(e.request.url) || ""
  };
  return createRouterComponent({
    signal: [() => obj, (next) => Object.assign(obj, next)]
  })(props);
}
var LocationHeader = "Location";
var PRELOAD_TIMEOUT = 5e3;
var CACHE_TIMEOUT = 18e4;
var cacheMap = /* @__PURE__ */ new Map();
if (!isServer) {
  setInterval(() => {
    const now = Date.now();
    for (let [k, v] of cacheMap.entries()) {
      if (!v[3].count && now - v[0] > CACHE_TIMEOUT) {
        cacheMap.delete(k);
      }
    }
  }, 3e5);
}
function getCache() {
  if (!isServer) return cacheMap;
  const req = voidFn();
  if (!req) throw new Error("Cannot find cache context");
  return (req.router || (req.router = {})).cache || (req.router.cache = /* @__PURE__ */ new Map());
}
function cache(fn, name) {
  if (fn.GET) fn = fn.GET;
  const cachedFn = (...args) => {
    const cache2 = getCache();
    const intent2 = getIntent();
    const inPreloadFn2 = getInPreloadFn();
    const owner = getOwner();
    const navigate = owner ? useNavigate() : void 0;
    const now = Date.now();
    const key = name + hashKey(args);
    let cached = cache2.get(key);
    let tracking;
    if (isServer) {
      const e = voidFn();
      if (e) {
        const dataOnly2 = (e.router || (e.router = {})).dataOnly;
        if (dataOnly2) {
          const data = e && (e.router.data || (e.router.data = {}));
          if (data && key in data) return data[key];
          if (Array.isArray(dataOnly2) && !matchKey(key, dataOnly2)) {
            data[key] = void 0;
            return Promise.resolve();
          }
        }
      }
    }
    if (getListener() && !isServer) {
      tracking = true;
      onCleanup(() => cached[3].count--);
    }
    if (cached && cached[0] && (isServer || intent2 === "native" || cached[3].count || Date.now() - cached[0] < PRELOAD_TIMEOUT)) {
      if (tracking) {
        cached[3].count++;
        cached[3][0]();
      }
      if (cached[2] === "preload" && intent2 !== "preload") {
        cached[0] = now;
      }
      let res2 = cached[1];
      if (intent2 !== "preload") {
        res2 = "then" in cached[1] ? cached[1].then(handleResponse(false), handleResponse(true)) : handleResponse(false)(cached[1]);
        !isServer && intent2 === "navigate" && startTransition(() => cached[3][1](cached[0]));
      }
      inPreloadFn2 && "then" in res2 && res2.catch(() => {
      });
      return res2;
    }
    let res = !isServer && sharedConfig.context && sharedConfig.has(key) ? sharedConfig.load(key) : fn(...args);
    if (cached) {
      cached[0] = now;
      cached[1] = res;
      cached[2] = intent2;
      !isServer && intent2 === "navigate" && startTransition(() => cached[3][1](cached[0]));
    } else {
      cache2.set(key, cached = [now, res, intent2, createSignal(now)]);
      cached[3].count = 0;
    }
    if (tracking) {
      cached[3].count++;
      cached[3][0]();
    }
    if (isServer) {
      const e = voidFn();
      if (e && e.router.dataOnly) return e.router.data[key] = res;
    }
    if (intent2 !== "preload") {
      res = "then" in res ? res.then(handleResponse(false), handleResponse(true)) : handleResponse(false)(res);
    }
    inPreloadFn2 && "then" in res && res.catch(() => {
    });
    if (isServer && sharedConfig.context && sharedConfig.context.async && !sharedConfig.context.noHydrate) {
      const e = voidFn();
      (!e || !e.serverOnly) && sharedConfig.context.serialize(key, res);
    }
    return res;
    function handleResponse(error) {
      return async (v) => {
        if (v instanceof Response) {
          const url = v.headers.get(LocationHeader);
          if (url !== null) {
            if (navigate && url.startsWith("/")) startTransition(() => {
              navigate(url, {
                replace: true
              });
            });
            else if (!isServer) window.location.href = url;
            else if (isServer) {
              const e = voidFn();
              if (e) e.response = {
                status: 302,
                headers: new Headers({
                  Location: url
                })
              };
            }
            return;
          }
          if (v.customBody) v = await v.customBody();
        }
        if (error) throw v;
        return v;
      };
    }
  };
  cachedFn.keyFor = (...args) => name + hashKey(args);
  cachedFn.key = name;
  return cachedFn;
}
cache.set = (key, value) => {
  const cache2 = getCache();
  const now = Date.now();
  let cached = cache2.get(key);
  if (cached) {
    cached[0] = now;
    cached[1] = value;
    cached[2] = "preload";
  } else {
    cache2.set(key, cached = [now, value, , createSignal(now)]);
    cached[3].count = 0;
  }
};
cache.clear = () => getCache().clear();
function matchKey(key, keys) {
  for (let k of keys) {
    if (k && key.startsWith(k)) return true;
  }
  return false;
}
function hashKey(args) {
  return JSON.stringify(args, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
    result[key] = val[key];
    return result;
  }, {}) : val);
}
function isPlainObject(obj) {
  let proto;
  return obj != null && typeof obj === "object" && (!(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype);
}
var actions = /* @__PURE__ */ new Map();
function setupNativeEvents(preload = true, explicitLinks = false, actionBase = "/_server", transformUrl) {
  return (router) => {
    const basePath = router.base.path();
    const navigateFromRoute = router.navigatorFactory(router.base);
    let preloadTimeout;
    let lastElement;
    function isSvg(el) {
      return el.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function handleAnchor(evt) {
      if (evt.defaultPrevented || evt.button !== 0 || evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey) return;
      const a = evt.composedPath().find((el) => el instanceof Node && el.nodeName.toUpperCase() === "A");
      if (!a || explicitLinks && !a.hasAttribute("link")) return;
      const svg = isSvg(a);
      const href = svg ? a.href.baseVal : a.href;
      const target = svg ? a.target.baseVal : a.target;
      if (target || !href && !a.hasAttribute("state")) return;
      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      if (a.hasAttribute("download") || rel && rel.includes("external")) return;
      const url = svg ? new URL(href, document.baseURI) : new URL(href);
      if (url.origin !== window.location.origin || basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase())) return;
      return [a, url];
    }
    function handleAnchorClick(evt) {
      const res = handleAnchor(evt);
      if (!res) return;
      const [a, url] = res;
      const to = router.parsePath(url.pathname + url.search + url.hash);
      const state = a.getAttribute("state");
      evt.preventDefault();
      navigateFromRoute(to, {
        resolve: false,
        replace: a.hasAttribute("replace"),
        scroll: !a.hasAttribute("noscroll"),
        state: state ? JSON.parse(state) : void 0
      });
    }
    function handleAnchorPreload(evt) {
      const res = handleAnchor(evt);
      if (!res) return;
      const [a, url] = res;
      transformUrl && (url.pathname = transformUrl(url.pathname));
      router.preloadRoute(url, a.getAttribute("preload") !== "false");
    }
    function handleAnchorMove(evt) {
      clearTimeout(preloadTimeout);
      const res = handleAnchor(evt);
      if (!res) return lastElement = null;
      const [a, url] = res;
      if (lastElement === a) return;
      transformUrl && (url.pathname = transformUrl(url.pathname));
      preloadTimeout = setTimeout(() => {
        router.preloadRoute(url, a.getAttribute("preload") !== "false");
        lastElement = a;
      }, 20);
    }
    function handleFormSubmit(evt) {
      if (evt.defaultPrevented) return;
      let actionRef = evt.submitter && evt.submitter.hasAttribute("formaction") ? evt.submitter.getAttribute("formaction") : evt.target.getAttribute("action");
      if (!actionRef) return;
      if (!actionRef.startsWith("https://action/")) {
        const url = new URL(actionRef, mockBase);
        actionRef = router.parsePath(url.pathname + url.search);
        if (!actionRef.startsWith(actionBase)) return;
      }
      if (evt.target.method.toUpperCase() !== "POST") throw new Error("Only POST forms are supported for Actions");
      const handler = actions.get(actionRef);
      if (handler) {
        evt.preventDefault();
        const data = new FormData(evt.target, evt.submitter);
        handler.call({
          r: router,
          f: evt.target
        }, evt.target.enctype === "multipart/form-data" ? data : new URLSearchParams(data));
      }
    }
    delegateEvents(["click", "submit"]);
    document.addEventListener("click", handleAnchorClick);
    if (preload) {
      document.addEventListener("mousemove", handleAnchorMove, {
        passive: true
      });
      document.addEventListener("focusin", handleAnchorPreload, {
        passive: true
      });
      document.addEventListener("touchstart", handleAnchorPreload, {
        passive: true
      });
    }
    document.addEventListener("submit", handleFormSubmit);
    onCleanup(() => {
      document.removeEventListener("click", handleAnchorClick);
      if (preload) {
        document.removeEventListener("mousemove", handleAnchorMove);
        document.removeEventListener("focusin", handleAnchorPreload);
        document.removeEventListener("touchstart", handleAnchorPreload);
      }
      document.removeEventListener("submit", handleFormSubmit);
    });
  };
}
function Router(props) {
  if (isServer) return StaticRouter(props);
  const getSource = () => {
    const url = window.location.pathname.replace(/^\/+/, "/") + window.location.search;
    const state = window.history.state && window.history.state._depth && Object.keys(window.history.state).length === 1 ? void 0 : window.history.state;
    return {
      value: url + window.location.hash,
      state
    };
  };
  const beforeLeave = createBeforeLeave();
  return createRouter({
    get: getSource,
    set({
      value,
      replace,
      scroll,
      state
    }) {
      if (replace) {
        window.history.replaceState(keepDepth(state), "", value);
      } else {
        window.history.pushState(state, "", value);
      }
      scrollToHash(decodeURIComponent(window.location.hash.slice(1)), scroll);
      saveCurrentDepth();
    },
    init: (notify) => bindEvent(window, "popstate", notifyIfNotBlocked(notify, (delta) => {
      if (delta && delta < 0) {
        return !beforeLeave.confirm(delta);
      } else {
        const s = getSource();
        return !beforeLeave.confirm(s.value, {
          state: s.state
        });
      }
    })),
    create: setupNativeEvents(props.preload, props.explicitLinks, props.actionBase, props.transformUrl),
    utils: {
      go: (delta) => window.history.go(delta),
      beforeLeave
    }
  })(props);
}
var _tmpl$ = /* @__PURE__ */ template(`<a>`);
function A(props) {
  props = mergeProps({
    inactiveClass: "inactive",
    activeClass: "active"
  }, props);
  const [, rest] = splitProps(props, ["href", "state", "class", "activeClass", "inactiveClass", "end"]);
  const to = useResolvedPath(() => props.href);
  const href = useHref(to);
  const location2 = useLocation();
  const isActive = createMemo(() => {
    const to_ = to();
    if (to_ === void 0) return [false, false];
    const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
    const loc = decodeURI(normalizePath(location2.pathname).toLowerCase());
    return [props.end ? path === loc : loc.startsWith(path + "/") || loc === path, path === loc];
  });
  return (() => {
    var _el$ = _tmpl$();
    spread(_el$, mergeProps(rest, {
      get href() {
        return href() || props.href;
      },
      get state() {
        return JSON.stringify(props.state);
      },
      get classList() {
        return {
          ...props.class && {
            [props.class]: true
          },
          [props.inactiveClass]: !isActive()[0],
          [props.activeClass]: isActive()[0],
          ...rest.classList
        };
      },
      "link": "",
      get ["aria-current"]() {
        return isActive()[1] ? "page" : void 0;
      }
    }), false, false);
    return _el$;
  })();
}
function createAsync(fn, options) {
  let resource;
  let prev = () => !resource || resource.state === "unresolved" ? void 0 : resource.latest;
  [resource] = createResource(() => subFetch(fn, untrack(prev)), (v) => v, options);
  const resultAccessor = () => resource();
  Object.defineProperty(resultAccessor, "latest", {
    get() {
      return resource.latest;
    }
  });
  return resultAccessor;
}
var MockPromise = class _MockPromise {
  static all() {
    return new _MockPromise();
  }
  static allSettled() {
    return new _MockPromise();
  }
  static any() {
    return new _MockPromise();
  }
  static race() {
    return new _MockPromise();
  }
  static reject() {
    return new _MockPromise();
  }
  static resolve() {
    return new _MockPromise();
  }
  catch() {
    return new _MockPromise();
  }
  then() {
    return new _MockPromise();
  }
  finally() {
    return new _MockPromise();
  }
};
function subFetch(fn, prev) {
  if (isServer || !sharedConfig.context) return fn(prev);
  const ogFetch = fetch;
  const ogPromise = Promise;
  try {
    window.fetch = () => new MockPromise();
    Promise = MockPromise;
    return fn(prev);
  } finally {
    window.fetch = ogFetch;
    Promise = ogPromise;
  }
}

// src/routes/index.tsx
var _tmpl$2 = /* @__PURE__ */ template(`<div class=danger-banner><span style=fontSize:18>\u26A0\uFE0F</span><div style=flex:1><strong>\u5F53\u524D\u6709 <!> \u6761\u5F02\u5E38\u6570\u636E\u5F85\u5904\u7406\uFF1A</strong><div style=marginTop:4;fontSize:12.5></div></div><button class="btn btn-xs btn-warning">\u67E5\u770B\u89C4\u5219\u5E93`);
var _tmpl$22 = /* @__PURE__ */ template(`<div class=list-actions-bar><span class=count>\u5DF2\u9009 <!> \u9879</span><button class="btn btn-xs btn-success">\u6279\u91CF\u6807\u8BB0\u5DF2\u5BA1\u6BD5</button><button class="btn btn-xs btn-warning">\u6279\u91CF\u8BBE\u4E3A\u5BA1\u8BFB\u4E2D</button><button class="btn btn-xs btn-default">\u6279\u91CF\u5BFC\u51FA\u6458\u8981</button><button class="btn btn-xs btn-danger">\u53D6\u6D88\u9009\u62E9`);
var _tmpl$3 = /* @__PURE__ */ template(`<div class=modal-backdrop><div class=modal><div class=modal-head><h3>\u{1F4DD} \u65B0\u5EFA\u5BA1\u8BFB\u9879\u76EE</h3><button class="btn btn-xs btn-default">\u2715</button></div><div class=modal-body><div class=form-row><label>\u9879\u76EE\u540D\u79F0 *</label><input class=form-input placeholder=\u5982\uFF1A\u300A\u53F2\u8BB0\xB7\u4E94\u5E1D\u672C\u7EAA\u300B\u6B66\u82F1\u6BBF\u672C\u6821\u8BFB></div><div style="display:grid;gridTemplateColumns:1fr 1fr;gap:14px"><div class=form-row><label>\u5178\u7C4D\u540D</label><input class=form-input placeholder=\u5982\uFF1A\u4E94\u5E1D\u672C\u7EAA></div><div class=form-row><label>\u4F5C\u8005</label><input class=form-input placeholder=\u5982\uFF1A\u53F8\u9A6C\u8FC1></div><div class=form-row><label>\u5E95\u672C\u671D\u4EE3 / \u7248\u672C</label><input class=form-input placeholder=\u5982\uFF1A\u6E05\u4E7E\u9686\u6B66\u82F1\u6BBF\u672C></div><div class=form-row><label>\u6E90\u671D\u4EE3</label><select class=form-select><option value>\u8BF7\u9009\u62E9\u2026</option></select></div></div><div class=form-row><label>\u9879\u76EE\u63CF\u8FF0</label><textarea class=form-textarea placeholder=\u7B80\u8FF0\u5BA1\u8BFB\u8981\u70B9\u3001\u5173\u6CE8\u7684\u671D\u4EE3\u89C4\u5219\u3001\u4F7F\u7528\u7684\u5BF9\u6821\u672C\u2026></textarea></div><div class=form-row><label>\u539F\u6587\u5185\u5BB9 *</label><textarea class=form-textarea placeholder=\u7C98\u8D34\u5F85\u5BA1\u8BFB\u7684\u53E4\u7C4D\u539F\u6587\u5185\u5BB9\u2026 style=minHeight:120></textarea></div><div style="display:grid;gridTemplateColumns:1fr 1fr;gap:14px"><div class=form-row><label>\u6307\u6D3E\u7ED9</label><select class=form-select></select></div><div class=form-row><label>\u4F18\u5148\u7EA7</label><select class=form-select><option value=high>\u9AD8\u4F18</option><option value=medium>\u4E2D\u4F18</option><option value=low>\u4F4E\u4F18</option></select></div></div></div><div class=modal-foot><button class="btn btn-default">\u53D6\u6D88</button><button class="btn btn-primary">\u521B\u5EFA\u5E76\u5F00\u59CB\u5BA1\u8BFB`);
var _tmpl$4 = /* @__PURE__ */ template(`<div><div class=page-header><div class=page-title-block><h2>\u{1F4DA} \u9879\u76EE\u53F0\u8D26</h2><p class=subtitle>\u7BA1\u7406\u6240\u6709\u53E4\u7C4D\u907F\u8BB3\u5B57\u5BA1\u8BFB\u9879\u76EE\uFF0C\u6309\u671D\u4EE3\u3001\u6279\u6B21\u3001\u8FDB\u5EA6\u7EDF\u4E00\u67E5\u770B\u4E0E\u8C03\u5EA6</p></div><div class=page-actions><button class="btn btn-default">\u{1F4E5} \u6279\u91CF\u5BFC\u5165</button><button class="btn btn-primary">\uFF0B \u65B0\u5EFA\u5BA1\u8BFB\u9879\u76EE</button></div></div><div class=stats-grid><div class="stat-card s-cyan"><div class=stat-label>\u9879\u76EE\u603B\u6570</div><div class=stat-value></div><div class=stat-hint>\u542B\u5DF2\u5F52\u6863 </div></div><div class="stat-card s-amber"><div class=stat-label>\u6B63\u5728\u5BA1\u8BFB</div><div class=stat-value></div><div class=stat-hint>\u5F85\u5904\u7406\u7591\u4F3C\u5B57 </div></div><div class="stat-card s-purple"><div class=stat-label>\u671D\u4EE3\u89C4\u5219\u8986\u76D6</div><div class=stat-value></div><div class=stat-hint>\u5171 25 \u6761\u7687\u5E1D\u907F\u8BB3\u89C4\u5219</div></div><div class="stat-card s-rose"><div class=stat-label>\u672A\u89E3\u51B3\u5F02\u5E38</div><div class=stat-value></div><div class=stat-hint>\u9700\u4EBA\u5DE5\u4ECB\u5165\u7684\u51B2\u7A81/\u4E0D\u4E00\u81F4</div></div><div class="stat-card s-emerald"><div class=stat-label>\u672C\u6708\u5B8C\u6210</div><div class=stat-value></div><div class=stat-hint>2025\u5E743\u6708\u5BA1\u6BD5\u9879\u76EE\u6570</div></div></div><div class=filter-panel><div class=filter-row><div class="filter-group full-width"><label class=filter-label>\u5173\u952E\u5B57\u68C0\u7D22\uFF08\u9879\u76EE\u540D / \u5178\u7C4D\u540D / \u4F5C\u8005 / \u63CF\u8FF0 / \u6807\u7B7E\uFF09</label><input type=text class=filter-input placeholder=\u5982\uFF1A\u53F2\u8BB0\u3001\u8D44\u6CBB\u901A\u9274\u3001\u6E05\u4EE3\u3001\u591A\u5C42\u907F\u8BB3\u3001\u5F20\u6821\u52D8\u2026></div></div><div class=filter-row><div class=filter-group><label class=filter-label>\u9879\u76EE\u72B6\u6001</label><div class=filter-tags-row></div></div><div class=filter-group><label class=filter-label>\u671D\u4EE3</label><div class=filter-tags-row></div></div><div class=filter-group><label class=filter-label>\u4F18\u5148\u7EA7</label><div class=filter-tags-row></div></div><div class=filter-group><label class=filter-label>\u6307\u6D3E\u4EBA</label><div class=filter-tags-row></div></div><div class=filter-group><label class=filter-label>\u5F02\u5E38\u72B6\u6001</label><div class=filter-tags-row><span>\u6709\u5F02\u5E38</span><span>\u65E0\u5F02\u5E38</span></div></div></div><div class=filter-row><div class=filter-group><label class=filter-label>\u5FEB\u6377\u6807\u7B7E</label><div class=filter-tags-row></div></div><div class=filter-actions><button class="btn btn-sm btn-default">\u6E05\u7A7A\u7B5B\u9009</button><button class="btn btn-sm btn-primary">\u5E94\u7528\uFF08\u5171 <!> \u6761\uFF09</button></div></div></div><div class=panel><div class=panel-header><h3 class=panel-title>\u5BA1\u8BFB\u9879\u76EE\u5217\u8868 <span class=panel-meta>\u5171 <!> \u4E2A\u9879\u76EE</span></h3><div class=gap-small><select class=filter-input style="padding:4px 8px;fontSize:12"><option>\u6309\u66F4\u65B0\u65F6\u95F4\u5012\u5E8F</option><option>\u6309\u521B\u5EFA\u65F6\u95F4\u5012\u5E8F</option><option>\u6309\u4F18\u5148\u7EA7\u6392\u5E8F</option><option>\u6309\u8FDB\u5EA6\u6392\u5E8F</option></select></div></div><div class=table-wrap><table class=data-table><thead><tr><th class=check-col><input type=checkbox></th><th style=width:28%>\u9879\u76EE / \u5178\u7C4D</th><th style=width:10%>\u671D\u4EE3 / \u5E95\u672C</th><th style=width:9%>\u72B6\u6001</th><th style=width:20%>\u5BA1\u8BFB\u8FDB\u5EA6</th><th class=num-col style=width:9%>\u7591\u4F3C / \u5F85\u5BA1</th><th style=width:9%>\u8D1F\u8D23\u4EBA</th><th class=action-col style=width:14%>\u64CD\u4F5C</th></tr></thead><tbody></tbody></table></div><div class=pagination><button class=page-btn>\u4E0A\u4E00\u9875</button><button class=page-btn>\u4E0B\u4E00\u9875</button><span class="muted small"style=marginLeft:10>\u5171 <!> \u9879 \xB7 6 \u9879/\u9875`);
var _tmpl$5 = /* @__PURE__ */ template(`<span style=display:inline-block;marginRight:16>`);
var _tmpl$6 = /* @__PURE__ */ template(`<span>`);
var _tmpl$7 = /* @__PURE__ */ template(`<span># `);
var _tmpl$8 = /* @__PURE__ */ template(`<tr><td colspan=8 class=empty-state>\u6682\u65E0\u7B26\u5408\u6761\u4EF6\u7684\u9879\u76EE`);
var _tmpl$9 = /* @__PURE__ */ template(`<span style=color:#dc2626>\u26A0 `);
var _tmpl$0 = /* @__PURE__ */ template(`<button class="btn btn-xs btn-primary">\u5BA1\u8BFB`);
var _tmpl$1 = /* @__PURE__ */ template(`<tr><td class=check-col><input type=checkbox></td><td><div class=text-cell-title></div><div class=text-cell-meta><span style="fontFamily:ui-monospace, monospace"></span> \xB7 <!>\u300A<!>\u300B</div><div class=chips-flex></div></td><td><div style=fontWeight:500></div><div class="small muted">\u6E90\uFF1A</div><div style=marginTop:4><span></span></div></td><td><span></span><div class="small muted"style=marginTop:6>\u66F4\u65B0\uFF1A</div></td><td><div style=display:flex;justifyContent:space-between;fontSize:12;marginBottom:4><span>\u5B8C\u6210 <!>%</span><span class=muted>\u2714 <!> \xB7 \u2718 <!> \xB7 \u2731 </span></div><div class=progress-wrap><div></div></div></td><td class=num-col><div style=fontSize:16;fontWeight:700;color:#111827></div><div class=small><span style=color:#0ea5e9>\u5F85\u5BA1 </span></div></td><td><div></div><div class="small muted">\u521B\u5EFA\uFF1A</div></td><td class=action-col><button class="btn btn-xs btn-default">\u7248\u672C</button><button class="btn btn-xs btn-default">\u6458\u8981`);
var _tmpl$10 = /* @__PURE__ */ template(`<span class=tag-chip>`);
var _tmpl$11 = /* @__PURE__ */ template(`<button>`);
var _tmpl$12 = /* @__PURE__ */ template(`<option>`);
var STATUS_LABEL = {
  draft: "\u8349\u7A3F",
  in_review: "\u5BA1\u8BFB\u4E2D",
  reviewed: "\u5DF2\u5BA1\u6BD5",
  exported: "\u5DF2\u5BFC\u51FA",
  archived: "\u5DF2\u5F52\u6863"
};
var PRIORITY_LABEL = {
  high: "\u9AD8\u4F18",
  medium: "\u4E2D\u4F18",
  low: "\u4F4E\u4F18"
};
function ProjectLedger() {
  const nav = useNavigate();
  const stats = createAsync(() => fetch("/api/stats").then((r) => r.json()));
  const allAnomalies = createAsync(() => fetch("/api/anomalies").then((r) => r.json()));
  const [filters, setFilters] = createSignal({
    search: "",
    status: [],
    dynasty: [],
    priority: [],
    assignee: [],
    hasAnomaly: null,
    tags: []
  });
  const [projects, setProjects] = createSignal([]);
  const [selected, setSelected] = createSignal(/* @__PURE__ */ new Set());
  const [showNewModal, setShowNewModal] = createSignal(false);
  const [page, setPage] = createSignal(1);
  const pageSize = 6;
  createEffect(() => {
    const body = {
      op: "filter",
      ...filters()
    };
    fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    }).then((r) => r.json()).then((list) => {
      setProjects(list);
      setPage(1);
    });
  }, [filters]);
  const archivedCount = () => (projects() ?? []).filter((p) => p.status === "archived").length;
  const completedMonth = () => {
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear(), month = now.getMonth();
    return (projects() ?? []).filter((p) => {
      if (p.status !== "reviewed" && p.status !== "exported") return false;
      const d = new Date(p.updatedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  };
  const toggleSelect = (id) => {
    const s = new Set(selected());
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };
  const toggleAll = () => {
    const s = new Set(selected());
    if (s.size === currentPage().length) {
      currentPage().forEach((p) => s.delete(p.id));
    } else {
      currentPage().forEach((p) => s.add(p.id));
    }
    setSelected(s);
  };
  const dynastyList = ["\u897F\u6C49", "\u4E1C\u6C49", "\u897F\u664B", "\u5510", "\u5B8B", "\u6E05"];
  const statusList = ["draft", "in_review", "reviewed", "exported", "archived"];
  const priorityList = ["high", "medium", "low"];
  const assigneeList = ["\u5F20\u6821\u52D8", "\u674E\u7814\u7A76\u5458", "\u738B\u6559\u6388", "\u9648\u6559\u6388", "\u674E\u52A9\u624B"];
  const tagList = ["\u53F2\u8BB0", "\u6C49\u4E66", "\u8D44\u6CBB\u901A\u9274", "\u6E05\u53F2\u7A3F", "\u91CD\u70B9\u9879\u76EE", "\u591A\u5C42\u907F\u8BB3", "\u5DF2\u5BA1", "\u5F85\u5BA1"];
  const toggleArray = (key, v) => {
    const arr = filters()[key] || [];
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    setFilters({
      ...filters(),
      [key]: next
    });
  };
  const resetFilters = () => setFilters({
    search: "",
    status: [],
    dynasty: [],
    priority: [],
    assignee: [],
    hasAnomaly: null,
    tags: []
  });
  const currentPage = () => {
    const start = (page() - 1) * pageSize;
    return projects().slice(start, start + pageSize);
  };
  const totalPages = () => Math.max(1, Math.ceil(projects().length / pageSize));
  const pct = (p) => {
    const done = p.confirmedCount + p.rejectedCount + p.manualCount;
    return p.totalSuspected ? Math.round(done / p.totalSuspected * 100) : 0;
  };
  const batchStatusChange = async (status) => {
    for (const id of selected()) {
      await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          status
        })
      });
    }
    setSelected(/* @__PURE__ */ new Set());
    const body = {
      op: "filter",
      ...filters()
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    setProjects(await res.json());
  };
  const [newForm, setNewForm] = createSignal({
    name: "",
    textName: "",
    author: "",
    dynasty: "",
    sourceDynasty: "",
    description: "",
    originalText: "",
    assignee: "\u5F20\u6821\u52D8",
    priority: "medium"
  });
  const submitNewProject = async () => {
    const f = newForm();
    if (!f.name || !f.originalText) return;
    await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...f,
        currentText: f.originalText,
        status: "draft",
        createdBy: "\u5F20\u6821\u52D8",
        dynastyRuleIds: [],
        totalSuspected: 0,
        confirmedCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        manualCount: 0,
        anomalyCount: 0,
        tags: ["\u65B0\u5EFA"],
        batchId: `BATCH-2025-NEW-${Math.floor(Math.random() * 1e3)}`
      })
    });
    setShowNewModal(false);
    setNewForm({
      name: "",
      textName: "",
      author: "",
      dynasty: "",
      sourceDynasty: "",
      description: "",
      originalText: "",
      assignee: "\u5F20\u6821\u52D8",
      priority: "medium"
    });
    const body = {
      op: "filter",
      ...filters()
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    setProjects(await res.json());
  };
  const unresolvedAnomalies = () => (allAnomalies() || []).filter((a) => !a.resolved).slice(0, 3);
  return (() => {
    var _el$ = _tmpl$4(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$5.nextSibling, _el$7 = _el$2.nextSibling, _el$8 = _el$7.firstChild, _el$9 = _el$8.firstChild, _el$0 = _el$9.nextSibling, _el$1 = _el$0.nextSibling, _el$10 = _el$1.firstChild, _el$11 = _el$8.nextSibling, _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling, _el$14 = _el$13.nextSibling, _el$15 = _el$14.firstChild, _el$16 = _el$11.nextSibling, _el$17 = _el$16.firstChild, _el$18 = _el$17.nextSibling, _el$19 = _el$16.nextSibling, _el$20 = _el$19.firstChild, _el$21 = _el$20.nextSibling, _el$22 = _el$19.nextSibling, _el$23 = _el$22.firstChild, _el$24 = _el$23.nextSibling, _el$34 = _el$7.nextSibling, _el$35 = _el$34.firstChild, _el$36 = _el$35.firstChild, _el$37 = _el$36.firstChild, _el$38 = _el$37.nextSibling, _el$39 = _el$35.nextSibling, _el$40 = _el$39.firstChild, _el$41 = _el$40.firstChild, _el$42 = _el$41.nextSibling, _el$43 = _el$40.nextSibling, _el$44 = _el$43.firstChild, _el$45 = _el$44.nextSibling, _el$46 = _el$43.nextSibling, _el$47 = _el$46.firstChild, _el$48 = _el$47.nextSibling, _el$49 = _el$46.nextSibling, _el$50 = _el$49.firstChild, _el$51 = _el$50.nextSibling, _el$52 = _el$49.nextSibling, _el$53 = _el$52.firstChild, _el$54 = _el$53.nextSibling, _el$55 = _el$54.firstChild, _el$56 = _el$55.nextSibling, _el$57 = _el$39.nextSibling, _el$58 = _el$57.firstChild, _el$59 = _el$58.firstChild, _el$60 = _el$59.nextSibling, _el$61 = _el$58.nextSibling, _el$62 = _el$61.firstChild, _el$63 = _el$62.nextSibling, _el$64 = _el$63.firstChild, _el$66 = _el$64.nextSibling, _el$65 = _el$66.nextSibling, _el$67 = _el$34.nextSibling, _el$68 = _el$67.firstChild, _el$69 = _el$68.firstChild, _el$70 = _el$69.firstChild, _el$71 = _el$70.nextSibling, _el$72 = _el$71.firstChild, _el$74 = _el$72.nextSibling, _el$73 = _el$74.nextSibling, _el$75 = _el$69.nextSibling, _el$76 = _el$75.firstChild, _el$86 = _el$68.nextSibling, _el$87 = _el$86.firstChild, _el$88 = _el$87.firstChild, _el$89 = _el$88.firstChild, _el$90 = _el$89.firstChild, _el$91 = _el$90.firstChild, _el$92 = _el$90.nextSibling, _el$93 = _el$92.nextSibling, _el$94 = _el$93.nextSibling, _el$95 = _el$94.nextSibling, _el$96 = _el$95.nextSibling, _el$97 = _el$96.nextSibling, _el$98 = _el$97.nextSibling, _el$99 = _el$88.nextSibling, _el$100 = _el$86.nextSibling, _el$101 = _el$100.firstChild, _el$102 = _el$101.nextSibling, _el$103 = _el$102.nextSibling, _el$104 = _el$103.firstChild, _el$106 = _el$104.nextSibling, _el$105 = _el$106.nextSibling;
    _el$5.$$click = () => alert("\u5BFC\u5165\u6570\u636E\u529F\u80FD\uFF08\u6F14\u793A\uFF09");
    _el$6.$$click = () => setShowNewModal(true);
    insert(_el$0, () => stats()?.totalProjects ?? 0);
    insert(_el$1, archivedCount, null);
    insert(_el$13, () => stats()?.inReview ?? 0);
    insert(_el$14, () => stats()?.pending ?? 0, null);
    insert(_el$18, () => stats()?.dynastyCoverage ?? 0);
    insert(_el$21, () => stats()?.anomalies ?? 0);
    insert(_el$24, completedMonth);
    insert(_el$, createComponent(Show, {
      get when() {
        return unresolvedAnomalies().length > 0;
      },
      get children() {
        var _el$25 = _tmpl$2(), _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, _el$28 = _el$27.firstChild, _el$29 = _el$28.firstChild, _el$31 = _el$29.nextSibling, _el$30 = _el$31.nextSibling, _el$32 = _el$28.nextSibling, _el$33 = _el$27.nextSibling;
        insert(_el$28, () => unresolvedAnomalies().length, _el$31);
        insert(_el$32, createComponent(For, {
          get each() {
            return unresolvedAnomalies();
          },
          children: (a) => (() => {
            var _el$146 = _tmpl$5();
            insert(_el$146, createComponent(A, {
              get href() {
                return `/project/${a.projectId}#anomalies`;
              },
              style: {
                textDecoration: "underline"
              },
              get children() {
                return ["[", memo(() => a.type), "] ", memo(() => a.description.slice(0, 38)), memo(() => a.description.length > 38 ? "\u2026" : "")];
              }
            }));
            return _el$146;
          })()
        }));
        _el$33.$$click = () => nav("/rules");
        return _el$25;
      }
    }), _el$34);
    _el$38.$$input = (e) => setFilters({
      ...filters(),
      search: e.currentTarget.value
    });
    insert(_el$42, createComponent(For, {
      each: statusList,
      children: (s) => (() => {
        var _el$147 = _tmpl$6();
        _el$147.$$click = () => toggleArray("status", s);
        insert(_el$147, () => STATUS_LABEL[s]);
        createRenderEffect(() => className(_el$147, `filter-tag ${filters().status.includes(s) ? "active" : ""}`));
        return _el$147;
      })()
    }));
    insert(_el$45, createComponent(For, {
      each: dynastyList,
      children: (d) => (() => {
        var _el$148 = _tmpl$6();
        _el$148.$$click = () => toggleArray("dynasty", d);
        insert(_el$148, d);
        createRenderEffect(() => className(_el$148, `filter-tag ${filters().dynasty.includes(d) ? "active" : ""}`));
        return _el$148;
      })()
    }));
    insert(_el$48, createComponent(For, {
      each: priorityList,
      children: (p) => (() => {
        var _el$149 = _tmpl$6();
        _el$149.$$click = () => toggleArray("priority", p);
        insert(_el$149, () => PRIORITY_LABEL[p]);
        createRenderEffect(() => className(_el$149, `filter-tag ${filters().priority.includes(p) ? "active" : ""}`));
        return _el$149;
      })()
    }));
    insert(_el$51, createComponent(For, {
      each: assigneeList,
      children: (a) => (() => {
        var _el$150 = _tmpl$6();
        _el$150.$$click = () => toggleArray("assignee", a);
        insert(_el$150, a);
        createRenderEffect(() => className(_el$150, `filter-tag ${filters().assignee.includes(a) ? "active" : ""}`));
        return _el$150;
      })()
    }));
    _el$55.$$click = () => setFilters({
      ...filters(),
      hasAnomaly: filters().hasAnomaly === true ? null : true
    });
    _el$56.$$click = () => setFilters({
      ...filters(),
      hasAnomaly: filters().hasAnomaly === false ? null : false
    });
    insert(_el$60, createComponent(For, {
      each: tagList,
      children: (t) => (() => {
        var _el$151 = _tmpl$7(), _el$152 = _el$151.firstChild;
        _el$151.$$click = () => toggleArray("tags", t);
        insert(_el$151, t, null);
        createRenderEffect(() => className(_el$151, `filter-tag ${filters().tags.includes(t) ? "active" : ""}`));
        return _el$151;
      })()
    }));
    _el$62.$$click = resetFilters;
    insert(_el$63, () => projects().length, _el$66);
    insert(_el$71, () => projects().length, _el$74);
    insert(_el$67, createComponent(Show, {
      get when() {
        return selected().size > 0;
      },
      get children() {
        var _el$77 = _tmpl$22(), _el$78 = _el$77.firstChild, _el$79 = _el$78.firstChild, _el$81 = _el$79.nextSibling, _el$80 = _el$81.nextSibling, _el$82 = _el$78.nextSibling, _el$83 = _el$82.nextSibling, _el$84 = _el$83.nextSibling, _el$85 = _el$84.nextSibling;
        insert(_el$78, () => selected().size, _el$81);
        _el$82.$$click = () => batchStatusChange("reviewed");
        _el$83.$$click = () => batchStatusChange("in_review");
        _el$84.$$click = () => alert("\u6279\u91CF\u5BFC\u51FA\uFF08\u6F14\u793A\uFF09");
        _el$85.$$click = () => setSelected(/* @__PURE__ */ new Set());
        return _el$77;
      }
    }), _el$86);
    _el$91.addEventListener("change", toggleAll);
    insert(_el$99, createComponent(For, {
      get each() {
        return currentPage();
      },
      get fallback() {
        return _tmpl$8();
      },
      children: (p) => (() => {
        var _el$154 = _tmpl$1(), _el$155 = _el$154.firstChild, _el$156 = _el$155.firstChild, _el$157 = _el$155.nextSibling, _el$158 = _el$157.firstChild, _el$160 = _el$158.nextSibling, _el$161 = _el$160.firstChild, _el$162 = _el$161.nextSibling, _el$165 = _el$162.nextSibling, _el$163 = _el$165.nextSibling, _el$166 = _el$163.nextSibling, _el$164 = _el$166.nextSibling, _el$167 = _el$160.nextSibling, _el$168 = _el$157.nextSibling, _el$169 = _el$168.firstChild, _el$170 = _el$169.nextSibling, _el$171 = _el$170.firstChild, _el$172 = _el$170.nextSibling, _el$173 = _el$172.firstChild, _el$174 = _el$168.nextSibling, _el$175 = _el$174.firstChild, _el$176 = _el$175.nextSibling, _el$177 = _el$176.firstChild, _el$178 = _el$174.nextSibling, _el$179 = _el$178.firstChild, _el$180 = _el$179.firstChild, _el$181 = _el$180.firstChild, _el$183 = _el$181.nextSibling, _el$182 = _el$183.nextSibling, _el$184 = _el$180.nextSibling, _el$185 = _el$184.firstChild, _el$188 = _el$185.nextSibling, _el$186 = _el$188.nextSibling, _el$189 = _el$186.nextSibling, _el$187 = _el$189.nextSibling, _el$190 = _el$179.nextSibling, _el$191 = _el$190.firstChild, _el$192 = _el$178.nextSibling, _el$193 = _el$192.firstChild, _el$194 = _el$193.nextSibling, _el$195 = _el$194.firstChild, _el$196 = _el$195.firstChild, _el$197 = _el$192.nextSibling, _el$198 = _el$197.firstChild, _el$199 = _el$198.nextSibling, _el$200 = _el$199.firstChild, _el$201 = _el$197.nextSibling, _el$203 = _el$201.firstChild, _el$204 = _el$203.nextSibling;
        _el$156.addEventListener("change", () => toggleSelect(p.id));
        _el$158.$$click = () => nav(`/project/${p.id}`);
        insert(_el$158, createComponent(Show, {
          get when() {
            return p.anomalyCount > 0;
          },
          get children() {
            var _el$159 = _tmpl$9();
            createRenderEffect(() => setAttribute(_el$159, "title", `\u542B ${p.anomalyCount} \u6761\u5F02\u5E38`));
            return _el$159;
          }
        }), null);
        insert(_el$158, () => p.name, null);
        insert(_el$161, () => p.id);
        insert(_el$160, () => p.author, _el$165);
        insert(_el$160, () => p.textName, _el$166);
        insert(_el$160, createComponent(Show, {
          get when() {
            return p.batchId;
          },
          get children() {
            return [" \xB7 \u6279\u6B21 [", memo(() => p.batchId), "]"];
          }
        }), null);
        insert(_el$167, createComponent(For, {
          get each() {
            return p.tags;
          },
          children: (t) => (() => {
            var _el$205 = _tmpl$10();
            insert(_el$205, t);
            return _el$205;
          })()
        }));
        insert(_el$169, () => p.dynasty);
        insert(_el$170, () => p.sourceDynasty, null);
        insert(_el$173, () => PRIORITY_LABEL[p.priority]);
        insert(_el$175, () => STATUS_LABEL[p.status]);
        insert(_el$176, () => formatDate(p.updatedAt), null);
        insert(_el$180, () => pct(p), _el$183);
        insert(_el$184, () => p.confirmedCount, _el$188);
        insert(_el$184, () => p.rejectedCount, _el$189);
        insert(_el$184, () => p.manualCount, null);
        insert(_el$193, () => p.totalSuspected);
        insert(_el$195, () => p.pendingCount, null);
        insert(_el$198, () => p.assignee || "\u672A\u6307\u6D3E");
        insert(_el$199, () => p.createdBy, null);
        insert(_el$201, createComponent(A, {
          get href() {
            return `/project/${p.id}`;
          },
          get children() {
            return _tmpl$0();
          }
        }), _el$203);
        _el$203.$$click = () => nav(`/project/${p.id}#versions`);
        _el$204.$$click = () => alert(`\u5BFC\u51FA ${p.name} \u6458\u8981\uFF08\u6F14\u793A\uFF09`);
        createRenderEffect((_p$) => {
          var _v$5 = `badge badge-${p.priority}`, _v$6 = `badge badge-${p.status}`, _v$7 = `progress-bar ${p.status === "archived" ? "paused" : ""}`, _v$8 = `${pct(p)}%`;
          _v$5 !== _p$.e && className(_el$173, _p$.e = _v$5);
          _v$6 !== _p$.t && className(_el$175, _p$.t = _v$6);
          _v$7 !== _p$.a && className(_el$191, _p$.a = _v$7);
          _v$8 !== _p$.o && setStyleProperty(_el$191, "width", _p$.o = _v$8);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0
        });
        createRenderEffect(() => _el$156.checked = selected().has(p.id));
        return _el$154;
      })()
    }));
    _el$101.$$click = () => setPage((p) => Math.max(1, p - 1));
    insert(_el$100, createComponent(For, {
      get each() {
        return Array.from({
          length: totalPages()
        }, (_, i) => i + 1);
      },
      children: (p) => (() => {
        var _el$206 = _tmpl$11();
        _el$206.$$click = () => setPage(p);
        insert(_el$206, p);
        createRenderEffect(() => className(_el$206, `page-btn ${p === page() ? "active" : ""}`));
        return _el$206;
      })()
    }), _el$102);
    _el$102.$$click = () => setPage((p) => Math.min(totalPages(), p + 1));
    insert(_el$103, () => projects().length, _el$106);
    insert(_el$, createComponent(Show, {
      get when() {
        return showNewModal();
      },
      get children() {
        var _el$107 = _tmpl$3(), _el$108 = _el$107.firstChild, _el$109 = _el$108.firstChild, _el$110 = _el$109.firstChild, _el$111 = _el$110.nextSibling, _el$112 = _el$109.nextSibling, _el$113 = _el$112.firstChild, _el$114 = _el$113.firstChild, _el$115 = _el$114.nextSibling, _el$116 = _el$113.nextSibling, _el$117 = _el$116.firstChild, _el$118 = _el$117.firstChild, _el$119 = _el$118.nextSibling, _el$120 = _el$117.nextSibling, _el$121 = _el$120.firstChild, _el$122 = _el$121.nextSibling, _el$123 = _el$120.nextSibling, _el$124 = _el$123.firstChild, _el$125 = _el$124.nextSibling, _el$126 = _el$123.nextSibling, _el$127 = _el$126.firstChild, _el$128 = _el$127.nextSibling, _el$129 = _el$128.firstChild, _el$130 = _el$116.nextSibling, _el$131 = _el$130.firstChild, _el$132 = _el$131.nextSibling, _el$133 = _el$130.nextSibling, _el$134 = _el$133.firstChild, _el$135 = _el$134.nextSibling, _el$136 = _el$133.nextSibling, _el$137 = _el$136.firstChild, _el$138 = _el$137.firstChild, _el$139 = _el$138.nextSibling, _el$140 = _el$137.nextSibling, _el$141 = _el$140.firstChild, _el$142 = _el$141.nextSibling, _el$143 = _el$112.nextSibling, _el$144 = _el$143.firstChild, _el$145 = _el$144.nextSibling;
        _el$107.$$click = () => setShowNewModal(false);
        _el$108.$$click = (e) => e.stopPropagation();
        _el$111.$$click = () => setShowNewModal(false);
        _el$115.$$input = (e) => setNewForm({
          ...newForm(),
          name: e.currentTarget.value
        });
        _el$119.$$input = (e) => setNewForm({
          ...newForm(),
          textName: e.currentTarget.value
        });
        _el$122.$$input = (e) => setNewForm({
          ...newForm(),
          author: e.currentTarget.value
        });
        _el$125.$$input = (e) => setNewForm({
          ...newForm(),
          dynasty: e.currentTarget.value
        });
        _el$128.addEventListener("change", (e) => setNewForm({
          ...newForm(),
          sourceDynasty: e.currentTarget.value
        }));
        insert(_el$128, createComponent(For, {
          each: dynastyList,
          children: (d) => (() => {
            var _el$207 = _tmpl$12();
            _el$207.value = d;
            insert(_el$207, d);
            return _el$207;
          })()
        }), null);
        _el$132.$$input = (e) => setNewForm({
          ...newForm(),
          description: e.currentTarget.value
        });
        _el$135.$$input = (e) => setNewForm({
          ...newForm(),
          originalText: e.currentTarget.value
        });
        _el$139.addEventListener("change", (e) => setNewForm({
          ...newForm(),
          assignee: e.currentTarget.value
        }));
        insert(_el$139, createComponent(For, {
          each: assigneeList,
          children: (a) => (() => {
            var _el$208 = _tmpl$12();
            _el$208.value = a;
            insert(_el$208, a);
            return _el$208;
          })()
        }));
        _el$142.addEventListener("change", (e) => setNewForm({
          ...newForm(),
          priority: e.currentTarget.value
        }));
        _el$144.$$click = () => setShowNewModal(false);
        _el$145.$$click = submitNewProject;
        createRenderEffect(() => _el$115.value = newForm().name);
        createRenderEffect(() => _el$119.value = newForm().textName);
        createRenderEffect(() => _el$122.value = newForm().author);
        createRenderEffect(() => _el$125.value = newForm().dynasty);
        createRenderEffect(() => _el$128.value = newForm().sourceDynasty);
        createRenderEffect(() => _el$132.value = newForm().description);
        createRenderEffect(() => _el$135.value = newForm().originalText);
        createRenderEffect(() => _el$139.value = newForm().assignee);
        createRenderEffect(() => _el$142.value = newForm().priority);
        return _el$107;
      }
    }), null);
    createRenderEffect((_p$) => {
      var _v$ = `filter-tag ${filters().hasAnomaly === true ? "active" : ""}`, _v$2 = `filter-tag ${filters().hasAnomaly === false ? "active" : ""}`, _v$3 = page() <= 1, _v$4 = page() >= totalPages();
      _v$ !== _p$.e && className(_el$55, _p$.e = _v$);
      _v$2 !== _p$.t && className(_el$56, _p$.t = _v$2);
      _v$3 !== _p$.a && (_el$101.disabled = _p$.a = _v$3);
      _v$4 !== _p$.o && (_el$102.disabled = _p$.o = _v$4);
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    createRenderEffect(() => _el$38.value = filters().search);
    createRenderEffect(() => _el$91.checked = currentPage().length > 0 && selected().size === currentPage().length);
    return _el$;
  })();
}
function formatDate(s) {
  try {
    const d = new Date(s);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return s;
  }
}
delegateEvents(["click", "input"]);

// src/routes/project/[id].tsx
var _tmpl$13 = /* @__PURE__ */ template(`<span>`);
var _tmpl$23 = /* @__PURE__ */ template(`<span class=tag-chip>\u6279\u6B21 `);
var _tmpl$32 = /* @__PURE__ */ template(`<div class=detail-top><div class=panel><div class=panel-header><h3 class=panel-title>\u{1F4D6} \u9879\u76EE\u57FA\u672C\u4FE1\u606F</h3><div class=gap-small><span></span></div></div><div class=panel-body><div class=info-grid><div class=info-item><span class=info-label>\u9879\u76EE\u8D1F\u8D23\u4EBA</span><span class=info-value></span></div><div class=info-item><span class=info-label>\u521B\u5EFA\u8005</span><span class=info-value></span></div><div class=info-item><span class=info-label>\u521B\u5EFA\u65F6\u95F4</span><span class=info-value></span></div><div class=info-item><span class=info-label>\u6700\u540E\u66F4\u65B0</span><span class=info-value></span></div><div class=info-item><span class=info-label>\u622A\u6B62\u65E5\u671F</span><span class=info-value></span></div><div class=info-item><span class=info-label>\u9002\u7528\u671D\u4EE3\u89C4\u5219</span><span class=info-value> \u6761\u89C4\u5219\uFF08\u8BE6\u89C1\u4E0B\u65B9\uFF09</span></div><div class="info-item full"><span class=info-label>\u5BA1\u8BFB\u63CF\u8FF0</span><span class=info-value></span></div></div></div></div><div class=panel><div class=panel-header><h3 class=panel-title>\u{1F4CA} \u5BA1\u8BFB\u8FDB\u5EA6\u603B\u89C8</h3><span class=panel-meta>\u81EA\u52A8\u5237\u65B0</span></div><div class=panel-body><div class=side-summary-stats style=marginBottom:14><div class=summary-stat><div class=label>\u7591\u4F3C\u66FF\u6362\u5B57</div><div class=value></div></div><div class=summary-stat><div class=label>\u2705 \u5DF2\u786E\u8BA4</div><div class=value style=color:#059669></div></div><div class=summary-stat><div class=label>\u274C \u5DF2\u9A73\u56DE</div><div class=value style=color:#dc2626></div></div><div class=summary-stat><div class=label>\u23F3 \u5F85\u5BA1</div><div class=value style=color:#0284c7></div></div><div class=summary-stat><div class=label>\u2731 \u4EBA\u5DE5</div><div class=value style=color:#b45309></div></div><div class=summary-stat><div class=label>\u26A0 \u5F02\u5E38</div><div class=value></div></div></div><div style=marginBottom:4;display:flex;justifyContent:space-between;fontSize:12><span>\u6574\u4F53\u5B8C\u6210\u5EA6</span><span style=fontWeight:600>%</span></div><div class=progress-wrap style=marginBottom:14><div class=progress-bar></div></div><div class=gap-small style=marginTop:14><span style=fontSize:12;color:#374151>\u5FEB\u901F\u72B6\u6001\u5207\u6362\uFF1A</span><button class="btn btn-xs btn-default">\u8349\u7A3F</button><button class="btn btn-xs btn-warning">\u5BA1\u8BFB\u4E2D</button><button class="btn btn-xs btn-success">\u5DF2\u5BA1\u6BD5</button><button class="btn btn-xs btn-primary">\u5DF2\u5BFC\u51FA</button><button class="btn btn-xs btn-default">\u5F52\u6863`);
var _tmpl$42 = /* @__PURE__ */ template(`<div class=danger-banner><span style=fontSize:18>\u26A0\uFE0F</span><div style=flex:1><strong>\u672C\u9879\u76EE\u6709 <!> \u6761\u5F02\u5E38\u6570\u636E</strong><span style=marginLeft:12;fontSize:12.5>\u8BF7\u524D\u5F80\u300C\u5F02\u5E38\u62A5\u544A\u300D\u6807\u7B7E\u67E5\u770B\u8BE6\u60C5\u5E76\u5904\u7406</span></div><button class="btn btn-xs btn-warning">\u53BB\u5904\u7406 \u2192`);
var _tmpl$52 = /* @__PURE__ */ template(`<div style=display:flex;justifyContent:space-between;alignItems:center;marginBottom:14;gap:10px;flexWrap:wrap><div class=gap-medium><select class=filter-select style="fontSize:12;padding:6px 10px"><option value=all>\u5168\u90E8\u72B6\u6001</option><option value=pending>\u5F85\u5BA1</option><option value=confirmed>\u5DF2\u786E\u8BA4</option><option value=rejected>\u5DF2\u9A73\u56DE</option><option value=manual>\u4EBA\u5DE5\u5224\u5B9A</option></select><select class=filter-select style="fontSize:12;padding:6px 10px"><option value=all>\u5168\u90E8\u671D\u4EE3\u89C4\u5219</option></select></div><div class="small muted">\u663E\u793A <!> / <!> \u6761`);
var _tmpl$62 = /* @__PURE__ */ template(`<div style=marginBottom:12;fontSize:12.5;color:#374151>\u5DE6\u4FA7\u4E3A\u539F\u6587\u626B\u63CF\uFF0C\u53F3\u4FA7\u4E3A\u5DF2\u5E94\u7528\uFF08\u6216\u5F85\u786E\u8BA4\uFF09\u66FF\u6362\u5B57\u7684\u7248\u672C\u3002<span class=hl-taboo style="margin:0 4px">\u7EA2\u8272\u9AD8\u4EAE</span>=\u5F85\u5BA1/\u5F85\u6539\uFF0C<span class=hl-repl style="margin:0 4px">\u7EFF\u8272\u9AD8\u4EAE</span>=\u5DF2\u786E\u8BA4\u66FF\u6362\uFF0C<span class=hl-manual style="margin:0 4px">\u9EC4\u8272\u865A\u7EBF</span>=\u4EBA\u5DE5\u5224\u5B9A\u3002`);
var _tmpl$72 = /* @__PURE__ */ template(`<div class=text-compare><div class=compare-pane><div class=compare-title>\u539F\u6587\uFF08<!>\uFF09 \xB7 <!> \u5904\u7591\u4F3C</div><div class=compare-body></div></div><div class=compare-pane><div class=compare-title>\u6821\u8BFB\u540E\u6587\u672C \xB7 \u5DF2\u6539 <!> \u5904</div><div class=compare-body>`);
var _tmpl$82 = /* @__PURE__ */ template(`<div class=panel style=marginTop:12><div class=panel-header><h3 class=panel-title>\u{1F4DD} \u66FF\u6362\u5B57\u5BF9\u7167\u6E05\u5355</h3></div><div class=table-wrap><table class=data-table style=fontSize:12><thead><tr><th>\u4F4D\u7F6E</th><th>\u8BB3\u5B57 \u2192 \u66FF\u6362</th><th>\u4F9D\u636E</th><th>\u72B6\u6001</th><th>\u4E0A\u4E0B\u6587\u6458\u8981</th><th>\u5BA1\u6838 / \u5907\u6CE8</th></tr></thead><tbody>`);
var _tmpl$92 = /* @__PURE__ */ template(`<div style=fontSize:12.5;color:#374151;marginBottom:14>\u7248\u672C / \u6279\u6B21\u53D8\u66F4\u8BB0\u5F55\uFF0C\u6BCF\u6B21\u4FDD\u5B58\u5FEB\u7167\u6216\u6279\u91CF\u64CD\u4F5C\u90FD\u4F1A\u8BB0\u5F55\u3002`);
var _tmpl$02 = /* @__PURE__ */ template(`<div class=empty-state>\u6682\u65E0\u7248\u672C\u8BB0\u5F55`);
var _tmpl$14 = /* @__PURE__ */ template(`<div class=version-timeline>`);
var _tmpl$102 = /* @__PURE__ */ template(`<div style=fontSize:12.5;color:#374151;marginBottom:12>\u672C\u9879\u76EE\u5DF2\u542F\u7528 <!> \u6761\u671D\u4EE3\u907F\u8BB3\u89C4\u5219\u3002<button class="btn btn-xs btn-default"style=marginLeft:12>\uFF0B \u4ECE\u89C4\u5219\u5E93\u6DFB\u52A0`);
var _tmpl$112 = /* @__PURE__ */ template(`<div class=table-wrap><table class=rules-table><thead><tr><th>\u671D\u4EE3</th><th>\u7687\u5E1D / \u540D\u8BB3</th><th style=textAlign:center>\u5B57</th><th style=textAlign:center>\u4E25\u5EA6</th><th>\u907F\u8BB3\u7406\u7531</th><th>\u8D77\u8BAB\uFF08\u5E74\uFF09</th><th>\u4F9D\u636E</th></tr></thead><tbody>`);
var _tmpl$122 = /* @__PURE__ */ template(`<div class="flex-between mb-medium"><div style=fontSize:12.5;color:#374151>\u6240\u6709\u6279\u6CE8\u4E0E\u7B14\u8BB0\uFF0C\u53EF\u6309\u66FF\u6362\u5B57\u6216\u5168\u5C40\u7B14\u8BB0\u3002</div><button class="btn btn-sm btn-primary">\uFF0B \u65B0\u589E\u6279\u6CE8`);
var _tmpl$132 = /* @__PURE__ */ template(`<div style=fontSize:12.5;color:#374151;marginBottom:12>\u7CFB\u7EDF\u81EA\u52A8\u68C0\u6D4B\u7684\u5F02\u5E38\u6570\u636E\uFF0C\u9700\u8981\u4EBA\u5DE5\u786E\u8BA4\u5904\u7406\u3002`);
var _tmpl$142 = /* @__PURE__ */ template(`<div class=panel><div class=tabs><div>\u{1F50D} \u7591\u4F3C\u66FF\u6362\u5B57\u5BA1\u8BFB (<!>)</div><div>\u{1F4DC} \u539F\u6587 / \u6539\u6587 \u5BF9\u7167</div><div>\u{1F5C2} \u7248\u672C / \u6279\u6B21\u5386\u53F2 (<!>)</div><div>\u{1F4CB} \u9002\u7528\u671D\u4EE3\u89C4\u5219 (<!>)</div><div>\u{1F4AC} \u6279\u6CE8 / \u5BA1\u8BFB\u7B14\u8BB0 (<!>)</div><div>\u26A0 \u5F02\u5E38\u62A5\u544A (<!>)</div><div>\u{1F4E4} \u5BFC\u51FA\u6458\u8981</div></div><div class=panel-body></div><div class=detail-actions-row><div class="small muted">\u{1F4A1} \u63D0\u793A\uFF1A\u53EF\u4EE5\u5728\u300C\u7591\u4F3C\u66FF\u6362\u5B57\u5BA1\u8BFB\u300D\u6807\u7B7E\u4E2D\u9010\u6761\u5BA1\u6838\u6BCF\u4E00\u5904\u7591\u4F3C\uFF0C\u672C\u5DE5\u5177\u652F\u6301\u786E\u8BA4 / \u9A73\u56DE / \u4EBA\u5DE5\u5224\u5B9A\u4E09\u79CD\u5904\u7406\u65B9\u5F0F\u3002</div><div class=gap-medium><button class="btn btn-default">\u8FD4\u56DE\u53F0\u8D26</button><button class="btn btn-success">\u{1F4BE} \u4FDD\u5B58\u7248\u672C\u5FEB\u7167</button><button class="btn btn-primary">\u{1F4E4} \u5BFC\u51FA\u6458\u8981`);
var _tmpl$15 = /* @__PURE__ */ template(`<div class="small muted"style=marginBottom:10>\u5173\u8054\uFF1A<!>\uFF08\u4F4D\u7F6E <!>\uFF09`);
var _tmpl$16 = /* @__PURE__ */ template(`<div class=modal-backdrop><div class=modal><div class=modal-head><h3>\u{1F4AC} \u6DFB\u52A0\u6279\u6CE8 / \u5BA1\u8BFB\u7B14\u8BB0</h3><button class="btn btn-xs btn-default">\u2715</button></div><div class=modal-body><div class=form-row><label>\u6279\u6CE8\u7C7B\u578B</label><select class=form-select><option value=comment>\u4E00\u822C\u7B14\u8BB0</option><option value=query>\u7591\u95EE / \u8BF7\u793A</option><option value=replacement>\u66FF\u6362\u8BF4\u660E</option><option value=reference>\u53C2\u8003\u6587\u732E</option><option value=issue>\u95EE\u9898\u62A5\u544A</option></select></div><div class=form-row><label>\u6279\u6CE8\u5185\u5BB9</label><textarea class=form-textarea placeholder=\u8BF7\u8F93\u5165\u6279\u6CE8\u5185\u5BB9\u2026></textarea></div><div class=form-row><label>\u6279\u6CE8\u4EBA</label><input class=form-input></div></div><div class=modal-foot><button class="btn btn-default">\u53D6\u6D88</button><button class="btn btn-primary">\u63D0\u4EA4\u6279\u6CE8`);
var _tmpl$17 = /* @__PURE__ */ template(`<div class=modal-backdrop><div class=modal><div class=modal-head><h3>\u{1F4BE} \u4FDD\u5B58\u7248\u672C\u5FEB\u7167</h3><button class="btn btn-xs btn-default">\u2715</button></div><div class=modal-body><div class=small style=color:#374151;marginBottom:10>\u5F53\u524D\u8FDB\u5EA6\u5C06\u88AB\u5B8C\u6574\u5FEB\u7167\uFF0C\u53EF\u5728\u300C\u7248\u672C / \u6279\u6B21\u5386\u53F2\u300D\u4E2D\u67E5\u770B\u6216\u8FD8\u539F\u3002</div><div class=export-summary-block><div style=fontSize:13>\u5DF2\u786E\u8BA4 <!> \xB7 \u5DF2\u9A73\u56DE <!> \xB7 \u5F85\u5BA1 <!> \xB7 \u4EBA\u5DE5 </div></div></div><div class=modal-foot><button class="btn btn-default">\u53D6\u6D88</button><button class="btn btn-primary">\u786E\u8BA4\u4FDD\u5B58\u5FEB\u7167`);
var _tmpl$18 = /* @__PURE__ */ template(`<div class=detail-page-wrap><div class=page-header><div class=page-title-block><div style=display:flex;alignItems:center;gap:10px;marginBottom:4><button class="btn btn-sm btn-default">\u2190 \u8FD4\u56DE\u53F0\u8D26</button><h2 style=margin:0></h2></div><p class=subtitle><span style="fontFamily:ui-monospace, monospace"></span> \xB7 <!>\u300A<!>\u300B\xB7 \u5E95\u672C\uFF1A<!> \xB7 \u6E90\uFF1A</p></div><div class=page-actions><button class="btn btn-default">\u{1F4BE} \u4FDD\u5B58\u7248\u672C\u5FEB\u7167</button><button class="btn btn-success">\u{1F4D1} \u751F\u6210\u5BF9\u6821\u62A5\u544A</button><button class="btn btn-warning">\u{1F4E4} \u5BFC\u51FA\u6458\u8981`);
var _tmpl$19 = /* @__PURE__ */ template(`<span class=tag-chip>`);
var _tmpl$20 = /* @__PURE__ */ template(`<option>[<!>] <!>\u2192`);
var _tmpl$21 = /* @__PURE__ */ template(`<div class=empty-state>\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u8BB0\u5F55`);
var _tmpl$222 = /* @__PURE__ */ template(`<span><b>\u5BA1\u6838\uFF1A</b> @ `);
var _tmpl$232 = /* @__PURE__ */ template(`<span><b>\u4E25\u5EA6\uFF1A</b><span>`);
var _tmpl$24 = /* @__PURE__ */ template(`<span><b>\u4F9D\u636E\uFF1A`);
var _tmpl$25 = /* @__PURE__ */ template(`<div class=rep-note-view>\u{1F4A1} `);
var _tmpl$26 = /* @__PURE__ */ template(`<div><div class=rep-header><div class=rep-identity><span class=rep-id></span><span></span><div class=confidence-bar><span>\u7F6E\u4FE1\u5EA6 <!>%</span><div class=confidence-dots></div></div></div><div class=rep-chars><span class=rep-char-taboo></span><span class=rep-char-arrow>\u2192</span><span class=rep-char-repl></span></div></div><div class=context-block><span class=context-before></span><span class=context-target></span><span class=context-after></span></div><div class=rep-meta-row><span><b>\u671D\u4EE3\u89C4\u5219\uFF1A</b></span><span><b>\u4F4D\u7F6E\uFF1A</b>\u7B2C <!> \u5B57</span></div><div class=rep-actions><div class=rep-buttons><button class="btn btn-sm btn-success">\u2705 \u786E\u8BA4\u66FF\u6362</button><button class="btn btn-sm btn-danger">\u274C \u9A73\u56DE</button><button class="btn btn-sm btn-warning">\u2731 \u4EBA\u5DE5\u6807\u8BB0</button><button class="btn btn-sm btn-default">\u{1F4AC} \u6279\u6CE8</button></div><div class=rep-note><textarea class=note-input placeholder=\u8F93\u5165\u5BA1\u8BFB\u5907\u6CE8\uFF08\u5982\uFF1A\u6B64\u5904\u4E3A\u4E13\u540D\u3001\u53C2\u7167\u67D0\u672C\u3001\u9700\u5BF9\u6821\u2026\uFF09>`);
var _tmpl$27 = /* @__PURE__ */ template(`<div>`);
var _tmpl$28 = /* @__PURE__ */ template(`<div class="muted small"> @ `);
var _tmpl$29 = /* @__PURE__ */ template(`<tr><td class=num-col></td><td style=fontWeight:700><span style=color:#991b1b></span><span style=color:#9ca3af> \u2192 </span><span style=color:#047857></span></td><td class=small></td><td><span></span></td><td class=small style="fontFamily:SimSun, serif">\u2026<b></b>\u2026</td><td class=small>`);
var _tmpl$30 = /* @__PURE__ */ template(`<span class=muted>\u2014`);
var _tmpl$31 = /* @__PURE__ */ template(`<span class=tag-chip style=marginLeft:8>\u6279\u6B21 `);
var _tmpl$322 = /* @__PURE__ */ template(`<div class=version-node><div class=version-head><div><span class=version-tag>v</span><span style=marginLeft:8;fontWeight:600></span></div><div class="small muted"> \xB7 </div></div><div class=version-card><div class=version-summary></div><div class=version-meta>\u5FEB\u7167\u65F6\u72B6\u6001\uFF1A<b></b> \xB7 \u786E\u8BA4 <!> \xB7 \u9A73\u56DE <!> \xB7 \u5F85\u5BA1 <!> \xB7 \u4EBA\u5DE5 <!> \xB7 \u7591\u4F3C\u603B\u8BA1 </div><div style=marginTop:8><button class="btn btn-xs btn-default">\u8FD8\u539F\u6B64\u7248\u672C</button> <button class="btn btn-xs btn-default">\u7248\u672C\u5BF9\u6BD4`);
var _tmpl$33 = /* @__PURE__ */ template(`<tr><td style=fontWeight:600></td><td>\uFF08<!>\uFF09</td><td style="textAlign:center;fontFamily:SimSun, serif;fontSize:15"><span style="display:inline-block;padding:1px 10px;background:#fecaca;color:#7f1d1d;borderRadius:4;marginRight:4"></span><span style=color:#9ca3af>\u2192</span><span style="display:inline-block;padding:1px 10px;background:#bbf7d0;color:#14532d;borderRadius:4;marginLeft:4"></span></td><td style=textAlign:center><span></span></td><td class=small></td><td class=small> \uFF5E </td><td class="small muted">`);
var _tmpl$34 = /* @__PURE__ */ template(`<div class=empty-state>\u6682\u65E0\u6279\u6CE8\uFF0C\u53EF\u5728\u300C\u7591\u4F3C\u66FF\u6362\u5B57\u5BA1\u8BFB\u300D\u4E2D\u4E3A\u67D0\u6761\u8BB0\u5F55\u6DFB\u52A0\u6279\u6CE8\u3002`);
var _tmpl$35 = /* @__PURE__ */ template(`<span class="small muted"style=marginLeft:6>\u5173\u8054 <!> \xB7 \u4F4D\u7F6E `);
var _tmpl$36 = /* @__PURE__ */ template(`<div class="small muted">\u2714 \u5DF2\u89E3\u51B3\uFF1A<!> @ `);
var _tmpl$37 = /* @__PURE__ */ template(`<div class=ann-actions><button class="btn btn-xs btn-success">\u6807\u8BB0\u89E3\u51B3`);
var _tmpl$38 = /* @__PURE__ */ template(`<div><div class=ann-head><div><span class=ann-author></span><span></span></div><div class=ann-meta></div></div><div class=ann-content>`);
var _tmpl$39 = /* @__PURE__ */ template(`<div class=empty-state>\u65E0\u5F02\u5E38\u62A5\u544A`);
var _tmpl$40 = /* @__PURE__ */ template(`<span style=marginLeft:10;color:#059669;fontWeight:600>\u2714 \u5DF2\u89E3\u51B3`);
var _tmpl$41 = /* @__PURE__ */ template(`<div class=anomaly-action>`);
var _tmpl$422 = /* @__PURE__ */ template(`<button class="btn btn-xs btn-success">\u6807\u8BB0\u5DF2\u5904\u7406`);
var _tmpl$43 = /* @__PURE__ */ template(`<div><div class=anomaly-head><div><span></span><span class=anomaly-type style=marginLeft:10></span></div><div class="small muted">\u68C0\u6D4B\u4E8E </div></div><div class=anomaly-desc></div><div class=flex-between><div class="small muted">\u5F71\u54CD\u66FF\u6362\u5B57\uFF1A</div><div class=gap-small><button class="btn btn-xs btn-default">\u5173\u8054\u8DF3\u8F6C`);
var _tmpl$44 = /* @__PURE__ */ template(`<div style="padding:10px 14px;background:#d1fae5;border:1px solid #6ee7b7;borderRadius:6;color:#065f46;marginBottom:14">\u2705 \u5BFC\u51FA\u6210\u529F\uFF01\u8BE5\u6458\u8981\u5DF2\u540C\u6B65\u4FDD\u5B58\u5230\u300C\u5BFC\u51FA\u8BB0\u5F55\u300D\u3002`);
var _tmpl$45 = /* @__PURE__ */ template(`<div><div style=fontSize:12.5;color:#374151;marginBottom:14>\u751F\u6210\u5BA1\u8BFB\u6458\u8981\u5E76\u5BFC\u51FA\uFF0C\u53EF\u9009\u62E9\u5BFC\u51FA\u683C\u5F0F\u3002\u6458\u8981\u4F1A\u4FDD\u5B58\u5230\u7CFB\u7EDF\u7684\u5BFC\u51FA\u8BB0\u5F55\u4E2D\u3002</div><div class="flex-between mb-medium"><div class=gap-small><label class=small style=alignSelf:center>\u5BFC\u51FA\u683C\u5F0F\uFF1A</label><select class=filter-select style=fontSize:12><option value=txt>\u7EAF\u6587\u672C TXT</option><option value=csv>CSV \u8868\u683C</option><option value=json>JSON \u7ED3\u6784\u5316</option><option value=xml>XML \u6807\u51C6</option></select></div><div class=gap-small><button class="btn btn-sm btn-default">\u{1F4CB} \u590D\u5236\u6458\u8981</button><button class="btn btn-sm btn-primary">\u{1F4E4} \u751F\u6210\u5E76\u4E0B\u8F7D</button></div></div><div class=export-summary-block><div class=export-head><div class=export-title>\u{1F4C4} </div><div class=export-meta><span style=marginRight:14><b></b></span><span>\u683C\u5F0F\uFF1A</span></div></div><div class=export-stats style=marginBottom:10><div class=export-stat><div class=num></div><div class=lbl>\u5B57\u6570</div></div><div class=export-stat><div class=num></div><div class=lbl>\u7591\u4F3C</div></div><div class=export-stat><div class=num></div><div class=lbl>\u786E\u8BA4</div></div><div class=export-stat><div class=num></div><div class=lbl>\u9A73\u56DE</div></div><div class=export-stat><div class=num></div><div class=lbl>\u4EBA\u5DE5</div></div><div class=export-stat><div class=num></div><div class=lbl>\u671D\u4EE3</div></div></div><div class=export-summary-text>`);
var STATUS_LABEL2 = {
  draft: "\u8349\u7A3F",
  in_review: "\u5BA1\u8BFB\u4E2D",
  reviewed: "\u5DF2\u5BA1\u6BD5",
  exported: "\u5DF2\u5BFC\u51FA",
  archived: "\u5DF2\u5F52\u6863"
};
function ProjectDetail() {
  const params = useParams();
  const nav = useNavigate();
  const project = createAsync(() => fetch(`/api/projects/${params.id}`).then((r) => r.json()));
  const replacements = createAsync(() => fetch(`/api/projects/${params.id}/replacements`).then((r) => r.json()));
  const allRules = createAsync(() => fetch("/api/rules").then((r) => r.json()));
  const versions = createAsync(() => fetch(`/api/projects/${params.id}/versions`).then((r) => r.json()));
  const annotations = createAsync(() => fetch(`/api/projects/${params.id}/annotations`).then((r) => r.json()));
  const anomalies = createAsync(() => fetch(`/api/anomalies?projectId=${params.id}`).then((r) => r.json()));
  const [tab, setTab] = createSignal("review");
  const [repStatus, setRepStatus] = createSignal("all");
  const [ruleFilter, setRuleFilter] = createSignal("all");
  const [repList, setRepList] = createSignal([]);
  const [repNotes, setRepNotes] = createSignal({});
  const [noteInputs, setNoteInputs] = createSignal({});
  const [showSave, setShowSave] = createSignal(false);
  const [showAnn, setShowAnn] = createSignal({
    open: false
  });
  const [annForm, setAnnForm] = createSignal({
    type: "comment",
    content: "",
    author: "\u5F20\u6821\u52D8"
  });
  const [projState, setProjState] = createSignal(void 0);
  createEffect(() => {
    if (replacements()) {
      setRepList(replacements() ?? []);
      const notes = {};
      const ins = {};
      for (const r of replacements() ?? []) {
        if (r.note) {
          notes[r.id] = r.note;
          ins[r.id] = r.note;
        }
      }
      setRepNotes(notes);
      setNoteInputs(ins);
    }
    if (project()) setProjState(project());
  });
  const ruleMap = createMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const r of allRules() ?? []) m.set(r.id, r);
    return m;
  });
  const projRules = createMemo(() => (allRules() ?? []).filter((r) => (projState()?.dynastyRuleIds ?? []).includes(r.id)));
  const visibleReplacements = createMemo(() => {
    let list = repList();
    if (repStatus() !== "all") list = list.filter((r) => r.status === repStatus());
    if (ruleFilter() !== "all") list = list.filter((r) => r.dynastyRuleId === ruleFilter());
    return list;
  });
  const applyReplacementStatus = async (repId, status) => {
    const patch = {
      status,
      reviewedBy: "\u5F20\u6821\u52D8",
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const note = noteInputs()[repId];
    if (note && note !== repNotes()[repId]) {
      patch.note = note;
      setRepNotes({
        ...repNotes(),
        [repId]: note
      });
    } else if (repNotes()[repId]) {
      patch.note = repNotes()[repId];
    }
    const res = await fetch(`/api/replacements/${repId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patch)
    });
    const updated = await res.json();
    setRepList(repList().map((r) => r.id === repId ? updated : r));
    const upd = await fetch(`/api/projects/${params.id}`).then((r) => r.json());
    setProjState(upd);
  };
  const saveNote = (repId) => {
    const note = noteInputs()[repId];
    if (!note) return;
    applyReplacementStatus(repId, repList().find((r) => r.id === repId)?.status ?? "pending");
  };
  const saveSnapshot = async () => {
    setShowSave(true);
  };
  const confirmSnapshot = async () => {
    const p2 = projState();
    if (!p2) return;
    const vers = versions() ?? [];
    const baseNum = parseFloat(vers[0]?.versionNumber ?? "0.0");
    const nextNum = (baseNum + 0.1).toFixed(1);
    await fetch(`/api/projects/${params.id}/versions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        versionNumber: nextNum,
        batchId: p2.batchId,
        createdBy: "\u5F20\u6821\u52D8",
        snapshot: p2,
        replacementsSnapshot: repList(),
        changeSummary: "\u4FDD\u5B58\u5BA1\u8BFB\u8FDB\u5EA6\u5FEB\u7167",
        comment: "\u7528\u6237\u64CD\u4F5C"
      })
    });
    setShowSave(false);
    location.reload();
  };
  const submitAnnotation = async () => {
    if (!annForm().content) return;
    await fetch(`/api/projects/${params.id}/annotations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        replacementId: showAnn().replacementId,
        position: showAnn().position ?? 0,
        type: annForm().type,
        content: annForm().content,
        author: annForm().author
      })
    });
    setShowAnn({
      open: false
    });
    setAnnForm({
      type: "comment",
      content: "",
      author: "\u5F20\u6821\u52D8"
    });
    location.reload();
  };
  const resolveAnnotation = async (id) => {
    await fetch(`/api/projects/${params.id}/annotations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        op: "resolve",
        annotationId: id,
        resolver: "\u5F20\u6821\u52D8"
      })
    });
    location.reload();
  };
  const resolveAnomaly = async (id) => {
    await fetch("/api/anomalies", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        op: "resolve",
        id
      })
    });
    location.reload();
  };
  const updateProjectStatus = async (status) => {
    const res = await fetch(`/api/projects/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status
      })
    });
    setProjState(await res.json());
  };
  const renderHighlightedText = (source) => {
    const text = (source === "original" ? projState()?.originalText : projState()?.currentText) ?? "";
    const reps = repList();
    if (!text) return text;
    const statusMap = /* @__PURE__ */ new Map();
    for (const r of reps) statusMap.set(r.position, r);
    const parts = [];
    for (let i = 0; i < text.length; i++) {
      const r = statusMap.get(i);
      if (r) {
        const cls = r.status === "confirmed" ? "hl-repl" : r.status === "rejected" ? "" : r.status === "manual" ? "hl-manual" : "hl-taboo";
        parts.push((() => {
          var _el$ = _tmpl$13();
          className(_el$, cls);
          insert(_el$, () => r.tabooChar);
          return _el$;
        })());
      } else {
        parts.push(text[i]);
      }
    }
    return parts;
  };
  const p = () => projState();
  return (() => {
    var _el$2 = _tmpl$18(), _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.firstChild, _el$6 = _el$5.firstChild, _el$7 = _el$6.nextSibling, _el$9 = _el$5.nextSibling, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling, _el$13 = _el$1.nextSibling, _el$10 = _el$13.nextSibling, _el$14 = _el$10.nextSibling, _el$11 = _el$14.nextSibling, _el$15 = _el$11.nextSibling, _el$12 = _el$15.nextSibling, _el$16 = _el$4.nextSibling, _el$17 = _el$16.firstChild, _el$18 = _el$17.nextSibling, _el$19 = _el$18.nextSibling;
    _el$6.$$click = () => nav("/");
    insert(_el$7, () => p()?.name ?? "\u52A0\u8F7D\u4E2D\u2026");
    insert(_el$5, createComponent(Show, {
      get when() {
        return p()?.status;
      },
      get children() {
        var _el$8 = _tmpl$13();
        insert(_el$8, () => STATUS_LABEL2[p().status]);
        createRenderEffect(() => className(_el$8, `badge badge-${p().status}`));
        return _el$8;
      }
    }), null);
    insert(_el$0, () => params.id);
    insert(_el$9, () => p()?.author, _el$13);
    insert(_el$9, () => p()?.textName, _el$14);
    insert(_el$9, () => p()?.dynasty, _el$15);
    insert(_el$9, () => p()?.sourceDynasty, null);
    _el$17.$$click = saveSnapshot;
    _el$18.$$click = () => alert("\u751F\u6210\u5BF9\u6821\u62A5\u544A\uFF08\u6F14\u793A\uFF09");
    _el$19.$$click = () => setTab("export");
    insert(_el$2, createComponent(Show, {
      get when() {
        return p();
      },
      get children() {
        return [(() => {
          var _el$20 = _tmpl$32(), _el$21 = _el$20.firstChild, _el$22 = _el$21.firstChild, _el$23 = _el$22.firstChild, _el$24 = _el$23.nextSibling, _el$27 = _el$24.firstChild, _el$28 = _el$22.nextSibling, _el$29 = _el$28.firstChild, _el$30 = _el$29.firstChild, _el$31 = _el$30.firstChild, _el$32 = _el$31.nextSibling, _el$33 = _el$30.nextSibling, _el$34 = _el$33.firstChild, _el$35 = _el$34.nextSibling, _el$36 = _el$33.nextSibling, _el$37 = _el$36.firstChild, _el$38 = _el$37.nextSibling, _el$39 = _el$36.nextSibling, _el$40 = _el$39.firstChild, _el$41 = _el$40.nextSibling, _el$42 = _el$39.nextSibling, _el$43 = _el$42.firstChild, _el$44 = _el$43.nextSibling, _el$45 = _el$42.nextSibling, _el$46 = _el$45.firstChild, _el$47 = _el$46.nextSibling, _el$48 = _el$47.firstChild, _el$49 = _el$45.nextSibling, _el$50 = _el$49.firstChild, _el$51 = _el$50.nextSibling, _el$52 = _el$21.nextSibling, _el$53 = _el$52.firstChild, _el$54 = _el$53.nextSibling, _el$55 = _el$54.firstChild, _el$56 = _el$55.firstChild, _el$57 = _el$56.firstChild, _el$58 = _el$57.nextSibling, _el$59 = _el$56.nextSibling, _el$60 = _el$59.firstChild, _el$61 = _el$60.nextSibling, _el$62 = _el$59.nextSibling, _el$63 = _el$62.firstChild, _el$64 = _el$63.nextSibling, _el$65 = _el$62.nextSibling, _el$66 = _el$65.firstChild, _el$67 = _el$66.nextSibling, _el$68 = _el$65.nextSibling, _el$69 = _el$68.firstChild, _el$70 = _el$69.nextSibling, _el$71 = _el$68.nextSibling, _el$72 = _el$71.firstChild, _el$73 = _el$72.nextSibling, _el$74 = _el$55.nextSibling, _el$75 = _el$74.firstChild, _el$76 = _el$75.nextSibling, _el$77 = _el$76.firstChild, _el$78 = _el$74.nextSibling, _el$79 = _el$78.firstChild, _el$80 = _el$78.nextSibling, _el$81 = _el$80.firstChild, _el$82 = _el$81.nextSibling, _el$83 = _el$82.nextSibling, _el$84 = _el$83.nextSibling, _el$85 = _el$84.nextSibling, _el$86 = _el$85.nextSibling;
          insert(_el$24, createComponent(Show, {
            get when() {
              return p().batchId;
            },
            get children() {
              var _el$25 = _tmpl$23(), _el$26 = _el$25.firstChild;
              insert(_el$25, () => p().batchId, null);
              return _el$25;
            }
          }), _el$27);
          insert(_el$27, (() => {
            var _c$ = memo(() => p().priority === "high");
            return () => _c$() ? "\u9AD8\u4F18" : p().priority === "medium" ? "\u4E2D\u4F18" : "\u4F4E\u4F18";
          })());
          insert(_el$24, createComponent(For, {
            get each() {
              return p().tags;
            },
            children: (t) => (() => {
              var _el$230 = _tmpl$19();
              insert(_el$230, t);
              return _el$230;
            })()
          }), null);
          insert(_el$32, () => p().assignee ?? "\u672A\u6307\u6D3E");
          insert(_el$35, () => p().createdBy);
          insert(_el$38, () => fmt(p().createdAt));
          insert(_el$41, () => fmt(p().updatedAt));
          insert(_el$44, () => p().dueDate ?? "\u2014");
          insert(_el$47, () => p().dynastyRuleIds.length, _el$48);
          insert(_el$51, () => p().description);
          insert(_el$58, () => p().totalSuspected);
          insert(_el$61, () => p().confirmedCount);
          insert(_el$64, () => p().rejectedCount);
          insert(_el$67, () => p().pendingCount);
          insert(_el$70, () => p().manualCount);
          insert(_el$73, () => p().anomalyCount);
          insert(_el$76, () => Math.round((p().confirmedCount + p().rejectedCount + p().manualCount) / Math.max(1, p().totalSuspected) * 100), _el$77);
          _el$82.$$click = () => updateProjectStatus("draft");
          _el$83.$$click = () => updateProjectStatus("in_review");
          _el$84.$$click = () => updateProjectStatus("reviewed");
          _el$85.$$click = () => updateProjectStatus("exported");
          _el$86.$$click = () => updateProjectStatus("archived");
          createRenderEffect((_p$) => {
            var _v$ = `badge badge-${p().priority}`, _v$2 = p().anomalyCount > 0 ? "#dc2626" : "#16a34a", _v$3 = `${Math.round((p().confirmedCount + p().rejectedCount + p().manualCount) / Math.max(1, p().totalSuspected) * 100)}%`;
            _v$ !== _p$.e && className(_el$27, _p$.e = _v$);
            _v$2 !== _p$.t && setStyleProperty(_el$73, "color", _p$.t = _v$2);
            _v$3 !== _p$.a && setStyleProperty(_el$79, "width", _p$.a = _v$3);
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          });
          return _el$20;
        })(), createComponent(Show, {
          get when() {
            return memo(() => (anomalies() ?? []).filter((a) => !a.resolved).length > 0)() && tab() !== "anomalies";
          },
          get children() {
            var _el$87 = _tmpl$42(), _el$88 = _el$87.firstChild, _el$89 = _el$88.nextSibling, _el$90 = _el$89.firstChild, _el$91 = _el$90.firstChild, _el$93 = _el$91.nextSibling, _el$92 = _el$93.nextSibling, _el$94 = _el$90.nextSibling, _el$95 = _el$89.nextSibling;
            insert(_el$90, () => (anomalies() ?? []).filter((a) => !a.resolved).length, _el$93);
            _el$95.$$click = () => setTab("anomalies");
            return _el$87;
          }
        }), (() => {
          var _el$96 = _tmpl$142(), _el$97 = _el$96.firstChild, _el$98 = _el$97.firstChild, _el$99 = _el$98.firstChild, _el$101 = _el$99.nextSibling, _el$100 = _el$101.nextSibling, _el$102 = _el$98.nextSibling, _el$103 = _el$102.nextSibling, _el$104 = _el$103.firstChild, _el$106 = _el$104.nextSibling, _el$105 = _el$106.nextSibling, _el$107 = _el$103.nextSibling, _el$108 = _el$107.firstChild, _el$110 = _el$108.nextSibling, _el$109 = _el$110.nextSibling, _el$111 = _el$107.nextSibling, _el$112 = _el$111.firstChild, _el$114 = _el$112.nextSibling, _el$113 = _el$114.nextSibling, _el$115 = _el$111.nextSibling, _el$116 = _el$115.firstChild, _el$118 = _el$116.nextSibling, _el$117 = _el$118.nextSibling, _el$119 = _el$115.nextSibling, _el$120 = _el$97.nextSibling, _el$181 = _el$120.nextSibling, _el$182 = _el$181.firstChild, _el$183 = _el$182.nextSibling, _el$184 = _el$183.firstChild, _el$185 = _el$184.nextSibling, _el$186 = _el$185.nextSibling;
          _el$98.$$click = () => setTab("review");
          insert(_el$98, () => repList().length, _el$101);
          _el$102.$$click = () => setTab("compare");
          _el$103.$$click = () => setTab("versions");
          insert(_el$103, () => (versions() ?? []).length, _el$106);
          _el$107.$$click = () => setTab("rules");
          insert(_el$107, () => projRules().length, _el$110);
          _el$111.$$click = () => setTab("annotations");
          insert(_el$111, () => (annotations() ?? []).length, _el$114);
          _el$115.$$click = () => setTab("anomalies");
          insert(_el$115, () => (anomalies() ?? []).filter((a) => !a.resolved).length, _el$118);
          _el$119.$$click = () => setTab("export");
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "review";
            },
            get children() {
              return [(() => {
                var _el$121 = _tmpl$52(), _el$122 = _el$121.firstChild, _el$123 = _el$122.firstChild, _el$124 = _el$123.nextSibling, _el$125 = _el$124.firstChild, _el$126 = _el$122.nextSibling, _el$127 = _el$126.firstChild, _el$130 = _el$127.nextSibling, _el$128 = _el$130.nextSibling, _el$131 = _el$128.nextSibling, _el$129 = _el$131.nextSibling;
                _el$123.addEventListener("change", (e) => setRepStatus(e.currentTarget.value));
                _el$124.addEventListener("change", (e) => setRuleFilter(e.currentTarget.value));
                insert(_el$124, createComponent(For, {
                  get each() {
                    return projRules();
                  },
                  children: (rule) => (() => {
                    var _el$231 = _tmpl$20(), _el$232 = _el$231.firstChild, _el$235 = _el$232.nextSibling, _el$233 = _el$235.nextSibling, _el$236 = _el$233.nextSibling, _el$234 = _el$236.nextSibling;
                    insert(_el$231, () => rule.dynasty, _el$235);
                    insert(_el$231, () => rule.tabooCharacter, _el$236);
                    insert(_el$231, () => rule.replacementCharacter, null);
                    createRenderEffect(() => _el$231.value = rule.id);
                    return _el$231;
                  })()
                }), null);
                insert(_el$126, () => visibleReplacements().length, _el$130);
                insert(_el$126, () => repList().length, _el$131);
                createRenderEffect(() => _el$123.value = repStatus());
                createRenderEffect(() => _el$124.value = ruleFilter());
                return _el$121;
              })(), createComponent(For, {
                get each() {
                  return visibleReplacements();
                },
                get fallback() {
                  return _tmpl$21();
                },
                children: (rep) => {
                  const rule = ruleMap().get(rep.dynastyRuleId);
                  return (() => {
                    var _el$238 = _tmpl$26(), _el$239 = _el$238.firstChild, _el$240 = _el$239.firstChild, _el$241 = _el$240.firstChild, _el$242 = _el$241.nextSibling, _el$243 = _el$242.nextSibling, _el$244 = _el$243.firstChild, _el$245 = _el$244.firstChild, _el$247 = _el$245.nextSibling, _el$246 = _el$247.nextSibling, _el$248 = _el$244.nextSibling, _el$249 = _el$240.nextSibling, _el$250 = _el$249.firstChild, _el$251 = _el$250.nextSibling, _el$252 = _el$251.nextSibling, _el$253 = _el$239.nextSibling, _el$254 = _el$253.firstChild, _el$255 = _el$254.nextSibling, _el$256 = _el$255.nextSibling, _el$257 = _el$253.nextSibling, _el$258 = _el$257.firstChild, _el$259 = _el$258.firstChild, _el$260 = _el$258.nextSibling, _el$261 = _el$260.firstChild, _el$262 = _el$261.nextSibling, _el$264 = _el$262.nextSibling, _el$263 = _el$264.nextSibling, _el$273 = _el$257.nextSibling, _el$274 = _el$273.firstChild, _el$275 = _el$274.firstChild, _el$276 = _el$275.nextSibling, _el$277 = _el$276.nextSibling, _el$278 = _el$277.nextSibling, _el$279 = _el$274.nextSibling, _el$280 = _el$279.firstChild;
                    insert(_el$241, () => rep.id);
                    insert(_el$242, (() => {
                      var _c$2 = memo(() => rep.status === "pending");
                      return () => _c$2() ? "\u5F85\u5BA1" : memo(() => rep.status === "confirmed")() ? "\u5DF2\u786E\u8BA4" : rep.status === "rejected" ? "\u5DF2\u9A73\u56DE" : "\u4EBA\u5DE5\u5224\u5B9A";
                    })());
                    insert(_el$244, () => Math.round(rep.confidence * 100), _el$247);
                    insert(_el$248, () => [1, 2, 3, 4, 5].map((i) => (() => {
                      var _el$283 = _tmpl$13();
                      createRenderEffect(() => className(_el$283, `conf-dot ${rep.confidence >= i * 0.2 ? i <= 2 ? "risk" : i <= 3 ? "warn" : "on" : ""}`));
                      return _el$283;
                    })()));
                    insert(_el$250, () => rep.tabooChar);
                    insert(_el$252, () => rep.replacementChar);
                    insert(_el$254, () => rep.contextBefore);
                    insert(_el$255, () => rep.tabooChar);
                    insert(_el$256, () => rep.contextAfter);
                    insert(_el$258, () => rule ? `[${rule.dynasty}] ${rule.emperor}\uFF08${rule.reignTitle}\uFF09${rule.reason}` : rep.dynastyRuleId, null);
                    insert(_el$260, () => rep.position, _el$264);
                    insert(_el$257, createComponent(Show, {
                      get when() {
                        return rep.reviewedBy;
                      },
                      get children() {
                        var _el$265 = _tmpl$222(), _el$266 = _el$265.firstChild, _el$267 = _el$266.nextSibling;
                        insert(_el$265, () => rep.reviewedBy, _el$267);
                        insert(_el$265, () => fmt(rep.reviewedAt), null);
                        return _el$265;
                      }
                    }), null);
                    insert(_el$257, createComponent(Show, {
                      when: rule,
                      get children() {
                        var _el$268 = _tmpl$232(), _el$269 = _el$268.firstChild, _el$270 = _el$269.nextSibling;
                        insert(_el$270, (() => {
                          var _c$3 = memo(() => rule.severity === "strict");
                          return () => _c$3() ? "\u4E25" : rule.severity === "moderate" ? "\u4E2D" : "\u5BBD";
                        })());
                        createRenderEffect(() => className(_el$270, `badge badge-${rule.severity}`));
                        return _el$268;
                      }
                    }), null);
                    insert(_el$257, createComponent(Show, {
                      when: rule,
                      get children() {
                        var _el$271 = _tmpl$24(), _el$272 = _el$271.firstChild;
                        insert(_el$271, () => rule.sources[0], null);
                        return _el$271;
                      }
                    }), null);
                    _el$275.$$click = () => applyReplacementStatus(rep.id, "confirmed");
                    _el$276.$$click = () => applyReplacementStatus(rep.id, "rejected");
                    _el$277.$$click = () => applyReplacementStatus(rep.id, "manual");
                    _el$278.$$click = () => setShowAnn({
                      open: true,
                      replacementId: rep.id,
                      position: rep.position
                    });
                    _el$280.addEventListener("blur", () => saveNote(rep.id));
                    _el$280.$$input = (e) => setNoteInputs({
                      ...noteInputs(),
                      [rep.id]: e.currentTarget.value
                    });
                    insert(_el$279, createComponent(Show, {
                      get when() {
                        return repNotes()[rep.id];
                      },
                      get children() {
                        var _el$281 = _tmpl$25(), _el$282 = _el$281.firstChild;
                        insert(_el$281, () => repNotes()[rep.id], null);
                        return _el$281;
                      }
                    }), null);
                    createRenderEffect((_p$) => {
                      var _v$1 = `replacement-card status-${rep.status}`, _v$10 = `badge badge-${rep.status}`, _v$11 = rep.status === "confirmed", _v$12 = rep.status === "rejected", _v$13 = rep.status === "manual";
                      _v$1 !== _p$.e && className(_el$238, _p$.e = _v$1);
                      _v$10 !== _p$.t && className(_el$242, _p$.t = _v$10);
                      _v$11 !== _p$.a && (_el$275.disabled = _p$.a = _v$11);
                      _v$12 !== _p$.o && (_el$276.disabled = _p$.o = _v$12);
                      _v$13 !== _p$.i && (_el$277.disabled = _p$.i = _v$13);
                      return _p$;
                    }, {
                      e: void 0,
                      t: void 0,
                      a: void 0,
                      o: void 0,
                      i: void 0
                    });
                    createRenderEffect(() => _el$280.value = noteInputs()[rep.id] ?? "");
                    return _el$238;
                  })();
                }
              })];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "compare";
            },
            get children() {
              return [(() => {
                var _el$132 = _tmpl$62(), _el$133 = _el$132.firstChild, _el$134 = _el$133.nextSibling, _el$135 = _el$134.nextSibling, _el$136 = _el$135.nextSibling, _el$137 = _el$136.nextSibling, _el$138 = _el$137.nextSibling;
                return _el$132;
              })(), (() => {
                var _el$139 = _tmpl$72(), _el$140 = _el$139.firstChild, _el$141 = _el$140.firstChild, _el$142 = _el$141.firstChild, _el$145 = _el$142.nextSibling, _el$143 = _el$145.nextSibling, _el$146 = _el$143.nextSibling, _el$144 = _el$146.nextSibling, _el$147 = _el$141.nextSibling, _el$148 = _el$140.nextSibling, _el$149 = _el$148.firstChild, _el$150 = _el$149.firstChild, _el$152 = _el$150.nextSibling, _el$151 = _el$152.nextSibling, _el$153 = _el$149.nextSibling;
                insert(_el$141, () => p().dynasty, _el$145);
                insert(_el$141, () => p().totalSuspected, _el$146);
                insert(_el$147, () => renderHighlightedText("original"));
                insert(_el$149, () => p().confirmedCount, _el$152);
                insert(_el$153, () => renderHighlightedText("current"));
                return _el$139;
              })(), (() => {
                var _el$154 = _tmpl$82(), _el$155 = _el$154.firstChild, _el$156 = _el$155.nextSibling, _el$157 = _el$156.firstChild, _el$158 = _el$157.firstChild, _el$159 = _el$158.nextSibling;
                insert(_el$159, createComponent(For, {
                  get each() {
                    return repList();
                  },
                  children: (rep) => {
                    const rule = ruleMap().get(rep.dynastyRuleId);
                    return (() => {
                      var _el$284 = _tmpl$29(), _el$285 = _el$284.firstChild, _el$286 = _el$285.nextSibling, _el$287 = _el$286.firstChild, _el$288 = _el$287.nextSibling, _el$289 = _el$288.nextSibling, _el$290 = _el$286.nextSibling, _el$291 = _el$290.nextSibling, _el$292 = _el$291.firstChild, _el$293 = _el$291.nextSibling, _el$294 = _el$293.firstChild, _el$295 = _el$294.nextSibling, _el$296 = _el$295.nextSibling, _el$297 = _el$293.nextSibling;
                      insert(_el$285, () => rep.position);
                      insert(_el$287, () => rep.tabooChar);
                      insert(_el$289, () => rep.replacementChar);
                      insert(_el$290, () => rule ? `[${rule.dynasty}] ${rule.emperor}` : rep.dynastyRuleId);
                      insert(_el$292, (() => {
                        var _c$4 = memo(() => rep.status === "pending");
                        return () => _c$4() ? "\u5F85\u5BA1" : memo(() => rep.status === "confirmed")() ? "\u5DF2\u786E\u8BA4" : rep.status === "rejected" ? "\u5DF2\u9A73\u56DE" : "\u4EBA\u5DE5";
                      })());
                      insert(_el$293, () => rep.contextBefore.slice(-5), _el$295);
                      insert(_el$295, () => rep.tabooChar);
                      insert(_el$293, () => rep.contextAfter.slice(0, 5), _el$296);
                      insert(_el$297, createComponent(Show, {
                        get when() {
                          return rep.note;
                        },
                        get fallback() {
                          return _tmpl$30();
                        },
                        get children() {
                          return [(() => {
                            var _el$298 = _tmpl$27();
                            insert(_el$298, () => rep.note);
                            return _el$298;
                          })(), (() => {
                            var _el$299 = _tmpl$28(), _el$300 = _el$299.firstChild;
                            insert(_el$299, () => rep.reviewedBy, _el$300);
                            insert(_el$299, () => fmt(rep.reviewedAt), null);
                            return _el$299;
                          })()];
                        }
                      }));
                      createRenderEffect(() => className(_el$292, `badge badge-${rep.status}`));
                      return _el$284;
                    })();
                  }
                }));
                return _el$154;
              })()];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "versions";
            },
            get children() {
              return [_tmpl$92(), createComponent(Show, {
                get when() {
                  return (versions() ?? []).length === 0;
                },
                get children() {
                  return _tmpl$02();
                }
              }), (() => {
                var _el$162 = _tmpl$14();
                insert(_el$162, createComponent(For, {
                  get each() {
                    return versions() ?? [];
                  },
                  children: (v, i) => (() => {
                    var _el$302 = _tmpl$322(), _el$303 = _el$302.firstChild, _el$304 = _el$303.firstChild, _el$305 = _el$304.firstChild, _el$306 = _el$305.firstChild, _el$307 = _el$305.nextSibling, _el$310 = _el$304.nextSibling, _el$311 = _el$310.firstChild, _el$312 = _el$303.nextSibling, _el$313 = _el$312.firstChild, _el$314 = _el$313.nextSibling, _el$315 = _el$314.firstChild, _el$316 = _el$315.nextSibling, _el$317 = _el$316.nextSibling, _el$322 = _el$317.nextSibling, _el$318 = _el$322.nextSibling, _el$323 = _el$318.nextSibling, _el$319 = _el$323.nextSibling, _el$324 = _el$319.nextSibling, _el$320 = _el$324.nextSibling, _el$325 = _el$320.nextSibling, _el$321 = _el$325.nextSibling, _el$326 = _el$314.nextSibling, _el$327 = _el$326.firstChild, _el$328 = _el$327.nextSibling, _el$329 = _el$328.nextSibling;
                    insert(_el$305, () => v.versionNumber, null);
                    insert(_el$307, () => v.changeSummary);
                    insert(_el$304, createComponent(Show, {
                      get when() {
                        return v.batchId;
                      },
                      get children() {
                        var _el$308 = _tmpl$31(), _el$309 = _el$308.firstChild;
                        insert(_el$308, () => v.batchId, null);
                        return _el$308;
                      }
                    }), null);
                    insert(_el$310, () => v.createdBy, _el$311);
                    insert(_el$310, () => fmt(v.createdAt), null);
                    insert(_el$313, () => v.comment);
                    insert(_el$316, () => STATUS_LABEL2[v.snapshot.status]);
                    insert(_el$314, () => v.snapshot.confirmedCount, _el$322);
                    insert(_el$314, () => v.snapshot.rejectedCount, _el$323);
                    insert(_el$314, () => v.snapshot.pendingCount, _el$324);
                    insert(_el$314, () => v.snapshot.manualCount, _el$325);
                    insert(_el$314, () => v.snapshot.totalSuspected, null);
                    _el$327.$$click = () => alert(`\u8FD8\u539F v${v.versionNumber}\uFF08\u6F14\u793A\uFF09`);
                    _el$329.$$click = () => alert(`\u4E0E v${v.versionNumber} \u5BF9\u6BD4\uFF08\u6F14\u793A\uFF09`);
                    return _el$302;
                  })()
                }));
                return _el$162;
              })()];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "rules";
            },
            get children() {
              return [(() => {
                var _el$163 = _tmpl$102(), _el$164 = _el$163.firstChild, _el$167 = _el$164.nextSibling, _el$165 = _el$167.nextSibling, _el$166 = _el$165.nextSibling;
                insert(_el$163, () => projRules().length, _el$167);
                _el$166.$$click = () => alert("\u7BA1\u7406\u89C4\u5219\u5E93\uFF08\u6F14\u793A\uFF09");
                return _el$163;
              })(), (() => {
                var _el$168 = _tmpl$112(), _el$169 = _el$168.firstChild, _el$170 = _el$169.firstChild, _el$171 = _el$170.firstChild, _el$172 = _el$171.firstChild, _el$173 = _el$172.nextSibling, _el$174 = _el$173.nextSibling, _el$175 = _el$174.nextSibling, _el$176 = _el$170.nextSibling;
                insert(_el$176, createComponent(For, {
                  get each() {
                    return projRules();
                  },
                  children: (rule) => (() => {
                    var _el$330 = _tmpl$33(), _el$331 = _el$330.firstChild, _el$332 = _el$331.nextSibling, _el$333 = _el$332.firstChild, _el$335 = _el$333.nextSibling, _el$334 = _el$335.nextSibling, _el$336 = _el$332.nextSibling, _el$337 = _el$336.firstChild, _el$338 = _el$337.nextSibling, _el$339 = _el$338.nextSibling, _el$340 = _el$336.nextSibling, _el$341 = _el$340.firstChild, _el$342 = _el$340.nextSibling, _el$343 = _el$342.nextSibling, _el$344 = _el$343.firstChild, _el$345 = _el$343.nextSibling;
                    insert(_el$331, () => rule.dynasty);
                    insert(_el$332, () => rule.emperor, _el$333);
                    insert(_el$332, () => rule.reignTitle, _el$335);
                    insert(_el$337, () => rule.tabooCharacter);
                    insert(_el$339, () => rule.replacementCharacter);
                    insert(_el$341, (() => {
                      var _c$5 = memo(() => rule.severity === "strict");
                      return () => _c$5() ? "\u4E25\u683C" : rule.severity === "moderate" ? "\u4E2D\u5EA6" : "\u5BBD\u677E";
                    })());
                    insert(_el$342, () => rule.reason);
                    insert(_el$343, () => rule.startYear, _el$344);
                    insert(_el$343, () => rule.endYear, null);
                    insert(_el$345, () => rule.sources.join("\uFF1B"));
                    createRenderEffect(() => className(_el$341, `badge badge-${rule.severity}`));
                    return _el$330;
                  })()
                }));
                return _el$168;
              })()];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "annotations";
            },
            get children() {
              return [(() => {
                var _el$177 = _tmpl$122(), _el$178 = _el$177.firstChild, _el$179 = _el$178.nextSibling;
                _el$179.$$click = () => setShowAnn({
                  open: true
                });
                return _el$177;
              })(), createComponent(For, {
                get each() {
                  return annotations() ?? [];
                },
                get fallback() {
                  return _tmpl$34();
                },
                children: (ann) => (() => {
                  var _el$347 = _tmpl$38(), _el$348 = _el$347.firstChild, _el$349 = _el$348.firstChild, _el$350 = _el$349.firstChild, _el$351 = _el$350.nextSibling, _el$356 = _el$349.nextSibling, _el$357 = _el$348.nextSibling;
                  insert(_el$350, () => ann.author);
                  insert(_el$351, (() => {
                    var _c$6 = memo(() => ann.type === "replacement");
                    return () => _c$6() ? "\u66FF\u6362\u8BF4\u660E" : memo(() => ann.type === "comment")() ? "\u7B14\u8BB0" : memo(() => ann.type === "query")() ? "\u7591\u95EE" : ann.type === "reference" ? "\u5F15\u6587" : "\u95EE\u9898";
                  })());
                  insert(_el$349, createComponent(Show, {
                    get when() {
                      return ann.replacementId;
                    },
                    get children() {
                      var _el$352 = _tmpl$35(), _el$353 = _el$352.firstChild, _el$355 = _el$353.nextSibling, _el$354 = _el$355.nextSibling;
                      insert(_el$352, () => ann.replacementId, _el$355);
                      insert(_el$352, () => ann.position, null);
                      return _el$352;
                    }
                  }), null);
                  insert(_el$356, () => fmt(ann.createdAt));
                  insert(_el$357, () => ann.content);
                  insert(_el$347, createComponent(Show, {
                    get when() {
                      return ann.resolved;
                    },
                    get children() {
                      var _el$358 = _tmpl$36(), _el$359 = _el$358.firstChild, _el$361 = _el$359.nextSibling, _el$360 = _el$361.nextSibling;
                      insert(_el$358, () => ann.resolvedBy, _el$361);
                      insert(_el$358, () => fmt(ann.resolvedAt), null);
                      return _el$358;
                    }
                  }), null);
                  insert(_el$347, createComponent(Show, {
                    get when() {
                      return !ann.resolved;
                    },
                    get children() {
                      var _el$362 = _tmpl$37(), _el$363 = _el$362.firstChild;
                      _el$363.$$click = () => resolveAnnotation(ann.id);
                      return _el$362;
                    }
                  }), null);
                  createRenderEffect((_p$) => {
                    var _v$14 = `annotation-card ${ann.resolved ? "resolved" : ""}`, _v$15 = `ann-type-tag ann-type-${ann.type}`;
                    _v$14 !== _p$.e && className(_el$347, _p$.e = _v$14);
                    _v$15 !== _p$.t && className(_el$351, _p$.t = _v$15);
                    return _p$;
                  }, {
                    e: void 0,
                    t: void 0
                  });
                  return _el$347;
                })()
              })];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "anomalies";
            },
            get children() {
              return [_tmpl$132(), createComponent(For, {
                get each() {
                  return anomalies() ?? [];
                },
                get fallback() {
                  return _tmpl$39();
                },
                children: (a) => (() => {
                  var _el$365 = _tmpl$43(), _el$366 = _el$365.firstChild, _el$367 = _el$366.firstChild, _el$368 = _el$367.firstChild, _el$369 = _el$368.nextSibling, _el$371 = _el$367.nextSibling, _el$372 = _el$371.firstChild, _el$373 = _el$366.nextSibling, _el$375 = _el$373.nextSibling, _el$376 = _el$375.firstChild, _el$377 = _el$376.firstChild, _el$378 = _el$376.nextSibling, _el$379 = _el$378.firstChild;
                  insert(_el$368, (() => {
                    var _c$7 = memo(() => a.severity === "critical");
                    return () => _c$7() ? "\u4E25\u91CD" : a.severity === "warning" ? "\u8B66\u544A" : "\u63D0\u793A";
                  })());
                  insert(_el$369, () => a.type);
                  insert(_el$367, createComponent(Show, {
                    get when() {
                      return a.resolved;
                    },
                    get children() {
                      return _tmpl$40();
                    }
                  }), null);
                  insert(_el$371, () => fmt(a.detectedAt), null);
                  insert(_el$373, () => a.description);
                  insert(_el$365, createComponent(Show, {
                    get when() {
                      return a.suggestedAction;
                    },
                    get children() {
                      var _el$374 = _tmpl$41();
                      insert(_el$374, () => a.suggestedAction);
                      return _el$374;
                    }
                  }), _el$375);
                  insert(_el$376, (() => {
                    var _c$8 = memo(() => a.affectedReplacements.length > 0);
                    return () => _c$8() ? a.affectedReplacements.join("\uFF0C") : "\u65E0\u5173\u8054\u6761\u76EE";
                  })(), null);
                  _el$379.$$click = () => alert("\u67E5\u770B\u8BE6\u60C5\uFF08\u6F14\u793A\uFF09");
                  insert(_el$378, createComponent(Show, {
                    get when() {
                      return !a.resolved;
                    },
                    get children() {
                      var _el$380 = _tmpl$422();
                      _el$380.$$click = () => resolveAnomaly(a.id);
                      return _el$380;
                    }
                  }), null);
                  createRenderEffect((_p$) => {
                    var _v$16 = `anomaly-card severity-${a.severity} ${a.resolved ? "resolved" : ""}`, _v$17 = `badge badge-${a.severity}`;
                    _v$16 !== _p$.e && className(_el$365, _p$.e = _v$16);
                    _v$17 !== _p$.t && className(_el$368, _p$.t = _v$17);
                    return _p$;
                  }, {
                    e: void 0,
                    t: void 0
                  });
                  return _el$365;
                })()
              })];
            }
          }), null);
          insert(_el$120, createComponent(Show, {
            get when() {
              return tab() === "export";
            },
            get children() {
              return createComponent(ExportBlock, {
                get project() {
                  return p();
                },
                get replacements() {
                  return repList();
                },
                get rules() {
                  return projRules();
                },
                get annotations() {
                  return annotations() ?? [];
                }
              });
            }
          }), null);
          _el$184.$$click = () => nav("/");
          _el$185.$$click = saveSnapshot;
          _el$186.$$click = () => setTab("export");
          createRenderEffect((_p$) => {
            var _v$4 = `tab ${tab() === "review" ? "active" : ""}`, _v$5 = `tab ${tab() === "compare" ? "active" : ""}`, _v$6 = `tab ${tab() === "versions" ? "active" : ""}`, _v$7 = `tab ${tab() === "rules" ? "active" : ""}`, _v$8 = `tab ${tab() === "annotations" ? "active" : ""}`, _v$9 = `tab ${tab() === "anomalies" ? "active" : ""}`, _v$0 = `tab ${tab() === "export" ? "active" : ""}`;
            _v$4 !== _p$.e && className(_el$98, _p$.e = _v$4);
            _v$5 !== _p$.t && className(_el$102, _p$.t = _v$5);
            _v$6 !== _p$.a && className(_el$103, _p$.a = _v$6);
            _v$7 !== _p$.o && className(_el$107, _p$.o = _v$7);
            _v$8 !== _p$.i && className(_el$111, _p$.i = _v$8);
            _v$9 !== _p$.n && className(_el$115, _p$.n = _v$9);
            _v$0 !== _p$.s && className(_el$119, _p$.s = _v$0);
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0,
            n: void 0,
            s: void 0
          });
          return _el$96;
        })()];
      }
    }), null);
    insert(_el$2, createComponent(Show, {
      get when() {
        return showAnn().open;
      },
      get children() {
        var _el$187 = _tmpl$16(), _el$188 = _el$187.firstChild, _el$189 = _el$188.firstChild, _el$190 = _el$189.firstChild, _el$191 = _el$190.nextSibling, _el$192 = _el$189.nextSibling, _el$199 = _el$192.firstChild, _el$200 = _el$199.firstChild, _el$201 = _el$200.nextSibling, _el$202 = _el$199.nextSibling, _el$203 = _el$202.firstChild, _el$204 = _el$203.nextSibling, _el$205 = _el$202.nextSibling, _el$206 = _el$205.firstChild, _el$207 = _el$206.nextSibling, _el$208 = _el$192.nextSibling, _el$209 = _el$208.firstChild, _el$210 = _el$209.nextSibling;
        _el$187.$$click = () => setShowAnn({
          open: false
        });
        _el$188.$$click = (e) => e.stopPropagation();
        _el$191.$$click = () => setShowAnn({
          open: false
        });
        insert(_el$192, createComponent(Show, {
          get when() {
            return showAnn().replacementId;
          },
          get children() {
            var _el$193 = _tmpl$15(), _el$194 = _el$193.firstChild, _el$197 = _el$194.nextSibling, _el$195 = _el$197.nextSibling, _el$198 = _el$195.nextSibling, _el$196 = _el$198.nextSibling;
            insert(_el$193, () => showAnn().replacementId, _el$197);
            insert(_el$193, () => showAnn().position, _el$198);
            return _el$193;
          }
        }), _el$199);
        _el$201.addEventListener("change", (e) => setAnnForm({
          ...annForm(),
          type: e.currentTarget.value
        }));
        _el$204.$$input = (e) => setAnnForm({
          ...annForm(),
          content: e.currentTarget.value
        });
        _el$207.$$input = (e) => setAnnForm({
          ...annForm(),
          author: e.currentTarget.value
        });
        _el$209.$$click = () => setShowAnn({
          open: false
        });
        _el$210.$$click = submitAnnotation;
        createRenderEffect(() => _el$201.value = annForm().type);
        createRenderEffect(() => _el$204.value = annForm().content);
        createRenderEffect(() => _el$207.value = annForm().author);
        return _el$187;
      }
    }), null);
    insert(_el$2, createComponent(Show, {
      get when() {
        return showSave();
      },
      get children() {
        var _el$211 = _tmpl$17(), _el$212 = _el$211.firstChild, _el$213 = _el$212.firstChild, _el$214 = _el$213.firstChild, _el$215 = _el$214.nextSibling, _el$216 = _el$213.nextSibling, _el$217 = _el$216.firstChild, _el$218 = _el$217.nextSibling, _el$219 = _el$218.firstChild, _el$220 = _el$219.firstChild, _el$224 = _el$220.nextSibling, _el$221 = _el$224.nextSibling, _el$225 = _el$221.nextSibling, _el$222 = _el$225.nextSibling, _el$226 = _el$222.nextSibling, _el$223 = _el$226.nextSibling, _el$227 = _el$216.nextSibling, _el$228 = _el$227.firstChild, _el$229 = _el$228.nextSibling;
        _el$211.$$click = () => setShowSave(false);
        _el$212.$$click = (e) => e.stopPropagation();
        _el$215.$$click = () => setShowSave(false);
        insert(_el$219, () => p()?.confirmedCount, _el$224);
        insert(_el$219, () => p()?.rejectedCount, _el$225);
        insert(_el$219, () => p()?.pendingCount, _el$226);
        insert(_el$219, () => p()?.manualCount, null);
        _el$228.$$click = () => setShowSave(false);
        _el$229.$$click = confirmSnapshot;
        return _el$211;
      }
    }), null);
    return _el$2;
  })();
}
function ExportBlock(props) {
  const {
    project,
    replacements,
    rules,
    annotations
  } = props;
  const [format, setFormat] = createSignal("json");
  const [done, setDone] = createSignal(false);
  const confirmedReps = () => replacements.filter((r) => r.status === "confirmed");
  const rejectedReps = () => replacements.filter((r) => r.status === "rejected");
  const manualReps = () => replacements.filter((r) => r.status === "manual");
  const dynastySet = () => Array.from(new Set(rules.map((r) => r.dynasty)));
  const summaryText = () => {
    const s = `\u3010\u5BA1\u8BFB\u6458\u8981\u3011\u300A${project.textName}\u300B\uFF08${project.dynasty}\uFF09
\u9879\u76EE\uFF1A${project.name} [${project.id}]
\u8D1F\u8D23\u4EBA\uFF1A${project.assignee ?? "\u2014"}   \u521B\u5EFA\uFF1A${project.createdBy}
\u5E95\u672C\u671D\u4EE3\uFF1A${project.dynasty}   \u6E90\u671D\u4EE3\uFF1A${project.sourceDynasty}
\u2500\u2500\u2500\u2500\u2500
\u5BA1\u8BFB\u7EDF\u8BA1\uFF1A
  \u7591\u4F3C\u66FF\u6362\u5B57\u603B\u6570\uFF1A${replacements.length}
  \u5DF2\u786E\u8BA4\u66FF\u6362\uFF1A${confirmedReps().length}
  \u5DF2\u9A73\u56DE\uFF08\u4E0D\u66FF\u6362\uFF09\uFF1A${rejectedReps().length}
  \u5F85\u5BA1\uFF1A${replacements.filter((r) => r.status === "pending").length}
  \u4EBA\u5DE5\u5224\u5B9A\uFF1A${manualReps().length}
  \u6279\u6CE8/\u7B14\u8BB0\uFF1A${annotations.length}
  \u8986\u76D6\u671D\u4EE3\uFF1A${dynastySet().join("\u3001")}
\u2500\u2500\u2500\u2500\u2500
\u66FF\u6362\u660E\u7EC6\uFF1A
${confirmedReps().slice(0, 30).map((r, i) => {
      const rule = rules.find((rr) => rr.id === r.dynastyRuleId);
      return `  ${i + 1}. \u4F4D\u7F6E${r.position}\uFF1A\u300C${r.tabooChar}\u300D\u2192\u300C${r.replacementChar}\u300D[${rule?.dynasty}${rule?.emperor}]`;
    }).join("\n")}
${confirmedReps().length > 30 ? `  \u2026\uFF08\u5171 ${confirmedReps().length} \u6761\uFF0C\u4EC5\u5217\u524D 30 \u6761\uFF09
` : ""}
\u2500\u2500\u2500\u2500\u2500
\u5BA1\u8BFB\u8BF4\u660E\uFF1A${project.description}
`;
    return s;
  };
  const doExport = async () => {
    await fetch("/api/exports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        projectId: project.id,
        exportedBy: "\u5F20\u6821\u52D8",
        format: format(),
        summaryContent: summaryText(),
        stats: {
          totalCharacters: project.originalText.length,
          totalReplacements: replacements.length,
          confirmed: confirmedReps().length,
          rejected: rejectedReps().length,
          manual: manualReps().length,
          annotations: annotations.length,
          dynastiesCovered: dynastySet()
        }
      })
    });
    setDone(true);
    const blob = new Blob([summaryText()], {
      type: "text/plain;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = format() === "json" ? "json" : format() === "csv" ? "csv" : format() === "xml" ? "xml" : "txt";
    a.download = `${project.id}-\u5BA1\u8BFB\u6458\u8981.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (() => {
    var _el$381 = _tmpl$45(), _el$382 = _el$381.firstChild, _el$383 = _el$382.nextSibling, _el$384 = _el$383.firstChild, _el$385 = _el$384.firstChild, _el$386 = _el$385.nextSibling, _el$387 = _el$384.nextSibling, _el$388 = _el$387.firstChild, _el$389 = _el$388.nextSibling, _el$391 = _el$383.nextSibling, _el$392 = _el$391.firstChild, _el$393 = _el$392.firstChild, _el$394 = _el$393.firstChild, _el$395 = _el$393.nextSibling, _el$396 = _el$395.firstChild, _el$397 = _el$396.firstChild, _el$398 = _el$396.nextSibling, _el$399 = _el$398.firstChild, _el$400 = _el$392.nextSibling, _el$401 = _el$400.firstChild, _el$402 = _el$401.firstChild, _el$403 = _el$401.nextSibling, _el$404 = _el$403.firstChild, _el$405 = _el$403.nextSibling, _el$406 = _el$405.firstChild, _el$407 = _el$405.nextSibling, _el$408 = _el$407.firstChild, _el$409 = _el$407.nextSibling, _el$410 = _el$409.firstChild, _el$411 = _el$409.nextSibling, _el$412 = _el$411.firstChild, _el$413 = _el$400.nextSibling;
    _el$386.addEventListener("change", (e) => setFormat(e.currentTarget.value));
    _el$388.$$click = () => {
      navigator.clipboard?.writeText(summaryText());
      alert("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
    };
    _el$389.$$click = doExport;
    insert(_el$381, createComponent(Show, {
      get when() {
        return done();
      },
      get children() {
        return _tmpl$44();
      }
    }), _el$391);
    insert(_el$393, () => project.name, null);
    insert(_el$397, () => project.id);
    insert(_el$398, () => format().toUpperCase(), null);
    insert(_el$402, () => project.originalText.length);
    insert(_el$404, () => replacements.length);
    insert(_el$406, () => confirmedReps().length);
    insert(_el$408, () => rejectedReps().length);
    insert(_el$410, () => manualReps().length);
    insert(_el$412, () => dynastySet().length);
    insert(_el$413, () => summaryText().split("\n").map((line) => (() => {
      var _el$414 = _tmpl$27();
      insert(_el$414, line || "\xA0");
      return _el$414;
    })()));
    createRenderEffect(() => _el$386.value = format());
    return _el$381;
  })();
}
function fmt(s) {
  try {
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}:${ss}`;
  } catch {
    return s;
  }
}
delegateEvents(["click", "input"]);

// src/routes/rules.tsx
var _tmpl$46 = /* @__PURE__ */ template(`<div><div class=page-header><div class=page-title-block><h2>\u{1F4DC} \u671D\u4EE3\u907F\u8BB3\u89C4\u5219\u5E93</h2><p class=subtitle>\u6536\u5F55\u897F\u6C49\u81F3\u6E05\u5386\u4EE3\u5E1D\u738B\u540D\u8BB3\u3001\u907F\u8BB3\u5B57\u53CA\u66FF\u6362\u89C4\u5219\uFF0C\u5171 <!> \u6761</p></div><div class=page-actions><button class="btn btn-default">\u{1F4E5} \u5BFC\u5165\u89C4\u5219</button><button class="btn btn-primary">\uFF0B \u65B0\u589E\u907F\u8BB3\u89C4\u5219</button></div></div><div class=stats-grid></div><div class=filter-panel><div class=filter-row><div class=filter-group><label class=filter-label>\u671D\u4EE3</label><select class=filter-select><option value=all>\u5168\u90E8\u671D\u4EE3</option></select></div><div class=filter-group><label class=filter-label>\u4E25\u5EA6</label><select class=filter-select><option value=all>\u5168\u90E8\u4E25\u5EA6</option><option value=strict>\u4E25\u683C</option><option value=moderate>\u4E2D\u5EA6</option><option value=mild>\u5BBD\u677E</option></select></div><div class=filter-group style="gridColumn:span 3"><label class=filter-label>\u68C0\u7D22\uFF08\u7687\u5E1D / \u540D\u8BB3 / \u5B57 / \u4F9D\u636E\uFF09</label><input type=text class=filter-input placeholder=\u5982\uFF1A\u674E\u4E16\u6C11\u3001\u6C11\u2192\u4EBA\u3001\u9AD8\u7956\u3001\u65E7\u5510\u4E66\u2026></div></div></div><div class=panel><div class=panel-header><h3 class=panel-title>\u907F\u8BB3\u89C4\u5219\u4E00\u89C8\u8868 <span class=panel-meta>\u5171 <!> \u6761</span></h3><div class="small muted">\u53EF\u70B9\u51FB\u671D\u4EE3\u5361\u5FEB\u901F\u7B5B\u9009</div></div><div class=table-wrap><table class=rules-table><thead><tr><th style=width:8%>ID</th><th style=width:9%>\u671D\u4EE3</th><th style=width:14%>\u7687\u5E1D / \u5FA1\u540D</th><th style=width:15%;textAlign:center>\u8BB3\u5B57 \u2192 \u66FF\u6362</th><th style=width:8%;textAlign:center>\u4E25\u5EA6</th><th>\u907F\u8BB3\u7406\u7531</th><th style=width:13%>\u8D77\u8BAB\uFF08\u5E74\uFF09</th><th>\u4F9D\u636E\u5178\u7C4D</th></tr></thead><tbody>`);
var _tmpl$210 = /* @__PURE__ */ template(`<div class=stat-card style=cursor:pointer><div class=stat-label></div><div class=stat-value></div><div class=stat-hint>\u6761\u89C4\u5219`);
var _tmpl$310 = /* @__PURE__ */ template(`<option>`);
var _tmpl$47 = /* @__PURE__ */ template(`<tr><td colspan=8 class=empty-state>\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u89C4\u5219`);
var _tmpl$53 = /* @__PURE__ */ template(`<tr><td class=small style="fontFamily:ui-monospace, monospace"></td><td style=fontWeight:600></td><td>\uFF08<!>\uFF09</td><td style="textAlign:center;fontFamily:SimSun, STSong, serif;fontSize:15"><span style="display:inline-block;padding:1px 10px;background:#fecaca;color:#7f1d1d;borderRadius:4;marginRight:4"></span><span style=color:#9ca3af>\u2192</span><span style="display:inline-block;padding:1px 10px;background:#bbf7d0;color:#14532d;borderRadius:4;marginLeft:4"></span></td><td style=textAlign:center><span></span></td><td class=small></td><td class=small> \uFF5E </td><td class="small muted">`);
var _tmpl$63 = /* @__PURE__ */ template(`<span>`);
function RulesPage() {
  const rules = createAsync(() => fetch("/api/rules").then((r) => r.json()));
  const [dynasty, setDynasty] = createSignal("all");
  const [severity, setSeverity] = createSignal("all");
  const [search, setSearch] = createSignal("");
  const dynastyList = () => Array.from(new Set((rules() ?? []).map((r) => r.dynasty))).sort();
  const filtered = () => {
    let list = rules() ?? [];
    if (dynasty() !== "all") list = list.filter((r) => r.dynasty === dynasty());
    if (severity() !== "all") list = list.filter((r) => r.severity === severity());
    if (search()) {
      const q = search().toLowerCase();
      list = list.filter((r) => r.emperor.toLowerCase().includes(q) || r.reignTitle.includes(q) || r.tabooCharacter.includes(q) || r.replacementCharacter.includes(q) || r.reason.includes(q) || r.sources.some((s) => s.includes(q)));
    }
    return list;
  };
  const statsByDynasty = () => {
    const map = /* @__PURE__ */ new Map();
    for (const r of rules() ?? []) map.set(r.dynasty, (map.get(r.dynasty) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "zh"));
  };
  return (() => {
    var _el$ = _tmpl$46(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$4.nextSibling, _el$6 = _el$5.firstChild, _el$8 = _el$6.nextSibling, _el$7 = _el$8.nextSibling, _el$9 = _el$3.nextSibling, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling, _el$10 = _el$2.nextSibling, _el$11 = _el$10.nextSibling, _el$12 = _el$11.firstChild, _el$13 = _el$12.firstChild, _el$14 = _el$13.firstChild, _el$15 = _el$14.nextSibling, _el$16 = _el$15.firstChild, _el$17 = _el$13.nextSibling, _el$18 = _el$17.firstChild, _el$19 = _el$18.nextSibling, _el$20 = _el$17.nextSibling, _el$21 = _el$20.firstChild, _el$22 = _el$21.nextSibling, _el$23 = _el$11.nextSibling, _el$24 = _el$23.firstChild, _el$25 = _el$24.firstChild, _el$26 = _el$25.firstChild, _el$27 = _el$26.nextSibling, _el$28 = _el$27.firstChild, _el$30 = _el$28.nextSibling, _el$29 = _el$30.nextSibling, _el$31 = _el$24.nextSibling, _el$32 = _el$31.firstChild, _el$33 = _el$32.firstChild, _el$34 = _el$33.firstChild, _el$35 = _el$34.firstChild, _el$36 = _el$35.nextSibling, _el$37 = _el$36.nextSibling, _el$38 = _el$37.nextSibling, _el$39 = _el$38.nextSibling, _el$40 = _el$39.nextSibling, _el$41 = _el$40.nextSibling, _el$42 = _el$33.nextSibling;
    insert(_el$5, () => (rules() ?? []).length, _el$8);
    _el$0.$$click = () => alert("\u5BFC\u5165\u89C4\u5219\u96C6\uFF08\u6F14\u793A\uFF09");
    _el$1.$$click = () => alert("\u65B0\u5EFA\u89C4\u5219\uFF08\u6F14\u793A\uFF09");
    insert(_el$10, createComponent(For, {
      get each() {
        return statsByDynasty();
      },
      children: ([d, c]) => (() => {
        var _el$43 = _tmpl$210(), _el$44 = _el$43.firstChild, _el$45 = _el$44.nextSibling;
        _el$43.$$click = () => setDynasty(d);
        insert(_el$44, d);
        insert(_el$45, c);
        return _el$43;
      })()
    }));
    _el$15.addEventListener("change", (e) => setDynasty(e.currentTarget.value));
    insert(_el$15, createComponent(For, {
      get each() {
        return dynastyList();
      },
      children: (d) => (() => {
        var _el$46 = _tmpl$310();
        _el$46.value = d;
        insert(_el$46, d);
        return _el$46;
      })()
    }), null);
    _el$19.addEventListener("change", (e) => setSeverity(e.currentTarget.value));
    _el$22.$$input = (e) => setSearch(e.currentTarget.value);
    insert(_el$27, () => filtered().length, _el$30);
    insert(_el$42, createComponent(For, {
      get each() {
        return filtered();
      },
      get fallback() {
        return _tmpl$47();
      },
      children: (r) => (() => {
        var _el$48 = _tmpl$53(), _el$49 = _el$48.firstChild, _el$50 = _el$49.nextSibling, _el$51 = _el$50.nextSibling, _el$52 = _el$51.firstChild, _el$54 = _el$52.nextSibling, _el$53 = _el$54.nextSibling, _el$55 = _el$51.nextSibling, _el$56 = _el$55.firstChild, _el$57 = _el$56.nextSibling, _el$58 = _el$57.nextSibling, _el$59 = _el$55.nextSibling, _el$60 = _el$59.firstChild, _el$61 = _el$59.nextSibling, _el$62 = _el$61.nextSibling, _el$63 = _el$62.firstChild, _el$64 = _el$62.nextSibling;
        insert(_el$49, () => r.id);
        insert(_el$50, () => r.dynasty);
        insert(_el$51, () => r.emperor, _el$52);
        insert(_el$51, () => r.reignTitle, _el$54);
        insert(_el$56, () => r.tabooCharacter);
        insert(_el$58, () => r.replacementCharacter);
        insert(_el$60, (() => {
          var _c$ = memo(() => r.severity === "strict");
          return () => _c$() ? "\u4E25\u683C" : r.severity === "moderate" ? "\u4E2D\u5EA6" : "\u5BBD\u677E";
        })());
        insert(_el$61, () => r.reason);
        insert(_el$62, (() => {
          var _c$2 = memo(() => r.startYear < 0);
          return () => _c$2() ? `\u524D${-r.startYear}` : r.startYear;
        })(), _el$63);
        insert(_el$62, (() => {
          var _c$3 = memo(() => r.endYear < 0);
          return () => _c$3() ? `\u524D${-r.endYear}` : r.endYear;
        })(), null);
        insert(_el$64, createComponent(For, {
          get each() {
            return r.sources;
          },
          children: (s, i) => (() => {
            var _el$65 = _tmpl$63();
            insert(_el$65, () => i() > 0 ? "\uFF1B" : "", null);
            insert(_el$65, s, null);
            return _el$65;
          })()
        }));
        createRenderEffect(() => className(_el$60, `badge badge-${r.severity}`));
        return _el$48;
      })()
    }));
    createRenderEffect((_$p) => setStyleProperty(_el$10, "gridTemplateColumns", `repeat(${Math.min(6, statsByDynasty().length)}, 1fr)`));
    createRenderEffect(() => _el$15.value = dynasty());
    createRenderEffect(() => _el$19.value = severity());
    createRenderEffect(() => _el$22.value = search());
    return _el$;
  })();
}
delegateEvents(["click", "input"]);

// src/routes/exports.tsx
var _tmpl$48 = /* @__PURE__ */ template(`<button class="btn btn-sm btn-primary">\u524D\u5F80\u9879\u76EE\u53F0\u8D26 \u2192`);
var _tmpl$211 = /* @__PURE__ */ template(`<div class=panel><div class="panel-body empty-state">\u6682\u65E0\u5BFC\u51FA\u8BB0\u5F55\uFF0C\u53EF\u5728\u9879\u76EE\u8BE6\u60C5\u9875\u5BFC\u51FA\u6458\u8981\u3002<div style=marginTop:10>`);
var _tmpl$311 = /* @__PURE__ */ template(`<div><div class=page-header><div class=page-title-block><h2>\u{1F4E4} \u5BA1\u8BFB\u6458\u8981\u5BFC\u51FA\u8BB0\u5F55</h2><p class=subtitle>\u6240\u6709\u9879\u76EE\u7684\u5386\u53F2\u5BA1\u8BFB\u6458\u8981\u5BFC\u51FA\u4E0E\u6279\u6B21\u5F52\u6863</p></div><div class=page-actions><button class="btn btn-default">\u{1F4E6} \u6279\u91CF\u6253\u5305\u4E0B\u8F7D</button></div></div><div class=filter-panel><div class=filter-row><div class=filter-group><label class=filter-label>\u9879\u76EE</label><select class=filter-select><option value=all>\u5168\u90E8\u9879\u76EE</option></select></div><div class=filter-group><label class=filter-label>\u5BFC\u51FA\u683C\u5F0F</label><select class=filter-select><option value=all>\u5168\u90E8\u683C\u5F0F</option><option value=txt>\u7EAF\u6587\u672C TXT</option><option value=csv>CSV</option><option value=json>JSON</option><option value=xml>XML</option></select></div><div class=filter-group></div><div class=filter-group></div><div class=filter-group>`);
var _tmpl$49 = /* @__PURE__ */ template(`<option> [<!>]`);
var _tmpl$54 = /* @__PURE__ */ template(`<span>\u{1F3F7} \u7248\u672C `);
var _tmpl$64 = /* @__PURE__ */ template(`<button class="btn btn-xs btn-primary">\u6253\u5F00\u9879\u76EE \u2192`);
var _tmpl$73 = /* @__PURE__ */ template(`<div class=panel style=marginBottom:16><div class=panel-header><h3 class=panel-title>\u{1F4C4} </h3><div class=gap-small><span class=tag-chip></span><span class="small muted"></span></div></div><div class=panel-body><div class=export-head style=marginBottom:8><div class=export-meta><span style=marginRight:18>\u{1F4C5} \u5BFC\u51FA\uFF1A</span><span style=marginRight:18>\u{1F464} </span></div><div class=gap-small><button class="btn btn-xs btn-default">\u2B07 \u91CD\u65B0\u4E0B\u8F7D</button><button class="btn btn-xs btn-default">\u{1F4CB} \u590D\u5236</button></div></div><div class=export-stats style=marginBottom:12><div class=export-stat><div class=num></div><div class=lbl>\u603B\u5B57\u6570</div></div><div class=export-stat><div class=num></div><div class=lbl>\u7591\u4F3C\u5B57</div></div><div class=export-stat><div class=num></div><div class=lbl>\u5DF2\u786E\u8BA4</div></div><div class=export-stat><div class=num></div><div class=lbl>\u5DF2\u9A73\u56DE</div></div><div class=export-stat><div class=num></div><div class=lbl>\u4EBA\u5DE5</div></div><div class=export-stat><div class=num></div><div class=lbl>\u6279\u6CE8</div></div></div><div style="background:#fafafa;border:1px solid #e5e7eb;borderRadius:6;padding:12px 16px;fontSize:13;lineHeight:1.8;maxHeight:260;overflow:auto;whiteSpace:pre-wrap;fontFamily:SimSun, STSong, serif"></div><div class="small muted"style=marginTop:8>\u{1F4A1} \u6D89\u53CA\u671D\u4EE3\uFF1A`);
function ExportsPage() {
  const summaries = createAsync(() => fetch("/api/exports").then((r) => r.json()));
  const projects = createAsync(() => fetch("/api/projects").then((r) => r.json()));
  const [format, setFormat] = createSignal("all");
  const [projectId, setProjectId] = createSignal("all");
  const filtered = () => {
    let list = summaries() ?? [];
    if (format() !== "all") list = list.filter((e) => e.format === format());
    if (projectId() !== "all") list = list.filter((e) => e.projectId === projectId());
    return list;
  };
  const projectName = (id) => projects()?.find((p) => p.id === id)?.name ?? id;
  return (() => {
    var _el$ = _tmpl$311(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$4.firstChild, _el$6 = _el$2.nextSibling, _el$7 = _el$6.firstChild, _el$8 = _el$7.firstChild, _el$9 = _el$8.firstChild, _el$0 = _el$9.nextSibling, _el$1 = _el$0.firstChild, _el$10 = _el$8.nextSibling, _el$11 = _el$10.firstChild, _el$12 = _el$11.nextSibling;
    _el$5.$$click = () => alert("\u6279\u91CF\u4E0B\u8F7D\uFF08\u6F14\u793A\uFF09");
    _el$0.addEventListener("change", (e) => setProjectId(e.currentTarget.value));
    insert(_el$0, createComponent(For, {
      get each() {
        return projects() ?? [];
      },
      children: (p) => (() => {
        var _el$18 = _tmpl$49(), _el$19 = _el$18.firstChild, _el$21 = _el$19.nextSibling, _el$20 = _el$21.nextSibling;
        insert(_el$18, () => p.name, _el$19);
        insert(_el$18, () => p.id, _el$21);
        createRenderEffect(() => _el$18.value = p.id);
        return _el$18;
      })()
    }), null);
    _el$12.addEventListener("change", (e) => setFormat(e.currentTarget.value));
    insert(_el$, createComponent(Show, {
      get when() {
        return filtered().length === 0;
      },
      get fallback() {
        return createComponent(For, {
          get each() {
            return filtered();
          },
          children: (exp) => (() => {
            var _el$22 = _tmpl$73(), _el$23 = _el$22.firstChild, _el$24 = _el$23.firstChild, _el$25 = _el$24.firstChild, _el$26 = _el$24.nextSibling, _el$27 = _el$26.firstChild, _el$28 = _el$27.nextSibling, _el$29 = _el$23.nextSibling, _el$30 = _el$29.firstChild, _el$31 = _el$30.firstChild, _el$32 = _el$31.firstChild, _el$33 = _el$32.firstChild, _el$34 = _el$32.nextSibling, _el$35 = _el$34.firstChild, _el$38 = _el$31.nextSibling, _el$39 = _el$38.firstChild, _el$40 = _el$39.nextSibling, _el$42 = _el$30.nextSibling, _el$43 = _el$42.firstChild, _el$44 = _el$43.firstChild, _el$45 = _el$43.nextSibling, _el$46 = _el$45.firstChild, _el$47 = _el$45.nextSibling, _el$48 = _el$47.firstChild, _el$49 = _el$47.nextSibling, _el$50 = _el$49.firstChild, _el$51 = _el$49.nextSibling, _el$52 = _el$51.firstChild, _el$53 = _el$51.nextSibling, _el$54 = _el$53.firstChild, _el$55 = _el$42.nextSibling, _el$56 = _el$55.nextSibling, _el$57 = _el$56.firstChild;
            insert(_el$24, () => projectName(exp.projectId), null);
            insert(_el$27, () => exp.format.toUpperCase());
            insert(_el$28, () => exp.id);
            insert(_el$32, () => fmt2(exp.exportedAt), null);
            insert(_el$34, () => exp.exportedBy, null);
            insert(_el$31, createComponent(Show, {
              get when() {
                return exp.versionId;
              },
              get children() {
                var _el$36 = _tmpl$54(), _el$37 = _el$36.firstChild;
                insert(_el$36, () => exp.versionId, null);
                return _el$36;
              }
            }), null);
            _el$39.$$click = () => {
              const blob = new Blob([exp.summaryContent], {
                type: "text/plain;charset=utf-8"
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${exp.id}-\u6458\u8981.${exp.format}`;
              a.click();
              URL.revokeObjectURL(url);
            };
            _el$40.$$click = () => {
              navigator.clipboard?.writeText(exp.summaryContent);
              alert("\u5DF2\u590D\u5236\u6458\u8981\u5185\u5BB9");
            };
            insert(_el$38, createComponent(A, {
              get href() {
                return `/project/${exp.projectId}`;
              },
              get children() {
                return _tmpl$64();
              }
            }), null);
            insert(_el$44, () => exp.stats.totalCharacters);
            insert(_el$46, () => exp.stats.totalReplacements);
            insert(_el$48, () => exp.stats.confirmed);
            insert(_el$50, () => exp.stats.rejected);
            insert(_el$52, () => exp.stats.manual);
            insert(_el$54, () => exp.stats.annotations);
            insert(_el$55, () => exp.summaryContent);
            insert(_el$56, () => exp.stats.dynastiesCovered.join("\u3001"), null);
            return _el$22;
          })()
        });
      },
      get children() {
        var _el$13 = _tmpl$211(), _el$14 = _el$13.firstChild, _el$15 = _el$14.firstChild, _el$16 = _el$15.nextSibling;
        insert(_el$16, createComponent(A, {
          href: "/",
          get children() {
            return _tmpl$48();
          }
        }));
        return _el$13;
      }
    }), null);
    createRenderEffect(() => _el$0.value = projectId());
    createRenderEffect(() => _el$12.value = format());
    return _el$;
  })();
}
function fmt2(s) {
  try {
    const d = new Date(s);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
  } catch {
    return s;
  }
}
delegateEvents(["click"]);

// src/entry-client.tsx
var _tmpl$50 = /* @__PURE__ */ template(`<div class=app-shell><header class=app-header><div class=header-inner><div class=brand><span class=brand-mark>\u5178</span><div class=brand-text><h1>\u53E4\u7C4D\u907F\u8BB3\u5B57\u66FF\u6362\u5BA1\u8BFB\u5DE5\u5177</h1><p>Ancient Text Taboo Character Review Platform</p></div></div><nav class=header-nav><a href=/ class=nav-link>\u9879\u76EE\u53F0\u8D26</a><a href=/rules class=nav-link>\u671D\u4EE3\u89C4\u5219\u5E93</a><a href=/exports class=nav-link>\u5BFC\u51FA\u8BB0\u5F55</a></nav><div class=header-user><span class=user-avatar>\u5F20</span><span class=user-name>\u5F20\u6821\u52D8</span></div></div></header><main class=app-main></main><footer class=app-footer><p>\xA9 2025 \u53E4\u7C4D\u6587\u732E\u6574\u7406\u7814\u7A76\u5BA4 \xB7 \u7248\u672C v1.0.0`);
render(() => createComponent(Router, {
  root: (props) => createComponent(Suspense, {
    get children() {
      var _el$ = _tmpl$50(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling;
      insert(_el$3, () => props.children);
      return _el$;
    }
  }),
  get children() {
    return [createComponent(Route, {
      path: "/",
      component: ProjectLedger
    }), createComponent(Route, {
      path: "/project/:id",
      component: ProjectDetail
    }), createComponent(Route, {
      path: "/rules",
      component: RulesPage
    }), createComponent(Route, {
      path: "/exports",
      component: ExportsPage
    })];
  }
}), document.getElementById("app"));
//# sourceMappingURL=entry-client.js.map
