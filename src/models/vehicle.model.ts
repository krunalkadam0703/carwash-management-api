export type VehicleRecord = {
  id: string;
  businessId: string;
  customerId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  vehicleName?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  location?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateVehicleInput = {
  businessId: string;
  customerId: string;
  vehicleTypeId: string;
  vehicleNumber: string;
  vehicleName?: string;
  brand?: string;
  model?: string;
  color?: string;
  location?: string;
};

export type UpdateVehicleInput = {
  id: string;
  businessId: string;
  customerId?: string;
  vehicleTypeId?: string;
  vehicleNumber?: string;
  vehicleName?: string | null;
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  location?: string | null;
};
