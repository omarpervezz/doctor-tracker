export type ServiceResult<T> = { success: true; data: T } | { success: false; error: string; code?: string };
export const successResult = <T>(data: T): ServiceResult<T> => ({ success: true, data });
export const failureResult = (error: string, code?: string): ServiceResult<never> => ({ success: false, error, code });
