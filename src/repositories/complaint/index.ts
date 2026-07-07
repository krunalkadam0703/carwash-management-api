import type {
  ComplaintRecord,
  CreateComplaintInput,
  UpdateComplaintInput,
} from '../../models/complaint.model.js';
import { complaintPersistentStorageRepository } from './persistent-storage.js';

export class ComplaintRepository {
  findManyByBusinessId(businessId: string, customerId?: string): Promise<ComplaintRecord[]> {
    return complaintPersistentStorageRepository.findManyByBusinessId(businessId, customerId);
  }

  findById(businessId: string, id: string): Promise<ComplaintRecord | null> {
    return complaintPersistentStorageRepository.findById(businessId, id);
  }

  create(input: CreateComplaintInput): Promise<ComplaintRecord> {
    return complaintPersistentStorageRepository.create(input);
  }

  updateStatus(input: UpdateComplaintInput): Promise<ComplaintRecord> {
    return complaintPersistentStorageRepository.updateStatus(input);
  }
}

export const complaintRepository = new ComplaintRepository();
