"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createOrganization } from "@/modules/organizations/actions";

const initial = {
  name: "",
  slug: "",
  legalName: "",
  nit: "",
  invoicePrefix: "FE",
  adminEmail: "",
};

export function CreateOrganizationForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function update(key: keyof typeof initial, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const res = await createOrganization(form);
      if (res.ok) {
        toast.success(res.message);
        setForm(initial);
        setOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button className="w-full sm:w-auto">Nuevo comercio</Button>}
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear comercio</DialogTitle>
          <DialogDescription>
            Se creará la organización y se invitará al administrador por email.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre comercial</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Pizzería Roma"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => update("slug", e.target.value)}
                placeholder="pizzeria-roma"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invoicePrefix">Prefijo factura</Label>
              <Input
                id="invoicePrefix"
                value={form.invoicePrefix}
                onChange={(e) => update("invoicePrefix", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="legalName">Razón social</Label>
              <Input
                id="legalName"
                value={form.legalName}
                onChange={(e) => update("legalName", e.target.value)}
                placeholder="Roma S.A.S."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nit">NIT</Label>
              <Input
                id="nit"
                value={form.nit}
                onChange={(e) => update("nit", e.target.value)}
                placeholder="900123456-7"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="adminEmail">Email del administrador</Label>
            <Input
              id="adminEmail"
              type="email"
              value={form.adminEmail}
              onChange={(e) => update("adminEmail", e.target.value)}
              placeholder="admin@roma.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Creando…" : "Crear e invitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
