import { useState } from 'react';
import { useIsAdmin, useAdminBusinesses, useAdminWebhookEvents, useAdminFailedPayments, useAuditLog } from '@/hooks/useAdmin';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Building2, Webhook, ScrollText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navigate } from 'react-router-dom';

const AdminPage = () => {
  const { data: isAdmin, isLoading: checking } = useIsAdmin();
  const { data: businesses } = useAdminBusinesses();
  const { data: webhooks } = useAdminWebhookEvents();
  const { data: failed } = useAdminFailedPayments();
  const { data: audit } = useAuditLog();

  if (checking) {
    return <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-2">
        <Shield className="w-10 h-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Admin access required</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You don't have admin privileges. An existing admin must grant you the admin role from the backend.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin Console
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Cross-business overview, webhook monitoring and audit trail</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Businesses" value={businesses?.length ?? 0} icon={Building2} />
        <StatTile label="Webhook events (100)" value={webhooks?.length ?? 0} icon={Webhook} />
        <StatTile label="Failed payments" value={failed?.length ?? 0} icon={AlertTriangle} tone="warn" />
        <StatTile label="Audit entries" value={audit?.length ?? 0} icon={ScrollText} />
      </div>

      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks">Webhook events</TabsTrigger>
          <TabsTrigger value="failed">Failed payments</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="mt-4">
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Time</th><th className="py-2 px-2">Source</th><th className="py-2 px-2">Event</th><th className="py-2 px-2">External ID</th><th className="py-2 px-2">Processed</th>
              </tr></thead>
              <tbody>
                {(webhooks ?? []).map((w: any) => (
                  <tr key={w.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2"><Badge variant="outline" className="capitalize">{w.source}</Badge></td>
                    <td className="py-2 px-2 text-foreground">{w.event_type}</td>
                    <td className="py-2 px-2 text-xs font-mono text-muted-foreground truncate max-w-[200px]">{w.external_id ?? '—'}</td>
                    <td className="py-2 px-2"><Badge variant={w.processed ? 'default' : 'secondary'}>{w.processed ? 'yes' : 'no'}</Badge></td>
                  </tr>
                ))}
                {(webhooks ?? []).length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No webhook events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="failed" className="mt-4">
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Time</th><th className="py-2 px-2">Amount</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Business</th><th className="py-2 px-2">Provider ID</th>
              </tr></thead>
              <tbody>
                {(failed ?? []).map((p: any) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2 font-mono">{p.currency === 'USD' ? '$' : '€'}{Number(p.amount).toLocaleString()}</td>
                    <td className="py-2 px-2"><Badge variant="destructive">{p.status}</Badge></td>
                    <td className="py-2 px-2 text-xs font-mono text-muted-foreground">{p.business_id?.slice(0, 8)}</td>
                    <td className="py-2 px-2 text-xs font-mono text-muted-foreground">{p.gocardless_payment_id ?? '—'}</td>
                  </tr>
                ))}
                {(failed ?? []).length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No failed payments. 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="businesses" className="mt-4">
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Name</th><th className="py-2 px-2">Country</th><th className="py-2 px-2">Mode</th><th className="py-2 px-2">Created</th>
              </tr></thead>
              <tbody>
                {(businesses ?? []).map((b: any) => (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-2 text-foreground">{b.name}</td>
                    <td className="py-2 px-2 text-muted-foreground">{b.country || '—'}</td>
                    <td className="py-2 px-2"><Badge variant={b.mode === 'live' ? 'default' : 'secondary'}>{b.mode}</Badge></td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="glass-card rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2">Time</th><th className="py-2 px-2">Actor</th><th className="py-2 px-2">Action</th><th className="py-2 px-2">Resource</th>
              </tr></thead>
              <tbody>
                {(audit ?? []).map((a: any) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="py-2 px-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{a.actor_email ?? a.actor_id?.slice(0, 8) ?? 'system'}</td>
                    <td className="py-2 px-2 text-foreground font-mono text-xs">{a.action}</td>
                    <td className="py-2 px-2 text-xs text-muted-foreground">{a.resource_type}/{a.resource_id?.slice(0, 8)}</td>
                  </tr>
                ))}
                {(audit ?? []).length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No audit entries yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatTile = ({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone?: 'warn' }) => (
  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Icon className={`w-4 h-4 ${tone === 'warn' ? 'text-warning' : 'text-muted-foreground'}`} />
    </div>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
  </motion.div>
);

export default AdminPage;
