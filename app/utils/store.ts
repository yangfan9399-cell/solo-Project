import { createContext, useContext } from "react";
import type { Application, ApprovalLog, Document, SubsidyLevel } from "./types";
import { mockApplications } from "./mockData";

class ApplicationStore {
  private applications: Application[] = [...mockApplications];
  private listeners: Set<() => void> = new Set();

  getApplications(): Application[] {
    return this.applications;
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find((app) => app.id === id);
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const index = this.applications.findIndex((app) => app.id === id);
    if (index !== -1) {
      this.applications[index] = {
        ...this.applications[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.notifyListeners();
      return this.applications[index];
    }
    return undefined;
  }

  addApprovalLog(applicationId: string, log: ApprovalLog): Application | undefined {
    const app = this.getApplicationById(applicationId);
    if (app) {
      app.approvalLogs.push(log);
      app.updatedAt = new Date().toISOString();
      this.notifyListeners();
      return app;
    }
    return undefined;
  }

  updateDocument(applicationId: string, documentId: string, updates: Partial<Document>): Application | undefined {
    const app = this.getApplicationById(applicationId);
    if (app) {
      const docIndex = app.documents.findIndex((d) => d.id === documentId);
      if (docIndex !== -1) {
        app.documents[docIndex] = {
          ...app.documents[docIndex],
          ...updates,
        };
        app.updatedAt = new Date().toISOString();
        this.notifyListeners();
        return app;
      }
    }
    return undefined;
  }

  adjustSubsidyLevel(applicationId: string, newLevel: SubsidyLevel, reason: string): Application | undefined {
    const app = this.getApplicationById(applicationId);
    if (app) {
      const oldLevel = app.subsidyLevel;
      app.subsidyLevel = newLevel;
      app.originalLevel = app.originalLevel || oldLevel;
      app.updatedAt = new Date().toISOString();
      this.notifyListeners();
      return app;
    }
    return undefined;
  }

  submitForReview(applicationId: string): Application | undefined {
    return this.updateApplication(applicationId, {
      status: "PENDING_REVIEW",
    });
  }

  approveApplication(applicationId: string): Application | undefined {
    return this.updateApplication(applicationId, {
      status: "APPROVED",
    });
  }

  rejectApplication(applicationId: string): Application | undefined {
    return this.updateApplication(applicationId, {
      status: "REJECTED",
    });
  }

  archiveApplication(applicationId: string, reason: string, finalAmount: number): Application | undefined {
    const app = this.updateApplication(applicationId, {
      status: "ARCHIVED",
      isArchived: true,
      archiveReason: reason,
      archivedAt: new Date().toISOString(),
    });
    if (app) {
      app.archiveRecords.push({
        id: Math.random().toString(36).substring(2, 11),
        conclusion: reason,
        finalAmount,
        archivedBy: "王复核",
        archivedAt: new Date().toISOString(),
      });
      this.notifyListeners();
    }
    return app;
  }

  reopenApplication(applicationId: string, reopenReason: string): Application | undefined {
    const app = this.getApplicationById(applicationId);
    if (app && app.isArchived) {
      const lastArchive = app.archiveRecords[app.archiveRecords.length - 1];
      if (lastArchive) {
        app.reopenRecords.push({
          id: Math.random().toString(36).substring(2, 11),
          reopenReason,
          reopenedBy: "张经办",
          originalConclusion: lastArchive.conclusion,
          originalAmount: lastArchive.finalAmount,
          reopenedAt: new Date().toISOString(),
        });
      }
      app.isArchived = false;
      app.status = "PENDING_HANDLER";
      app.archivedAt = undefined;
      app.archiveReason = undefined;
      app.updatedAt = new Date().toISOString();
      this.notifyListeners();
      return app;
    }
    return undefined;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const applicationStore = new ApplicationStore();

export const StoreContext = createContext<ApplicationStore>(applicationStore);

export function useStore(): ApplicationStore {
  return useContext(StoreContext);
}
