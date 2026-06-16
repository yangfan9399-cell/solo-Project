declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: {
      new (data?: ArrayLike<number> | Buffer | null): Database;
    };
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: unknown[]): Database;
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    run(params?: unknown[]): void;
    get(params?: unknown[]): unknown[];
    all(params?: unknown[]): unknown[][];
    free(): boolean;
  }

  function initSqlJs(): Promise<SqlJsStatic>;
  export default initSqlJs;
}
