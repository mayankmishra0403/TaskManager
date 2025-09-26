import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type CreateEmployeeData = {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
  profilePhoto?: File;
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  
  const mutation = useMutation<any, Error, CreateEmployeeData>({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("employeeId", data.employeeId);
      formData.append("department", data.department);
      
      console.log("Client: Creating employee with data:", {
        name: data.name,
        hasPhoto: !!data.profilePhoto,
        photoSize: data.profilePhoto?.size,
        photoName: data.profilePhoto?.name,
        photoType: data.profilePhoto?.type
      });
      
      if (data.profilePhoto) {
        formData.append("profilePhoto", data.profilePhoto);
        console.log("Client: Photo appended to FormData");
      }

      // Log FormData contents
      console.log("FormData entries:", {
        name: formData.get("name"),
        email: formData.get("email"),
        profilePhoto: formData.get("profilePhoto") instanceof File ? "File present" : "No file"
      });

      const response = await fetch("/api/employees", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(errorData.error || "Failed to create employee");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Employee created successfully");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create employee");
    },
  });
  
  return mutation;
};
