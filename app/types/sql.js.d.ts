declare module "sql.js" {
  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: any[]): Database;
    exec(sql: string, params?: any[]): QueryResults[];
    each(sql: string, params: any[], callback: (row: any) => void, done: () => void): void;
    prepare(sql: string, params?: any[]): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
    create_function(name: string, func: (...args: any[]) => any): Database;
  }

  export interface Statement {
    bind(params?: any[]): boolean;
    step(): boolean;
    get(params?: any[]): any[];
    getColumnNames(): string[];
    getAsObject(params?: any[]): any;
    run(params?: any[]): void;
    reset(): void;
    free(): boolean;
  }

  export interface QueryResults {
    columns: string[];
    values: any[][];
  }

  export interface SqlJsConfig {
    locateFile?: (filename: string) => string;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
