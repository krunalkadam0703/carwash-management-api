export type VehicleTypeRecord = {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  examples?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateVehicleTypeInput = {
  businessId: string;
  name: string;
  slug: string;
  examples?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateVehicleTypeInput = {
  id: string;
  businessId: string;
  name?: string;
  slug?: string;
  examples?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};
