/**
 * Tipos de la base de datos PediGo.
 *
 * Este archivo refleja el esquema definido en `supabase/migrations`.
 * En producción puedes regenerarlo con:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 *
 * Por ahora se mantiene a mano con las tablas y enums núcleo para que el
 * código tenga tipos útiles sin depender del CLI.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ----------------------------- Enums ---------------------------------------

export type OrderChannel = "app" | "pos" | "whatsapp";

export type OrderStatus =
  | "recibido"
  | "en_preparacion"
  | "listo"
  | "en_camino"
  | "entregado"
  | "cancelado"
  | "rechazado"
  | "incidencia"
  | "reprogramado"
  | "devuelto";

export type PaymentMethod =
  | "cash"
  | "transfer"
  | "datafono"
  | "online";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type CashSessionStatus = "open" | "closed";

export type CashMovementType = "sale" | "in" | "out" | "withdrawal";

export type InventoryMovementType = "in" | "out" | "adjust";

export type InvoiceType = "sale";

export type FiscalDocType =
  | "invoice"
  | "credit_note"
  | "debit_note"
  | "support_document";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "sent"
  | "accepted"
  | "rejected"
  | "void";

export type CourierRelationship = "owned" | "shared";

export type AssignmentMethod = "manual" | "auto_proximity";

export type NotificationChannel = "in_app" | "email" | "whatsapp";

export type DianEnvironment = "mock" | "test" | "prod";

// --------------------------- Helpers de tabla -------------------------------

type Timestamps = {
  created_at: string;
  updated_at: string;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

// ------------------------------ Filas --------------------------------------

export interface OrganizationRow extends Timestamps {
  id: string;
  clerk_org_id: string | null;
  name: string;
  slug: string;
  status: string;
  plan: string;
  currency: string;
  locale: string;
}

export interface ProductRow extends Timestamps {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_favorite: boolean;
  is_active: boolean;
  tax_rate: number;
}

export interface OrderRow extends Timestamps {
  id: string;
  organization_id: string;
  customer_id: string | null;
  location_id: string | null;
  channel: OrderChannel;
  status: OrderStatus;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  address_snapshot: Json | null;
  courier_id: string | null;
  invoice_id: string | null;
  notes: string | null;
}

export interface InvoiceRow extends Timestamps {
  id: string;
  organization_id: string;
  order_id: string | null;
  type: InvoiceType;
  prefix: string;
  number: number;
  full_number: string;
  status: InvoiceStatus;
  customer_snapshot: Json;
  fiscal_snapshot: Json;
  subtotal: number;
  tax_total: number;
  total: number;
  cufe: string | null;
  issued_at: string | null;
}

// ------------------------------ Database ------------------------------------
//
// Para las tablas no listadas explícitamente arriba se usa una fila genérica.
// Esto mantiene el código compilando mientras se completan los tipos.

type GenericRow = { id: string } & Record<string, Json>;

export interface Database {
  public: {
    Tables: {
      organizations: Table<OrganizationRow>;
      products: Table<ProductRow>;
      orders: Table<OrderRow>;
      invoices: Table<InvoiceRow>;

      organization_settings: Table<GenericRow>;
      organization_fiscal_settings: Table<GenericRow>;
      users: Table<GenericRow>;
      user_organization_roles: Table<GenericRow>;
      customers: Table<GenericRow>;
      customer_addresses: Table<GenericRow>;
      commerce_locations: Table<GenericRow>;
      product_categories: Table<GenericRow>;
      product_variants: Table<GenericRow>;
      product_extras: Table<GenericRow>;
      product_combos: Table<GenericRow>;
      product_schedules: Table<GenericRow>;
      inventory_items: Table<GenericRow>;
      inventory_movements: Table<GenericRow>;
      promotions: Table<GenericRow>;
      order_items: Table<GenericRow>;
      order_status_history: Table<GenericRow>;
      payments: Table<GenericRow>;
      cash_registers: Table<GenericRow>;
      cash_sessions: Table<GenericRow>;
      cash_movements: Table<GenericRow>;
      kitchen_tickets: Table<GenericRow>;
      couriers: Table<GenericRow>;
      courier_organization_links: Table<GenericRow>;
      courier_assignments: Table<GenericRow>;
      live_locations: Table<GenericRow>;
      delivery_routes: Table<GenericRow>;
      invoice_items: Table<GenericRow>;
      invoice_status_history: Table<GenericRow>;
      credit_notes: Table<GenericRow>;
      debit_notes: Table<GenericRow>;
      support_documents: Table<GenericRow>;
      dian_logs: Table<GenericRow>;
      audit_logs: Table<GenericRow>;
      notifications: Table<GenericRow>;
    };
    Views: Record<string, never>;
    Functions: {
      next_fiscal_number: {
        Args: { p_organization_id: string; p_doc_type: FiscalDocType };
        Returns: { prefix: string; number: number }[];
      };
      current_org_id: { Args: Record<string, never>; Returns: string };
      current_clerk_user_id: { Args: Record<string, never>; Returns: string };
      current_customer_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      order_channel: OrderChannel;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
    };
  };
}
