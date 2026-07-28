import type { ObjectId } from "mongodb";
export type PatientStatus = "active" | "monitoring" | "recovered" | "critical";
export interface PatientModel { _id:ObjectId; doctorId:ObjectId; name:string; age:number; gender:"male"|"female"|"other"; condition:string; status:PatientStatus; phone:string; email:string; lastVisit:Date; createdAt:Date; updatedAt:Date; }
