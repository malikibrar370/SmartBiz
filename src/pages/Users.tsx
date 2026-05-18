import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
}

interface Row extends Profile {
  roles: ("admin" | "staff")[];
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const rolesByUser = new Map<string, ("admin" | "staff")[]>();
    (roles ?? []).forEach((r) => {
      const list = rolesByUser.get(r.user_id) ?? [];
      list.push(r.role as "admin" | "staff");
      rolesByUser.set(r.user_id, list);
    });
    setRows(
      (profiles ?? []).map((p) => ({
        ...p,
        roles: rolesByUser.get(p.id) ?? [],
      })),
    );
  };

  const promote = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    if (error) toast.error(error.message);
    else {
      toast.success("Promoted to admin");
      void load();
    }
  };

  const demote = async (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error("You can't remove your own admin role.");
      return;
    }
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    if (error) toast.error(error.message);
    else {
      toast.success("Admin role removed");
      void load();
    }
  };

  return (
    <AppLayout adminOnly>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage staff accounts and admin privileges.</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Users className="h-5 w-5" /> All Users ({rows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              💡 New staff sign up themselves on the login page. The first registered account becomes admin automatically. Use the buttons below to promote or demote users.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const isAdmin = r.roles.includes("admin");
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{r.email}</TableCell>
                        <TableCell className="space-x-1">
                          {r.roles.map((role) => (
                            <Badge
                              key={role}
                              className={role === "admin" ? "bg-gradient-primary text-primary-foreground" : ""}
                              variant={role === "admin" ? "default" : "secondary"}
                            >
                              {role}
                            </Badge>
                          ))}
                          {r.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => demote(r.id)}
                              disabled={r.id === currentUser?.id}
                            >
                              <ShieldOff className="mr-1 h-4 w-4" /> Remove admin
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => promote(r.id)}>
                              <Shield className="mr-1 h-4 w-4" /> Make admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
