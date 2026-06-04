"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Pencil, Plus, Settings2, Star } from "lucide-react";
import { toast } from "sonner";

import { formatCOP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  addExtra,
  addSchedule,
  addVariant,
  adjustStock,
  createCategory,
  createProduct,
  createPromotion,
  setPromotionActive,
  updateProduct,
} from "@/modules/inventory/actions";
import type {
  InventoryCategory,
  InventoryProduct,
  PromotionItem,
} from "@/modules/inventory/queries";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Result = { ok: boolean; message: string };

export function InventoryClient({
  products,
  categories,
  promotions,
}: {
  products: InventoryProduct[];
  categories: InventoryCategory[];
  promotions: PromotionItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InventoryProduct | null>(null);
  const [adjusting, setAdjusting] = useState<InventoryProduct | null>(null);
  const [customizing, setCustomizing] = useState<InventoryProduct | null>(null);

  function run(fn: () => Promise<Result>, onOk?: () => void) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message);
        onOk?.();
      } else {
        toast.error(res.message);
      }
    });
  }

  const lowStockCount = products.filter((p) => p.lowStock).length;

  return (
    <>
      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">Productos ({products.length})</TabsTrigger>
          <TabsTrigger value="categorias">Categorías ({categories.length})</TabsTrigger>
          <TabsTrigger value="promociones">Promociones ({promotions.length})</TabsTrigger>
        </TabsList>

        {/* PRODUCTOS */}
        <TabsContent value="productos" className="space-y-4">
          <div className="flex items-center justify-between">
            {lowStockCount > 0 ? (
              <Badge variant="secondary" className="gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {lowStockCount} con stock bajo
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">Stock saludable</span>
            )}
            <Button onClick={() => setCreating(true)}>
              <Plus className="mr-1 h-4 w-4" /> Nuevo producto
            </Button>
          </div>

          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Opciones</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Sin productos. Crea el primero.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {p.isFavorite && (
                            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                          )}
                          {p.name}
                          {!p.isActive && <Badge variant="outline">Inactivo</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.categoryName ?? "—"}
                      </TableCell>
                      <TableCell>{formatCOP(p.basePrice)}</TableCell>
                      <TableCell>
                        <span className={p.lowStock ? "font-semibold text-amber-600" : ""}>
                          {p.stockQty}
                        </span>
                        <span className="text-xs text-muted-foreground"> / min {p.minAlert}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.variantsCount}v · {p.extrasCount}e · {p.schedulesCount}h
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setAdjusting(p)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setCustomizing(p)}>
                            <Settings2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* CATEGORÍAS */}
        <TabsContent value="categorias">
          <CategoriesTab categories={categories} run={run} isPending={isPending} />
        </TabsContent>

        {/* PROMOCIONES */}
        <TabsContent value="promociones">
          <PromotionsTab promotions={promotions} run={run} isPending={isPending} />
        </TabsContent>
      </Tabs>

      {creating && (
        <ProductDialog
          categories={categories}
          onClose={() => setCreating(false)}
          onSubmit={(payload, done) =>
            run(() => createProduct(payload), () => {
              done();
              setCreating(false);
            })
          }
          isPending={isPending}
        />
      )}

      {editing && (
        <ProductDialog
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSubmit={(payload, done) =>
            run(() => updateProduct({ ...payload, id: editing.id }), () => {
              done();
              setEditing(null);
            })
          }
          isPending={isPending}
        />
      )}

      {adjusting && (
        <AdjustStockDialog
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSubmit={(payload, done) =>
            run(() => adjustStock(payload), () => {
              done();
              setAdjusting(null);
            })
          }
          isPending={isPending}
        />
      )}

      {customizing && (
        <CustomizeDialog
          product={customizing}
          onClose={() => setCustomizing(null)}
          run={run}
          isPending={isPending}
        />
      )}
    </>
  );
}

/* ----------------------------- Sub-componentes ---------------------------- */

function CategoriesTab({
  categories,
  run,
  isPending,
}: {
  categories: InventoryCategory[];
  run: (fn: () => Promise<Result>, onOk?: () => void) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Label htmlFor="cat">Nueva categoría</Label>
          <div className="flex gap-2">
            <Input
              id="cat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bebidas"
            />
            <Button
              disabled={isPending || name.length < 2}
              onClick={() =>
                run(() => createCategory({ name, sortOrder: categories.length }), () => setName(""))
              }
            >
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Orden</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                  Sin categorías.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.sortOrder}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PromotionsTab({
  promotions,
  run,
  isPending,
}: {
  promotions: PromotionItem[];
  run: (fn: () => Promise<Result>, onOk?: () => void) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("percent");
  const [value, setValue] = useState(0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Label>Nueva promoción</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="2x1 martes" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={type} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Porcentaje</SelectItem>
                <SelectItem value="fixed">Monto fijo</SelectItem>
                <SelectItem value="combo">Combo</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={value || ""}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
              placeholder={type === "percent" ? "% desc." : "Valor"}
            />
          </div>
          <Button
            disabled={isPending || name.length < 2}
            onClick={() =>
              run(() => createPromotion({ name, type, value, isActive: true }), () => {
                setName("");
                setValue(0);
              })
            }
          >
            Crear promoción
          </Button>
        </CardContent>
      </Card>
      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Promoción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Sin promociones.
                </TableCell>
              </TableRow>
            ) : (
              promotions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.type}</TableCell>
                  <TableCell>
                    {p.type === "percent" ? `${p.value}%` : formatCOP(p.value)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={p.isActive ? "outline" : "default"}
                      disabled={isPending}
                      onClick={() => run(() => setPromotionActive(p.id, !p.isActive))}
                    >
                      {p.isActive ? "Activa" : "Inactiva"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

interface ProductPayload {
  name: string;
  categoryId: string | null;
  basePrice: number;
  taxRate: number;
  isFavorite: boolean;
  isActive: boolean;
  initialStock: number;
  minAlert: number;
}

function ProductDialog({
  product,
  categories,
  onClose,
  onSubmit,
  isPending,
}: {
  product?: InventoryProduct;
  categories: InventoryCategory[];
  onClose: () => void;
  onSubmit: (payload: ProductPayload, done: () => void) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState<string>(product?.categoryId ?? "none");
  const [basePrice, setBasePrice] = useState(product?.basePrice ?? 0);
  const [taxRate, setTaxRate] = useState(product ? product.taxRate : 0.19);
  const [isFavorite, setIsFavorite] = useState(product?.isFavorite ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [initialStock, setInitialStock] = useState(product?.stockQty ?? 0);
  const [minAlert, setMinAlert] = useState(product?.minAlert ?? 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "none")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Precio base</Label>
              <Input
                type="number"
                value={basePrice || ""}
                onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>IVA</Label>
              <Select value={String(taxRate)} onValueChange={(v) => setTaxRate(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.19">19%</SelectItem>
                  <SelectItem value="0.05">5%</SelectItem>
                  <SelectItem value="0">0%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>{product ? "Stock" : "Stock inicial"}</Label>
              <Input
                type="number"
                disabled={!!product}
                value={initialStock || ""}
                onChange={(e) => setInitialStock(Number(e.target.value) || 0)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Alerta min.</Label>
              <Input
                type="number"
                value={minAlert || ""}
                onChange={(e) => setMinAlert(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              Favorito
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Activo
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button
            disabled={isPending || name.length < 2}
            onClick={() =>
              onSubmit(
                {
                  name,
                  categoryId: categoryId === "none" ? null : categoryId,
                  basePrice,
                  taxRate,
                  isFavorite,
                  isActive,
                  initialStock,
                  minAlert,
                },
                () => {},
              )
            }
          >
            {product ? "Guardar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustStockDialog({
  product,
  onClose,
  onSubmit,
  isPending,
}: {
  product: InventoryProduct;
  onClose: () => void;
  onSubmit: (
    payload: { productId: string; type: string; qty: number; reason?: string },
    done: () => void,
  ) => void;
  isPending: boolean;
}) {
  const [type, setType] = useState("in");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar stock · {product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">Stock actual: {product.stockQty}</p>
          <div className="grid grid-cols-2 gap-3">
            <Select value={type} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada (+)</SelectItem>
                <SelectItem value="out">Salida (−)</SelectItem>
                <SelectItem value="adjust">Fijar a</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={qty || ""}
              onChange={(e) => setQty(Number(e.target.value) || 0)}
              placeholder="Cantidad"
            />
          </div>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (opcional)" />
        </div>
        <DialogFooter>
          <Button
            disabled={isPending || qty <= 0}
            onClick={() =>
              onSubmit({ productId: product.id, type, qty, reason: reason || undefined }, () => {})
            }
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomizeDialog({
  product,
  onClose,
  run,
  isPending,
}: {
  product: InventoryProduct;
  onClose: () => void;
  run: (fn: () => Promise<Result>, onOk?: () => void) => void;
  isPending: boolean;
}) {
  const [vName, setVName] = useState("");
  const [vDelta, setVDelta] = useState(0);
  const [eName, setEName] = useState("");
  const [ePrice, setEPrice] = useState(0);
  const [day, setDay] = useState("1");
  const [start, setStart] = useState("08:00");
  const [end, setEnd] = useState("22:00");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Personalizar · {product.name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="variantes">
          <TabsList>
            <TabsTrigger value="variantes">Variantes</TabsTrigger>
            <TabsTrigger value="extras">Extras</TabsTrigger>
            <TabsTrigger value="horarios">Horarios</TabsTrigger>
          </TabsList>
          <TabsContent value="variantes" className="space-y-3 pt-3">
            <Input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="Nombre (ej. Grande)" />
            <Input
              type="number"
              value={vDelta || ""}
              onChange={(e) => setVDelta(Number(e.target.value) || 0)}
              placeholder="Δ precio (+/-)"
            />
            <Button
              disabled={isPending || vName.length < 1}
              onClick={() =>
                run(() => addVariant({ productId: product.id, name: vName, priceDelta: vDelta }), () => {
                  setVName("");
                  setVDelta(0);
                })
              }
            >
              Agregar variante
            </Button>
          </TabsContent>
          <TabsContent value="extras" className="space-y-3 pt-3">
            <Input value={eName} onChange={(e) => setEName(e.target.value)} placeholder="Nombre (ej. Queso extra)" />
            <Input
              type="number"
              value={ePrice || ""}
              onChange={(e) => setEPrice(Number(e.target.value) || 0)}
              placeholder="Precio"
            />
            <Button
              disabled={isPending || eName.length < 1}
              onClick={() =>
                run(() => addExtra({ productId: product.id, name: eName, price: ePrice }), () => {
                  setEName("");
                  setEPrice(0);
                })
              }
            >
              Agregar extra
            </Button>
          </TabsContent>
          <TabsContent value="horarios" className="space-y-3 pt-3">
            <Select value={day} onValueChange={(v) => setDay(v ?? "1")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
              <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <Button
              disabled={isPending}
              onClick={() =>
                run(() =>
                  addSchedule({
                    productId: product.id,
                    dayOfWeek: Number(day),
                    startTime: start,
                    endTime: end,
                  }),
                )
              }
            >
              Agregar horario
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
