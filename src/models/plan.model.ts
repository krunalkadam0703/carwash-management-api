export type PlanRecord = {
  id: string;
  businessId: string;
  vehicleTypeId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  price: string;
  durationDays: number;
  washesTotal: number;
  validityDays?: number | null;
  durationMonths?: number | null;
  dailyWash: boolean;
  isFeatured: boolean;
  isActive: boolean;
  interiorCleaning: boolean;
  foamWash: boolean;
  ceramicCoating: boolean;
  serviceIds?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlanInput = Omit<PlanRecord, 'id' | 'price' | 'createdAt' | 'updatedAt'> & {
  price: number;
  serviceIds?: string[];
};

export type UpdatePlanInput = {
  id: string;
  businessId: string;
  vehicleTypeId?: string;
  name?: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  durationDays?: number;
  washesTotal?: number;
  validityDays?: number | null;
  durationMonths?: number | null;
  dailyWash?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  interiorCleaning?: boolean;
  foamWash?: boolean;
  ceramicCoating?: boolean;
  serviceIds?: string[];
};
