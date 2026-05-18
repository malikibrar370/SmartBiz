import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Receipt } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  quantity: number;
}

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

const fmtMoney = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

export default function Sales() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const [{ data: p }, { data: s }] = await Promise.all([
      supabase.from("products").select("id, name, price, cost_price, quantity").gt("quantity", 0).order("name"),
      supabase.from("sales").select("id, product_name, quantity, unit_price, total, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    setProducts(p ?? []);
    setSales(s ?? []);
  };

  const selected = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const total = selected ? Number(selected.price) * Number(qty || 0) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !user) return;
    const quantity = Number(qty);
    if (quantity <= 0 || quantity > selected.quantity) {
      toast.error(`Available stock: ${selected.quantity}`);
      return;
    }
    setSubmitting(true);

    // Insert sale
    const { error: saleErr } = await supabase.from("sales").insert({
      product_id: selected.id,
      product_name: selected.name,
      quantity,
      unit_price: selected.price,
      unit_cost: selected.cost_price,
      total: Number(selected.price) * quantity,
      sold_by: user.id,
    });

    if (saleErr) {
      toast.error(saleErr.message);
      setSubmitting(false);
      return;
    }

    // Decrement stock
    const { error: stockErr } = await supabase
      .from("products")
      .update({ quantity: selected.quantity - quantity })
      .eq("id", selected.id);

    if (stockErr) toast.error("Sale recorded but stock update failed: " + stockErr.message);
    else toast.success(`Sale recorded — ${fmtMoney(Number(selected.price) * quantity)}`);

    setQty("1");
    setProductId("");
    setSubmitting(false);
    void load();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Record a new sale and view recent transactions.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="shadow-elegant lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> New Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {fmtMoney(Number(p.price))} · stock {p.quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    max={selected?.quantity ?? 1}
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Total</span>
                    <span className="font-display text-2xl font-bold text-primary">{fmtMoney(total)}</span>
                  </div>
                </div>
                <Button type="submit" disabled={!selected || submitting} className="w-full bg-gradient-primary">
                  Record Sale
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-elegant lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Receipt className="h-5 w-5" /> Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No sales yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.product_name}</TableCell>
                          <TableCell>{s.quantity}</TableCell>
                          <TableCell className="text-right">{fmtMoney(Number(s.unit_price))}</TableCell>
                          <TableCell className="text-right font-semibold">{fmtMoney(Number(s.total))}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(s.created_at), "MMM d, h:mm a")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
