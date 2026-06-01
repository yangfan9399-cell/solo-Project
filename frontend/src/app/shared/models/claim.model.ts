export type ClaimStatus = 'pending_materials' | 'under_review' | 'approved' | 'paid' | 'rejected';

export interface Claim {
  id: string;
  accidentId: string;
  insuranceSpecialistId: string;
  policyNo?: string;
  claimAmount?: number;
  paidAmount?: number;
  status: ClaimStatus;
  notes?: string;
  insuranceSpecialist?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClaimRequest {
  accidentId: string;
  policyNo?: string;
  claimAmount?: number;
  notes?: string;
}

export interface UpdateClaimRequest {
  policyNo?: string;
  claimAmount?: number;
  paidAmount?: number;
  status?: ClaimStatus;
  notes?: string;
}
