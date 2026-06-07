'use client';

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type {
  Child,
  Authorization,
  PickupRecord,
  PickupHistoryNode,
  AuthorizationHistory,
  PickupStatus,
  ExceptionReason,
} from '@/types';
import {
  mockChildren,
  mockAuthorizations,
  mockPickupRecords,
  mockPickupHistoryNodes,
  mockAuthorizationHistories,
} from '@/lib/mockData';

interface AppState {
  children: Child[];
  authorizations: Authorization[];
  pickupRecords: PickupRecord[];
  pickupHistoryNodes: PickupHistoryNode[];
  authorizationHistories: AuthorizationHistory[];
}

type Action =
  | { type: 'ADD_AUTHORIZATION'; payload: Authorization }
  | { type: 'DEACTIVATE_AUTHORIZATION'; payload: { id: string; operator: string } }
  | { type: 'ADD_AUTH_HISTORY'; payload: AuthorizationHistory }
  | { type: 'ADD_PICKUP_RECORD'; payload: PickupRecord }
  | { type: 'UPDATE_PICKUP_RECORD'; payload: PickupRecord }
  | { type: 'ADD_HISTORY_NODE'; payload: PickupHistoryNode }
  | { type: 'VERIFY_PICKUP'; payload: { id: string; status: PickupStatus; guard: string; exceptionReason?: ExceptionReason; exceptionRemark?: string } }
  | { type: 'PRINCIPAL_REVIEW'; payload: { id: string; decision: PickupStatus; principal: string; remark: string } }
  | { type: 'RESET_STATE' };

const STORAGE_KEY = 'kindergarten_pickup_state';

const initialState: AppState = {
  children: mockChildren,
  authorizations: mockAuthorizations,
  pickupRecords: mockPickupRecords,
  pickupHistoryNodes: mockPickupHistoryNodes,
  authorizationHistories: mockAuthorizationHistories,
};

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_AUTHORIZATION': {
      return {
        ...state,
        authorizations: [...state.authorizations, action.payload],
      };
    }

    case 'DEACTIVATE_AUTHORIZATION': {
      const { id, operator } = action.payload;
      const updatedAuths = state.authorizations.map((auth) =>
        auth.id === id ? { ...auth, isActive: false } : auth
      );

      const auth = state.authorizations.find((a) => a.id === id);
      const newHistories: AuthorizationHistory[] = auth
        ? [{
            id: generateId('auth-hist'),
            authorizationId: id,
            action: 'DEACTIVATE',
            operator,
            operatorRole: 'TEACHER',
            description: '停用授权',
            timestamp: new Date().toISOString(),
          }]
        : [];

      return {
        ...state,
        authorizations: updatedAuths,
        authorizationHistories: [...state.authorizationHistories, ...newHistories],
      };
    }

    case 'ADD_AUTH_HISTORY': {
      return {
        ...state,
        authorizationHistories: [...state.authorizationHistories, action.payload],
      };
    }

    case 'ADD_PICKUP_RECORD': {
      return {
        ...state,
        pickupRecords: [...state.pickupRecords, action.payload],
      };
    }

    case 'UPDATE_PICKUP_RECORD': {
      return {
        ...state,
        pickupRecords: state.pickupRecords.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    }

    case 'ADD_HISTORY_NODE': {
      return {
        ...state,
        pickupHistoryNodes: [...state.pickupHistoryNodes, action.payload],
      };
    }

    case 'VERIFY_PICKUP': {
      const { id, status, guard, exceptionReason, exceptionRemark } = action.payload;
      const now = new Date().toISOString();

      const updatedRecord = state.pickupRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              guardVerifiedBy: guard,
              verifiedAt: now,
              exceptionReason: exceptionReason || r.exceptionReason,
              exceptionRemark: exceptionRemark || r.exceptionRemark,
              updatedAt: now,
            }
          : r
      );

      let nodeDescription = '';
      let nodeType = '';

      if (status === 'VERIFIED') {
        nodeDescription = '门岗核验通过，身份信息一致';
        nodeType = 'VERIFY';
      } else if (status === 'BLOCKED') {
        nodeDescription = `门岗核验异常：${exceptionReason ? getExceptionReasonText(exceptionReason) : '未知原因'}，已阻断放行`;
        nodeType = 'BLOCK';
      } else {
        nodeDescription = `门岗核验异常，已上报园长：${exceptionReason ? getExceptionReasonText(exceptionReason) : '未知原因'}`;
        nodeType = 'EXCEPTION';
      }

      const newNode: PickupHistoryNode = {
        id: generateId('node'),
        pickupRecordId: id,
        nodeType,
        operator: guard,
        operatorRole: 'GUARD',
        description: nodeDescription,
        timestamp: now,
      };

      const result = {
        ...state,
        pickupRecords: updatedRecord as PickupRecord[],
        pickupHistoryNodes: [...state.pickupHistoryNodes, newNode],
      };

      if (status === 'BLOCKED' && exceptionReason === 'ID_MISMATCH') {
        const child = state.children.find(
          (c) => c.id === (updatedRecord.find((r: PickupRecord) => r.id === id)?.childId || '')
        );
        if (child) {
          const contactNode: PickupHistoryNode = {
            id: generateId('node'),
            pickupRecordId: id,
            nodeType: 'NOTIFY_GUARDIAN',
            operator: guard,
            operatorRole: 'GUARD',
            description: `已通知主监护人 ${child.primaryGuardianName}（${child.primaryGuardianPhone}）前来处理`,
            timestamp: new Date(Date.now() + 1000).toISOString(),
          };
          result.pickupHistoryNodes = [...result.pickupHistoryNodes, contactNode];
        }
      }

      return result;
    }

    case 'PRINCIPAL_REVIEW': {
      const { id, decision, principal, remark } = action.payload;
      const record = state.pickupRecords.find((r) => r.id === id);

      if (!record || record.status !== 'PENDING_PRINCIPAL') {
        return state;
      }

      const now = new Date().toISOString();

      const updatedRecords = state.pickupRecords.map((r) =>
        r.id === id
          ? {
              ...r,
              status: decision,
              principalReviewBy: principal,
              principalReviewAt: now,
              principalDecision: decision,
              principalRemark: remark,
              updatedAt: now,
            }
          : r
      );

      const newNode: PickupHistoryNode = {
        id: generateId('node'),
        pickupRecordId: id,
        nodeType: 'PRINCIPAL_REVIEW',
        operator: principal,
        operatorRole: 'PRINCIPAL',
        description: `园长复核：${decision === 'EXCEPTION_APPROVED' ? '同意异常放行' : '驳回申请'}`,
        timestamp: now,
      };

      const result = {
        ...state,
        pickupRecords: updatedRecords,
        pickupHistoryNodes: [...state.pickupHistoryNodes, newNode],
      };

      if (decision === 'EXCEPTION_APPROVED') {
        const completeNode: PickupHistoryNode = {
          id: generateId('node'),
          pickupRecordId: id,
          nodeType: 'COMPLETE',
          operator: '系统',
          operatorRole: 'GUARD',
          description: '异常放行完成，孩子已接走',
          timestamp: new Date(Date.now() + 2000).toISOString(),
        };
        result.pickupHistoryNodes = [...result.pickupHistoryNodes, completeNode];
      }

      return result;
    }

    case 'RESET_STATE': {
      return initialState;
    }

    default:
      return state;
  }
}

function getExceptionReasonText(reason: ExceptionReason): string {
  const map: Record<ExceptionReason, string> = {
    ID_MISMATCH: '证件不符',
    PARENT_DISPUTE: '家长争议',
    NO_AUTHORIZATION: '无授权记录',
    EXPIRED_AUTHORIZATION: '授权过期',
    OTHER: '其他原因',
  };
  return map[reason] || '未知原因';
}

function loadFromStorage(): AppState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return null;
}

function saveToStorage(state: AppState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getChildById: (id: string) => Child | undefined;
  getAuthorizationById: (id: string) => Authorization | undefined;
  getAuthorizationsByChildId: (childId: string) => Authorization[];
  getPickupRecordById: (id: string) => PickupRecord | undefined;
  getPickupRecordWithDetails: (
    id: string
  ) =>
    | (PickupRecord & {
        child?: Child;
        authorization?: Authorization;
        historyNodes: PickupHistoryNode[];
      })
    | undefined;
  getHistoryNodesByRecordId: (recordId: string) => PickupHistoryNode[];
  addAuthorization: (data: Omit<Authorization, 'id' | 'registeredAt'>) => void;
  deactivateAuthorization: (id: string, operator: string) => void;
  verifyPickup: (
    id: string,
    status: PickupStatus,
    guard: string,
    exceptionReason?: ExceptionReason,
    exceptionRemark?: string
  ) => void;
  principalReview: (
    id: string,
    decision: PickupStatus,
    principal: string,
    remark: string
  ) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    if (typeof window !== 'undefined') {
      const stored = loadFromStorage();
      return stored || initial;
    }
    return initial;
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const getChildById = (id: string) => state.children.find((c) => c.id === id);

  const getAuthorizationById = (id: string) =>
    state.authorizations.find((a) => a.id === id);

  const getAuthorizationsByChildId = (childId: string) =>
    state.authorizations.filter((a) => a.childId === childId);

  const getPickupRecordById = (id: string) =>
    state.pickupRecords.find((r) => r.id === id);

  const getPickupRecordWithDetails = (id: string) => {
    const record = getPickupRecordById(id);
    if (!record) return undefined;
    return {
      ...record,
      child: getChildById(record.childId),
      authorization: record.authorizationId
        ? getAuthorizationById(record.authorizationId)
        : undefined,
      historyNodes: getHistoryNodesByRecordId(id),
    };
  };

  const getHistoryNodesByRecordId = (recordId: string) =>
    state.pickupHistoryNodes
      .filter((n) => n.pickupRecordId === recordId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

  const addAuthorization = (
    data: Omit<Authorization, 'id' | 'registeredAt'>
  ) => {
    const newAuth: Authorization = {
      ...data,
      id: generateId('auth'),
      registeredAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AUTHORIZATION', payload: newAuth });

    const history: AuthorizationHistory = {
      id: generateId('auth-hist'),
      authorizationId: newAuth.id,
      action: 'CREATE',
      operator: data.registeredBy,
      operatorRole: 'TEACHER',
      description: `登记新${data.type === 'PRIMARY' ? '主' : data.type === 'TEMPORARY' ? '临时' : '紧急'}授权`,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_AUTH_HISTORY', payload: history });
  };

  const deactivateAuthorization = (id: string, operator: string) => {
    dispatch({
      type: 'DEACTIVATE_AUTHORIZATION',
      payload: { id, operator },
    });
  };

  const verifyPickup = (
    id: string,
    status: PickupStatus,
    guard: string,
    exceptionReason?: ExceptionReason,
    exceptionRemark?: string
  ) => {
    dispatch({
      type: 'VERIFY_PICKUP',
      payload: { id, status, guard, exceptionReason, exceptionRemark },
    });
  };

  const principalReview = (
    id: string,
    decision: PickupStatus,
    principal: string,
    remark: string
  ) => {
    dispatch({
      type: 'PRINCIPAL_REVIEW',
      payload: { id, decision, principal, remark },
    });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        getChildById,
        getAuthorizationById,
        getAuthorizationsByChildId,
        getPickupRecordById,
        getPickupRecordWithDetails,
        getHistoryNodesByRecordId,
        addAuthorization,
        deactivateAuthorization,
        verifyPickup,
        principalReview,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
