"use client";

import { useState } from "react";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";
import { useCreateEmployee } from "../api/use-create-employee";
import { useCurrent } from "@/features/auth/api/use-current";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Mail, User, Calendar, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  department: z.string().trim().min(1, "Department is required"),
});

type CreateEmployeeForm = z.infer<typeof createEmployeeSchema>;

export const SimpleEmployeeManagement = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: employees, isLoading } = useGetAllEmployees();
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { data: user } = useCurrent();

  const form = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      employeeId: "",
      department: "",
    },
  });

  const onSubmit = (data: CreateEmployeeForm) => {
    createEmployee(
      { json: data },
      {
        onSuccess: () => {
          toast.success("Employee created successfully");
          form.reset();
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to create employee");
          console.error(error);
        },
      }
    );
  };

  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@company.com";

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Only administrators can manage employees.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage all employees in your organization
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="John Doe"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="john@company.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  {...form.register("employeeId")}
                  placeholder="EMP001"
                />
                {form.formState.errors.employeeId && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.employeeId.message}
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...form.register("department")}
                  placeholder="Engineering"
                />
                {form.formState.errors.department && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.department.message}
                  </p>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Employee"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.documents.map((employee) => (
          <Card key={employee.$id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-5" />
                {employee.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                {employee.email}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">ID: {employee.employeeId}</Badge>
                <Badge variant="secondary">{employee.department}</Badge>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3" />
                Joined: {new Date(employee.$createdAt).toLocaleDateString()}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!employees?.documents || employees.documents.length === 0) && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No employees</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first employee to get started.
          </p>
        </div>
      )}
    </div>
  );
};
