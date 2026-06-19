const db = {
  pragma: () => {},
  exec: () => {},
  prepare: () => ({
    run: () => ({}),
    get: () => null,
    all: () => [],
  }),
}

export default db
