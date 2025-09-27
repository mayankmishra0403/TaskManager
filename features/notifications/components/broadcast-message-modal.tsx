"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Users, UserCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

import { useSendBroadcastMessage } from "../api/use-notifications";
import { useGetAllEmployees } from "@/features/admin/api/use-get-all-employees";

const broadcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(["low", "medium", "high"]),
  sendToAll: z.boolean(),
  recipientIds: z.array(z.string()).optional(),
});

type BroadcastForm = z.infer<typeof broadcastSchema>;

interface BroadcastMessageModalProps {
  workspaceId: string;
  children?: React.ReactNode;
}

export function BroadcastMessageModal({ workspaceId, children }: BroadcastMessageModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const form = useForm<BroadcastForm>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      priority: "medium",
      sendToAll: true,
      recipientIds: [],
    },
  });

  const sendBroadcast = useSendBroadcastMessage();
  const { data: employeesData } = useGetAllEmployees();
  // Filter to current workspace
  const employees = (employeesData?.documents || []).filter((e: any) => e.workspaceId === workspaceId);

  const sendToAll = form.watch("sendToAll");

  const onSubmit = (data: BroadcastForm) => {
    const recipientIds = data.sendToAll ? undefined : selectedEmployees;
    
    sendBroadcast.mutate({
      title: data.title,
      message: data.message,
      workspaceId,
      priority: data.priority,
      recipientIds,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setSelectedEmployees([]);
      },
    });
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp: any) => emp.userId));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            Send Message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Broadcast Message
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter message title..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message Content</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your message..." 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Low
                          </Badge>
                        </SelectItem>
                        <SelectItem value="medium">
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                            Medium  
                          </Badge>
                        </SelectItem>
                        <SelectItem value="high">
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            High
                          </Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendToAll"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipients</FormLabel>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="sendToAll"
                      />
                      <label htmlFor="sendToAll" className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Send to all employees
                      </label>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {!sendToAll && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Select Recipients</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="text-xs"
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      {selectedEmployees.length === employees.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {employees.map((employee: any) => (
                        <div key={employee.userId} className="flex items-center space-x-2">
                          <Checkbox
                            checked={selectedEmployees.includes(employee.userId)}
                            onCheckedChange={() => handleEmployeeToggle(employee.userId)}
                            id={employee.userId}
                          />
                          <label 
                            htmlFor={employee.userId}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {employee.name} ({employee.email})
                          </label>
                          <Badge variant="outline" className="text-xs">
                            {employee.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  {!sendToAll && selectedEmployees.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedEmployees.length} of {employees.length} employee{employees.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendBroadcast.isPending || (!sendToAll && selectedEmployees.length === 0)}
                className="gap-2"
              >
                {sendBroadcast.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
