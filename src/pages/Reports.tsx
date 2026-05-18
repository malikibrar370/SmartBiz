import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatCard } from "@/components/StatCard";
import { FileBarChart, Download, TrendingUp, DollarSign, ShoppingBag } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface Sale {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total: number;
  created_at: string;
}

const fmtMoney = (n: number) => "PKR " + Number(n).toLocaleString();

export default function Reports() {
  const [tab, setTab] = useState("daily");
  const [day, setDay] = useState(format(new Date(), "yyyy-MM-dd"));
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    void load();
  }, [tab, day, month]);

  const load = async () => {
    let from: Date, to: Date;
    if (tab === "daily") {
      from = startOfDay(new Date(day));
      to = endOfDay(new Date(day));
    } else {
      const [y, m] = month.split("-").map(Number);
      from = startOfMonth(new Date(y, m - 1));
      to = endOfMonth(new Date(y, m - 1));
    }
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .gte("created_at", from.toISOString())
      .lte("created_at", to.toISOString())
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setSales(data ?? []);
  };

  const stats = useMemo(() => {
    const revenue = sales.reduce((s, r) => s + Number(r.total), 0);
    const cost = sales.reduce((s, r) => s + Number(r.unit_cost) * r.quantity, 0);
    const profit = revenue - cost;
    const items = sales.reduce((s, r) => s + r.quantity, 0);
    return { revenue, profit, items, count: sales.length };
  }, [sales]);

  const exportPdf = () => {
    const doc = new jsPDF();
    const title = tab === "daily" ? `Daily Sales Report — ${format(new Date(day), "MMM d, yyyy")}` : `Monthly Sales Report — ${format(new Date(month + "-01"), "MMMM yyyy")}`;

    doc.setFontSize(16);
    doc.text("Smart Business Manager", 14, 18);
    doc.setFontSize(11);
    doc.text(title, 14, 26);
    doc.setFontSize(9);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 32);

    autoTable(doc, {
      startY: 40,
      head: [["Summary", "Value"]],
      body: [
        ["Total transactions", String(stats.count)],
        ["Items sold", String(stats.items)],
        ["Revenue", fmtMoney(stats.revenue)],
        ["Profit", fmtMoney(stats.profit)],
      ],
      headStyles: { fillColor: [30, 78, 60] },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Date", "Product", "Qty", "Unit", "Total"]],
      body: sales.map((s) => [
        format(new Date(s.created_at), "MMM d, h:mm a"),
        s.product_name,
        String(s.quantity),
        fmtMoney(Number(s.unit_price)),
        fmtMoney(Number(s.total)),
      ]),
      headStyles: { fillColor: [30, 78, 60] },
    });

    const filename = tab === "daily" ? `sales-${day}.pdf` : `sales-${month}.pdf`;
    doc.save(filename);
    toast.success("PDF exported");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Track revenue, profit and export to PDF.</p>
          </div>
          <Button onClick={exportPdf} className="bg-gradient-accent text-accent-foreground">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily" className="space-y-4 pt-4">
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} className="w-auto" />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="monthly" className="space-y-4 pt-4">
            <div className="flex items-end gap-3">
              <div className="space-y-2">
                <Label>Month</Label>
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Transactions" value={stats.count} icon={FileBarChart} tone="default" />
          <StatCard label="Items Sold" value={stats.items} icon={ShoppingBag} tone="accent" />
          <StatCard label="Revenue" value={fmtMoney(stats.revenue)} icon={TrendingUp} tone="success" />
          <StatCard label="Profit" value={fmtMoney(stats.profit)} icon={DollarSign} tone="warning" />
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-display">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No sales in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(s.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell className="font-medium">{s.product_name}</TableCell>
                        <TableCell>{s.quantity}</TableCell>
                        <TableCell className="text-right">{fmtMoney(Number(s.unit_price))}</TableCell>
                        <TableCell className="text-right font-semibold">{fmtMoney(Number(s.total))}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
