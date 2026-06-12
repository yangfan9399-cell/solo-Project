import { writable, derived, get } from 'svelte/store';
import type { RecordWithRelations, StatisticsData } from '$lib/types';
import { RecordStatus, RecordType } from '$lib/types';

interface RecordState {
  records: RecordWithRelations[];
  statistics: StatisticsData | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: string;
    type: string;
    venue: string;
    search: string;
  };
  currentUser: {
    id: string;
    name: string;
    role: string;
    employeeId: string;
  } | null;
}

const initialState: RecordState = {
  records: [],
  statistics: null,
  loading: false,
  error: null,
  filters: {
    status: 'ALL',
    type: 'ALL',
    venue: 'ALL',
    search: ''
  },
  currentUser: null
};

function createRecordStore() {
  const { subscribe, set, update } = writable<RecordState>(initialState);

  return {
    subscribe,

    setCurrentUser(user: { id: string; name: string; role: string; employeeId: string }) {
      update(state => ({ ...state, currentUser: user }));
    },

    setRecords(records: RecordWithRelations[]) {
      update(state => ({ ...state, records, loading: false, error: null }));
    },

    setStatistics(stats: StatisticsData) {
      update(state => ({ ...state, statistics: stats }));
    },

    updateRecord(updatedRecord: RecordWithRelations) {
      update(state => {
        const records = state.records.map(r =>
          r.id === updatedRecord.id ? updatedRecord : r
        );
        const stats = recalculateStatistics(records);
        return { ...state, records, statistics: stats };
      });
    },

    addRecord(newRecord: RecordWithRelations) {
      update(state => {
        const records = [newRecord, ...state.records];
        const stats = recalculateStatistics(records);
        return { ...state, records, statistics: stats };
      });
    },

    setFilters(filters: Partial<RecordState['filters']>) {
      update(state => ({
        ...state,
        filters: { ...state.filters, ...filters }
      }));
    },

    setLoading(loading: boolean) {
      update(state => ({ ...state, loading }));
    },

    setError(error: string | null) {
      update(state => ({ ...state, error, loading: false }));
    },

    async fetchRecords() {
      const state = get(this);
      update(s => ({ ...s, loading: true }));

      try {
        const params = new URLSearchParams();
        if (state.filters.status && state.filters.status !== 'ALL') {
          params.set('status', state.filters.status);
        }
        if (state.filters.type && state.filters.type !== 'ALL') {
          params.set('type', state.filters.type);
        }
        if (state.filters.venue && state.filters.venue !== 'ALL') {
          params.set('venue', state.filters.venue);
        }
        if (state.filters.search) {
          params.set('search', state.filters.search);
        }
        params.set('includeStats', 'true');

        const response = await fetch(`/api/records?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch records');

        const data = await response.json();
        update(s => ({
          ...s,
          records: data.records,
          statistics: data.statistics,
          loading: false,
          error: null
        }));
      } catch (e) {
        update(s => ({
          ...s,
          error: e instanceof Error ? e.message : 'Unknown error',
          loading: false
        }));
      }
    },

    async fetchRecordById(id: string): Promise<RecordWithRelations | null> {
      try {
        const response = await fetch(`/api/records/${id}`);
        if (!response.ok) throw new Error('Failed to fetch record');

        const record = await response.json();
        this.updateRecord(record);
        return record;
      } catch (e) {
        console.error('Error fetching record:', e);
        return null;
      }
    },

    async processRecord(recordId: string, action: any): Promise<RecordWithRelations | null> {
      const state = get(this);
      if (!state.currentUser) throw new Error('No current user');

      try {
        const response = await fetch(`/api/records/${recordId}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handlerId: state.currentUser.id,
            action
          })
        });

        if (!response.ok) throw new Error('Failed to process record');

        const updatedRecord = await response.json();
        this.updateRecord(updatedRecord);
        return updatedRecord;
      } catch (e) {
        console.error('Error processing record:', e);
        throw e;
      }
    },

    async reviewRecord(recordId: string, action: any): Promise<RecordWithRelations | null> {
      const state = get(this);
      if (!state.currentUser) throw new Error('No current user');

      try {
        const response = await fetch(`/api/records/${recordId}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewerId: state.currentUser.id,
            action
          })
        });

        if (!response.ok) throw new Error('Failed to review record');

        const updatedRecord = await response.json();
        this.updateRecord(updatedRecord);
        return updatedRecord;
      } catch (e) {
        console.error('Error reviewing record:', e);
        throw e;
      }
    },

    async reprocessRecord(recordId: string, reason: string): Promise<RecordWithRelations | null> {
      const state = get(this);
      if (!state.currentUser) throw new Error('No current user');

      try {
        const response = await fetch(`/api/records/${recordId}/reprocess`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handlerId: state.currentUser.id,
            reason
          })
        });

        if (!response.ok) throw new Error('Failed to reprocess record');

        const updatedRecord = await response.json();
        this.updateRecord(updatedRecord);
        return updatedRecord;
      } catch (e) {
        console.error('Error reprocessing record:', e);
        throw e;
      }
    }
  };
}

function recalculateStatistics(records: RecordWithRelations[]): StatisticsData {
  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const byVenue: Record<string, number> = {};
  let totalAmount = 0;
  let exceptionCount = 0;
  let totalProcessingTime = 0;
  let completedCount = 0;

  for (const record of records) {
    byStatus[record.status] = (byStatus[record.status] || 0) + 1;
    byType[record.type] = (byType[record.type] || 0) + 1;
    if (record.venue) {
      byVenue[record.venue] = (byVenue[record.venue] || 0) + 1;
    }
    totalAmount += Number(record.amount);
    if (record.type !== RecordType.NORMAL_DELIVERY) {
      exceptionCount++;
    }
    if (record.status === RecordStatus.ARCHIVED && record.nodes.length >= 2) {
      const firstNode = record.nodes[0];
      const lastNode = record.nodes[record.nodes.length - 1];
      const processingTime = lastNode.createdAt.getTime() - firstNode.createdAt.getTime();
      totalProcessingTime += processingTime;
      completedCount++;
    }
  }

  return {
    total: records.length,
    byStatus,
    byType,
    byVenue,
    totalAmount,
    exceptionCount,
    archivedCount: byStatus[RecordStatus.ARCHIVED] || 0,
    processingCount: byStatus[RecordStatus.PROCESSING] || 0,
    reviewingCount: byStatus[RecordStatus.REVIEWING] || 0,
    averageProcessingTime: completedCount > 0 ? totalProcessingTime / completedCount : 0
  };
}

export const recordStore = createRecordStore();

export const filteredRecords = derived(recordStore, $store => {
  let records = $store.records;

  if ($store.filters.status && $store.filters.status !== 'ALL') {
    records = records.filter(r => r.status === $store.filters.status);
  }
  if ($store.filters.type && $store.filters.type !== 'ALL') {
    records = records.filter(r => r.type === $store.filters.type);
  }
  if ($store.filters.venue && $store.filters.venue !== 'ALL') {
    records = records.filter(r => r.venue.includes($store.filters.venue));
  }
  if ($store.filters.search) {
    const search = $store.filters.search.toLowerCase();
    records = records.filter(r =>
      r.title.toLowerCase().includes(search) ||
      r.recordNo.toLowerCase().includes(search) ||
      r.eventName.toLowerCase().includes(search)
    );
  }

  return records;
});

export const venues = derived(recordStore, $store => {
  const venueSet = new Set($store.records.map(r => r.venue).filter(Boolean));
  return Array.from(venueSet);
});
