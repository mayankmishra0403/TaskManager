export enum UserRole {
  ADMIN = "ADMIN",
  EMPLOYEE = "EMPLOYEE",
}

export type User = {
  $id: string;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  createdBy?: string; // Admin who created this employee
};
