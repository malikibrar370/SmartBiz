import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Package, Barcode } from "lucide-react";
import { toast } from "sonner";
import JsBarcode from "jsbarcode";

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  quantity: number;
  low_stock_threshold: number;
  barcode?: string;
}

const empty = { name: "", price: "", cost_price: "", quantity: "", low_stock_threshold: "5", barcode: "" };

const BarcodeRenderer = ({ value, name }: { value: string; name: string }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 50,
          displayValue: true,
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [value]);

  const handlePrint = () => {
    const printContent = document.getElementById("printable-barcode-area")?.innerHTML;
    if (printContent) {
      const win = window.open("", "_blank");
      win?.document.write(`
        <html>
          <head>
            <title>Print Barcode - ${name}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                margin: 0;
                padding: 20px;
                font-family: system-ui, sans-serif;
              }
              svg {
                max-width: 100%;
              }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <h3>${name}</h3>
            ${printContent}
          </body>
        </html>
      `);
      win?.document.close();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      <div id="printable-barcode-area" className="bg-white p-4 rounded-lg border border-border">
        <svg ref={svgRef}></svg>
      </div>
      <Button onClick={handlePrint} className="w-full bg-gradient-primary">
        Print Barcode Label
      </Button>
    </div>
  );
};

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [viewBarcodeProduct, setViewBarcodeProduct] = useState<Product | null>(null);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) toast.error(error.message);
    else setProducts(data ?? []);
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      cost_price: String(p.cost_price),
      quantity: String(p.quantity),
      low_stock_threshold: String(p.low_stock_threshold),
      barcode: p.barcode ?? "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      cost_price: Number(form.cost_price || 0),
      quantity: Number(form.quantity),
      low_stock_threshold: Number(form.low_stock_threshold || 5),
      barcode: form.barcode.trim() || null,
    };
    const op = editing
      ? supabase.from("products").update(payload).eq("id", editing.id)
      : supabase.from("products").insert(payload);
    const { error } = await op;
    if (error) toast.error(error.message);
    else {
      toast.success(editing ? "Product updated" : "Product added");
      setOpen(false);
      void load();
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      void load();
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Manage your products and stock levels.</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNew} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">{editing ? "Edit Product" : "Add Product"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price</Label>
                      <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Cost</Label>
                      <Input type="number" step="0.01" min="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Low-stock alert at</Label>
                      <Input type="number" min="0" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Barcode (Optional)</Label>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-xs text-primary"
                        onClick={() => {
                          const num = Math.floor(100000 + Math.random() * 900000);
                          setForm({ ...form, barcode: `SB-${num}` });
                        }}
                      >
                        Generate Code
                      </Button>
                    </div>
                    <Input
                      placeholder="e.g. SB-123456 or leave empty"
                      value={form.barcode}
                      onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editing ? "Save changes" : "Add product"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="shadow-elegant">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Package className="h-5 w-5" /> Products ({filtered.length})
              </CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const low = p.quantity <= p.low_stock_threshold;
                      const out = p.quantity === 0;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">PKR {Number(p.price).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{p.quantity}</TableCell>
                          <TableCell>
                            {out ? (
                              <Badge variant="destructive">Out of stock</Badge>
                            ) : low ? (
                              <Badge className="bg-warning text-warning-foreground hover:bg-warning">Low</Badge>
                            ) : (
                              <Badge className="bg-success text-success-foreground hover:bg-success">In stock</Badge>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (p.barcode) {
                                    setViewBarcodeProduct(p);
                                  } else {
                                    toast.info("This product has no barcode. Setting one now!");
                                    openEdit(p);
                                  }
                                }}
                                className={p.barcode ? "text-primary" : "text-muted-foreground opacity-50"}
                                title={p.barcode ? "View Barcode" : "Add Barcode"}
                              >
                                <Barcode className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => remove(p)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={!!viewBarcodeProduct} onOpenChange={(o) => !o && setViewBarcodeProduct(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Product Barcode</DialogTitle>
            </DialogHeader>
            {viewBarcodeProduct && viewBarcodeProduct.barcode && (
              <BarcodeRenderer value={viewBarcodeProduct.barcode} name={viewBarcodeProduct.name} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
