export type ImageRecord = {
  id: string;
  imageUrl: string;
  caption?: string | null;
  createdAt: Date;
};

export type ServiceImageRecord = ImageRecord & {
  serviceId: string;
  sortOrder: number;
};

export type VehicleImageRecord = ImageRecord & {
  vehicleId: string;
};

export type DailyWashImageRecord = {
  id: string;
  dailyWashId: string;
  imageUrl: string;
  photoType: string;
  createdAt: Date;
};

export type CreateVehicleImageInput = {
  vehicleId: string;
  imageUrl: string;
  caption?: string;
};

export type CreateServiceImageInput = {
  serviceId: string;
  imageUrl: string;
  caption?: string;
  sortOrder?: number;
};

export type CreateDailyWashImageInput = {
  dailyWashId: string;
  imageUrl: string;
  photoType: string;
};
