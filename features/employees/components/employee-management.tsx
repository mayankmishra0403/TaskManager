"use client";

import { useState, useRef } from "react";
import { useGetEmployees } from "../api/use-get-employees";
import { useCreateEmployee } from "../api/use-create-employee";
import { useCurrent } from "@/features/auth/api/use-current";
import { useGetWorkspaces } from "@/features/workspaces/api/use-get-workspaces";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Mail, User, Calendar, Shield, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

interface EmployeeManagementProps {
  workspaceId: string;
}

const createEmployeeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  department: z.string().trim().min(1, "Department is required"),
});

type CreateEmployeeForm = z.infer<typeof createEmployeeFormSchema>;

export const EmployeeManagement = ({ workspaceId }: EmployeeManagementProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { data: employees, isLoading } = useGetEmployees({ workspaceId });
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { data: user } = useCurrent();
  const { data: workspaces } = useGetWorkspaces();

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateEmployeeForm>({
    resolver: zodResolver(createEmployeeFormSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      employeeId: "",
      department: "",
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("File size must be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: CreateEmployeeForm) => {
    createEmployee(
      {
        ...data,
        profilePhoto: selectedPhoto || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Employee created successfully");
          form.reset();
          setSelectedPhoto(null);
          setPhotoPreview(null);
          setIsCreateDialogOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to create employee");
          console.error(error);
        },
      }
    );
  };

  const isAdmin = user?.labels?.includes("admin") || user?.email === "admin@edu-nova.tech";

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
            Manage employees and their access to this workspace
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                <strong>Workspace Assignment:</strong> Employee will be automatically assigned to{" "}
                <span className="font-medium">
                  {workspaces?.documents.find(w => w.$id === workspaceId)?.name || "current workspace"}
                </span>
              </p>
            </div>
            
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

              {/* Profile Photo Upload */}
              <div>
                <Label>Profile Photo (Optional)</Label>
                <div className="mt-2">
                  {photoPreview ? (
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={photoPreview} alt="Profile preview" />
                        <AvatarFallback>
                          <User className="h-8 w-8" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Photo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removePhoto}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-dashed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload profile photo
                        </span>
                      </div>
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees?.documents.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {employees?.documents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No employees</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating a new employee account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {employees?.documents.map((employee) => (
                <div
                  key={employee.$id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={employee.profilePhotoUrl} 
                        alt={`${employee.name}'s profile`} 
                      />
                      <AvatarFallback className="bg-blue-100">
                        <User className="h-5 w-5 text-blue-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>ID: {employee.employeeId}</span>
                        <span>Dept: {employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Created {new Date(employee.$createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Employee</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
