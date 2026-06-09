import {
  hospitalizations as initialHospitalizations,
  pets as initialPets,
  owners as initialOwners,
  departments as initialDepartments,
  staffList as initialStaffList,
  medicalOrders as initialMedicalOrders,
  nursingRecords as initialNursingRecords,
  feeItems as initialFeeItems,
  feeReviews as initialFeeReviews,
  type Hospitalization,
  type Pet,
  type Owner,
  type MedicalOrder,
  type NursingRecord,
  type FeeItem,
  type FeeReview,
} from "./mockData";

class DataStore {
  private hospitalizations: Hospitalization[];
  private pets: Pet[];
  private owners: Owner[];
  private medicalOrders: MedicalOrder[];
  private nursingRecords: NursingRecord[];
  private feeItems: FeeItem[];
  private feeReviews: FeeReview[];
  private departments = initialDepartments;
  private staffList = initialStaffList;
  private idCounter = 1000;

  constructor() {
    this.hospitalizations = [...initialHospitalizations];
    this.pets = [...initialPets];
    this.owners = [...initialOwners];
    this.medicalOrders = [...initialMedicalOrders];
    this.nursingRecords = [...initialNursingRecords];
    this.feeItems = [...initialFeeItems];
    this.feeReviews = [...initialFeeReviews];
  }

  private genId(prefix: string) {
    return `${prefix}_${++this.idCounter}`;
  }

  getHospitalizations() {
    return [...this.hospitalizations];
  }

  getHospitalizationById(id: string) {
    return this.hospitalizations.find((h) => h.id === id) || null;
  }

  addHospitalization(data: Omit<Hospitalization, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newHosp: Hospitalization = {
      ...data,
      id: this.genId("hosp"),
      createdAt: now,
      updatedAt: now,
    };
    this.hospitalizations.unshift(newHosp);
    return newHosp;
  }

  updateHospitalization(id: string, data: Partial<Hospitalization>) {
    const index = this.hospitalizations.findIndex((h) => h.id === id);
    if (index === -1) return null;
    this.hospitalizations[index] = {
      ...this.hospitalizations[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.hospitalizations[index];
  }

  getPetById(id: string) {
    return this.pets.find((p) => p.id === id) || null;
  }

  addPet(data: Omit<Pet, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newPet: Pet = {
      ...data,
      id: this.genId("pet"),
      createdAt: now,
      updatedAt: now,
    };
    this.pets.push(newPet);
    return newPet;
  }

  getOwnerById(id: string) {
    return this.owners.find((o) => o.id === id) || null;
  }

  addOwner(data: Omit<Owner, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newOwner: Owner = {
      ...data,
      id: this.genId("owner"),
      createdAt: now,
      updatedAt: now,
    };
    this.owners.push(newOwner);
    return newOwner;
  }

  getDepartments() {
    return [...this.departments];
  }

  getStaffList() {
    return [...this.staffList];
  }

  getStaffById(id: string) {
    return this.staffList.find((s) => s.id === id) || null;
  }

  getMedicalOrdersByHospitalization(hospitalizationId: string) {
    return this.medicalOrders
      .filter((o) => o.hospitalizationId === hospitalizationId)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  addMedicalOrder(data: Omit<MedicalOrder, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newOrder: MedicalOrder = {
      ...data,
      id: this.genId("order"),
      createdAt: now,
      updatedAt: now,
    };
    this.medicalOrders.push(newOrder);
    return newOrder;
  }

  updateMedicalOrder(id: string, data: Partial<MedicalOrder>) {
    const index = this.medicalOrders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    this.medicalOrders[index] = {
      ...this.medicalOrders[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.medicalOrders[index];
  }

  getNursingRecordsByHospitalization(hospitalizationId: string) {
    return this.nursingRecords
      .filter((r) => r.hospitalizationId === hospitalizationId)
      .sort((a, b) => b.recordTime.getTime() - a.recordTime.getTime());
  }

  addNursingRecord(data: Omit<NursingRecord, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newRecord: NursingRecord = {
      ...data,
      id: this.genId("nurse"),
      createdAt: now,
      updatedAt: now,
    };
    this.nursingRecords.push(newRecord);

    if (data.isAbnormal) {
      const hosp = this.getHospitalizationById(data.hospitalizationId);
      if (hosp && hosp.anomalyType === "NONE") {
        this.updateHospitalization(data.hospitalizationId, {
          anomalyType: "NURSING_ABNORMAL",
        });
      }
    }

    return newRecord;
  }

  getFeeItemsByHospitalization(hospitalizationId: string) {
    return this.feeItems
      .filter((f) => f.hospitalizationId === hospitalizationId)
      .sort((a, b) => b.recordDate.getTime() - a.recordDate.getTime());
  }

  addFeeItem(data: Omit<FeeItem, "id" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const newFee: FeeItem = {
      ...data,
      id: this.genId("fee"),
      createdAt: now,
      updatedAt: now,
    };
    this.feeItems.push(newFee);
    return newFee;
  }

  updateFeeItem(id: string, data: Partial<FeeItem>) {
    const index = this.feeItems.findIndex((f) => f.id === id);
    if (index === -1) return null;
    this.feeItems[index] = {
      ...this.feeItems[index],
      ...data,
      updatedAt: new Date(),
    };

    const item = this.feeItems[index];

    if (data.status === "DISPUTED") {
      const hosp = this.getHospitalizationById(item.hospitalizationId);
      if (hosp) {
        this.updateHospitalization(item.hospitalizationId, {
          anomalyType: "FEE_DISPUTE",
        });
      }
    }

    return this.feeItems[index];
  }

  getFeeReviewsByHospitalization(hospitalizationId: string) {
    return this.feeReviews
      .filter((r) => r.hospitalizationId === hospitalizationId)
      .sort((a, b) => b.reviewedAt.getTime() - a.reviewedAt.getTime());
  }

  addFeeReview(data: Omit<FeeReview, "id" | "createdAt">) {
    const newReview: FeeReview = {
      ...data,
      id: this.genId("review"),
      createdAt: new Date(),
    };
    this.feeReviews.push(newReview);
    return newReview;
  }

  calculateTotalFee(hospitalizationId: string) {
    return this.feeItems
      .filter((f) => f.hospitalizationId === hospitalizationId)
      .reduce((sum, f) => sum + f.totalPrice, 0);
  }

  canDischarge(hospitalizationId: string): { allowed: boolean; reason?: string } {
    const orders = this.getMedicalOrdersByHospitalization(hospitalizationId);
    const pendingOrders = orders.filter((o) => o.status === "PENDING");
    if (pendingOrders.length > 0) {
      return {
        allowed: false,
        reason: `存在 ${pendingOrders.length} 条待确认医嘱，请兽医确认后再办理出院`,
      };
    }

    const fees = this.getFeeItemsByHospitalization(hospitalizationId);
    const disputedFees = fees.filter((f) => f.status === "DISPUTED");
    if (disputedFees.length > 0) {
      return {
        allowed: false,
        reason: `存在 ${disputedFees.length} 项费用争议，请先解决费用问题再办理出院`,
      };
    }

    return { allowed: true };
  }

  dischargeHospitalization(
    hospitalizationId: string,
    data: {
      actualAmount?: number;
      reviewNote?: string;
      reviewedById: string;
    }
  ) {
    const check = this.canDischarge(hospitalizationId);
    if (!check.allowed) {
      throw new Error(check.reason || "无法办理出院");
    }

    const totalAmount = this.calculateTotalFee(hospitalizationId);
    const now = new Date();

    this.addFeeReview({
      hospitalizationId,
      reviewedById: data.reviewedById,
      totalAmount,
      actualAmount: data.actualAmount ?? totalAmount,
      reviewNote: data.reviewNote,
      isFinal: true,
      reviewedAt: now,
    });

    this.updateHospitalization(hospitalizationId, {
      status: "DISCHARGED",
      dischargeDate: now,
    });

    this.feeItems
      .filter((f) => f.hospitalizationId === hospitalizationId)
      .forEach((f) => {
        this.updateFeeItem(f.id, { status: "SETTLED" });
      });

    return this.getHospitalizationById(hospitalizationId);
  }
}

let store: DataStore;

declare global {
  var __dataStore: DataStore | undefined;
}

if (process.env.NODE_ENV === "production") {
  store = new DataStore();
} else {
  if (!global.__dataStore) {
    global.__dataStore = new DataStore();
  }
  store = global.__dataStore;
}

export { store };
