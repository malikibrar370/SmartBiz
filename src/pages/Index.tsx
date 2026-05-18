import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Package, ShoppingCart, FileBarChart, Users, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const features = [
  { icon: Package, title: "Inventory", desc: "Add, edit, and track products with real-time stock." },
  { icon: ShoppingCart, title: "Sales", desc: "Record orders in seconds — totals calculated automatically." },
  { icon: FileBarChart, title: "Reports", desc: "Daily & monthly insights with one-click PDF export." },
  { icon: Users, title: "Staff Roles", desc: "Admin & staff accounts with secure permissions." },
  { icon: Shield, title: "Low-Stock Alerts", desc: "Get warned before you run out of best-sellers." },
];

const Index = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elegant">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-tight">Smart Manager</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Business Suite</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="container py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Built for tailoring shops, retailers & small enterprises
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-7xl">
            Run your shop,
            <span className="block bg-gradient-primary bg-clip-text text-transparent">not your spreadsheet.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            A clean, modern dashboard to manage inventory, record sales, and generate reports — designed for businesses like Malik Tailors.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-elegant">
              <Link to="/auth">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container pb-20">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60 shadow-elegant transition-transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          Smart Business Manager — Built for small enterprises.
        </div>
      </footer>
    </div>
  );
};

export default Index;
