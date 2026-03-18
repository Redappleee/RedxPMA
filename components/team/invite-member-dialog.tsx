"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { teamService } from "@/services/team.service";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["manager", "member"])
});

type FormValues = z.infer<typeof formSchema>;

export const InviteMemberDialog = ({
  allowedRoles = ["manager", "member"],
  defaultRole = "member",
  disabled = false
}: {
  allowedRoles?: Array<"manager" | "member">;
  defaultRole?: "manager" | "member";
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [result, setResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: defaultRole
    }
  });

  const resetForm = () => {
    form.reset({
      name: "",
      email: "",
      role: defaultRole
    });
  };

  const mutation = useMutation({
    mutationFn: teamService.invite,
    onSuccess: async (data) => {
      setErrorMessage("");
      setResult(`Temporary password: ${data.invite.temporaryPassword}`);
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      resetForm();
    },
    onError: (error) => {
      setErrorMessage(error.message);
    }
  });

  useEffect(() => {
    const nextRole = allowedRoles.includes(defaultRole) ? defaultRole : allowedRoles[0] ?? "member";
    form.setValue("role", nextRole);
  }, [allowedRoles, defaultRole, form]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) {
          setResult("");
          setErrorMessage("");
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>Invite member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
        </DialogHeader>

        <form className="space-y-3" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <div>
            <Label>Name</Label>
            <Input {...form.register("name")} />
            <p className="mt-1 text-xs text-danger">{form.formState.errors.name?.message}</p>
          </div>
          <div>
            <Label>Email</Label>
            <Input {...form.register("email")} />
            <p className="mt-1 text-xs text-danger">{form.formState.errors.email?.message}</p>
          </div>
          <div>
            <Label>Role</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/60 px-3 text-sm"
              {...form.register("role")}
            >
              {allowedRoles.includes("manager") && <option value="manager">Manager</option>}
              {allowedRoles.includes("member") && <option value="member">Member</option>}
            </select>
          </div>
          {allowedRoles.length === 1 && (
            <p className="text-xs text-muted-foreground">Your current permissions allow inviting {allowedRoles[0]} users only.</p>
          )}
          <Button className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send invite"}
          </Button>
          {errorMessage && <p className="rounded-xl bg-danger/10 p-2 text-xs text-danger">{errorMessage}</p>}
          {result && <p className="rounded-xl bg-muted p-2 text-xs text-muted-foreground">{result}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
};
