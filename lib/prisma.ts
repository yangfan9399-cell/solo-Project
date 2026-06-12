import { inMemoryDB } from "./in-memory-db";
import { seedInMemoryDB } from "./seed-memory";

let _prismaClient: any = null;
let _usePrisma: boolean = false;
let _checked: boolean = false;
let _seeded: boolean = false;

async function tryLoadPrisma(): Promise<boolean> {
  if (_checked) return _usePrisma;
  _checked = true;
  try {
    const { PrismaClient } = require("@prisma/client");
    const p = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    });
    await p.$connect();
    _prismaClient = p;
    _usePrisma = true;
    console.info("[prisma.ts] 连接到真实 PostgreSQL 数据库");
    return true;
  } catch (err: any) {
    console.warn(
      "[prisma.ts] Prisma 不可用（引擎加载失败或无数据库），降级到内存数据层。"
    );
    console.warn("[prisma.ts] 错误详情:", err?.message || String(err));
    if (err?.stack) console.warn("[prisma.ts] 堆栈:", err.stack.slice(0, 800));
    _usePrisma = false;
    return false;
  }
}

function buildFallbackPrisma(db: typeof inMemoryDB): any {
  return {
    $connect: async () => {},
    $disconnect: async () => {},
    user: {
      upsert: async (args: any) => db.userUpsert(args),
    },
    dispatchOrder: {
      findMany: async (args?: any) => db.orderFindMany(args),
      findUnique: async (args: any) => db.orderFindUnique(args),
      groupBy: async (args: any) => db.orderGroupBy(args),
      update: async (args: any) => db.orderUpdate(args),
      create: async (args: { data: any }) => db.orderCreate(args.data),
    },
    orderNode: {
      create: async (args: { data: any }) => db.nodeCreate(args.data),
    },
    orderAttachment: {
      createMany: async (args: { data: any[] }) =>
        db.attachmentCreateMany(args),
    },
    fieldDifference: {
      createMany: async (args: { data: any[] }) =>
        db.differenceCreateMany(args),
      create: async (args: { data: any }) => db.differenceCreate(args.data),
    },
    reviewRecord: {
      create: async (args: { data: any }) => db.reviewRecordCreate(args.data),
    },
  };
}

let _fallback: any = null;

async function getClient(): Promise<any> {
  await tryLoadPrisma();
  if (_usePrisma) return _prismaClient;
  if (!_fallback) {
    _fallback = buildFallbackPrisma(inMemoryDB);
    if (!_seeded) {
      try {
        seedInMemoryDB(inMemoryDB);
        console.info("[prisma.ts] 内存数据层 - 已载入4类样本+1个待受理样本");
      } catch (e: any) {
        console.error("[prisma.ts] 种子数据失败:", e?.message || e);
      }
      _seeded = true;
    }
  }
  return _fallback;
}

function makeLazyProxy(accessPath: string[]): any {
  return new Proxy(function () {} as any, {
    async apply(_target, _thisArg, args) {
      const client = await getClient();
      let cursor: any = client;
      for (let i = 0; i < accessPath.length - 1; i++) {
        cursor = cursor[accessPath[i]];
      }
      const methodName = accessPath[accessPath.length - 1];
      if (typeof cursor[methodName] !== "function") {
        throw new Error(
          `prisma.${accessPath.join(".")} is not a function`
        );
      }
      return cursor[methodName](...args);
    },
    get(_target, prop, _receiver) {
      if (typeof prop === "symbol" || prop === "then" || prop === "catch") {
        return undefined;
      }
      return makeLazyProxy([...accessPath, String(prop)]);
    },
  });
}

export const prisma: any = makeLazyProxy([]);

export function getRawDB(): typeof inMemoryDB {
  return inMemoryDB;
}

export const useInMemoryFallback = () => !_usePrisma;
