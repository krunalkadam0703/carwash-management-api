export type ServiceRecord = {
  id: string;
  businessId: string;
  vehicleTypeId: string;
  name: string;
  description?: string | null;
  basePrice: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateServiceInput = {
  businessId: string;
  vehicleTypeId: string;
  name: string;
  description?: string;
  basePrice: number;
};

export type UpdateServiceInput = {
  id: string;
  businessId: string;
  vehicleTypeId?: string;
  name?: string;
  description?: string | null;
  basePrice?: number;
};
