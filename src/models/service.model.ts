export type ServiceRecord = {
  id: string;
  businessId: string;
  vehicleTypeId: string;
  name: string;
  description?: string | null;
  basePrice: string;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateServiceInput = {
  businessId: string;
  vehicleTypeId: string;
  name: string;
  description?: string;
  basePrice: number;
  durationMinutes?: number;
  isActive?: boolean;
};

export type UpdateServiceInput = {
  id: string;
  businessId: string;
  vehicleTypeId?: string;
  name?: string;
  description?: string | null;
  basePrice?: number;
  durationMinutes?: number;
  isActive?: boolean;
};
