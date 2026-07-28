import type { ObjectId } from "mongodb";
export interface UserModel { _id: ObjectId; email: string; passwordHash: string; role: "admin"; createdAt: Date; updatedAt: Date; }
