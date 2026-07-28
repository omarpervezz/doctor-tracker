import type { PatientStatus } from "./patient.model";
export interface PatientDto { id:string; doctorId:string; doctorName:string; name:string; age:number; gender:"male"|"female"|"other"; condition:string; status:PatientStatus; phone:string; email:string; lastVisit:string; createdAt:string; updatedAt:string; }
export interface CreatePatientDto { doctorId:string; name:string; age:number; gender:"male"|"female"|"other"; condition:string; status:PatientStatus; phone:string; email:string; lastVisit:string; }
export type UpdatePatientDto=Partial<CreatePatientDto>;
