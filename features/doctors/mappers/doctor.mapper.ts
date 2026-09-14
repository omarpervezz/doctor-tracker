import type { DoctorDto } from "../types/doctor.dto";
import type { DoctorModel } from "../types/doctor.model";
export function toDoctorDto(model: DoctorModel, patientCount = 0): DoctorDto { return { id: model._id.toString(), name: model.name, specialization: model.specialization, hospital: model.hospital, phone: model.phone, email: model.email, patientCount, createdAt: model.createdAt.toISOString(), updatedAt: model.updatedAt.toISOString() }; }
