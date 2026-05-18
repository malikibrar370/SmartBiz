import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay } from "date-fns";

interface Stats {
  totalProducts: number;
  totalSalesAmount: number;
  todaySalesAmount: number;
  lowStockCount: number;
}

interface LowStockItem {
  id: string;
  name: string;
  quantity: number;
  low_stock_threshold: number;
}

interface RecentSale {
  id: string;
  product_name: string;
  quantity: number;
  total: number;
  created_at: string;
}

const fmtMoney = (n: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalProducts: 0, totalSalesAmount: 0, todaySalesAmount: 0, lowStockCount: 0 });
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [recent, setRecent] = useState<RecentSale[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const today = startOfDay(new Date()).toISOString();

    const [{ count: prodCount }, { data: allSales }, { data: todaySales }, { data: products }, { data: recentSales }] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("sales").select("total"),
      supabase.from("sales").select("total").gte("created_at", today),
      supabase.from("products").select("id, name, quantity, low_stock_threshold"),
      supabase.from("sales").select("id, product_name, quantity, total, created_at").order("created_at", { ascending: false }).limit(6),
    ]);

    const totalSalesAmount = (allSales ?? []).reduce((s, r) => s + Number(r.total), 0);
    const todaySalesAmount = (todaySales ?? []).reduce((s, r) => s + Number(r.total), 0);
    const low = (products ?? []).filter((p) => p.quantity <= p.low_stock_threshold);

    setStats({
      totalProducts: prodCount ?? 0,
      totalSalesAmount,
      todaySalesAmount,
      lowStockCount: low.length,
    });
    setLowStock(low);
    setRecent(recentSales ?? []);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Snapshot of your business today.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Products" value={stats.totalProducts} icon={Package} tone="default" />
          <StatCard label="Today's Sales" value={fmtMoney(stats.todaySalesAmount)} icon={ShoppingCart} tone="accent" />
          <StatCard label="Total Sales" value={fmtMoney(stats.totalSalesAmount)} icon={TrendingUp} tone="success" />
          <StatCard label="Low Stock Alerts" value={stats.lowStockCount} icon={AlertTriangle} tone="warning" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" /> Low Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are well-stocked. ✓</p>
              ) : (
                <ul className="divide-y divide-border">
                  {lowStock.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-3">
                      <span className="font-medium">{p.name}</span>
                      <Badge variant={p.quantity === 0 ? "destructive" : "outline"} className="border-warning text-warning-foreground bg-warning/10">
                        {p.quantity} left (threshold {p.low_stock_threshold})
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="font-display">Recent Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recent.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium">{s.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {s.quantity} • {format(new Date(s.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">{fmtMoney(Number(s.total))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
