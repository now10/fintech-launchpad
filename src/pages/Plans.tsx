import { useState } from 'react';
import { usePaymentPlans, useCustomers, useMandates } from '@/hooks/useBusinessData';
import { useManagePaymentPlan } from '@/hooks/useSubscriptions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Repeat, Plus, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  paused: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-muted text-muted-foreground',
  completed: 'bg-primary/10 text-primary border-primary/20',
};

const PlansPage = () => {
  const { data: plans, isLoading } = usePaymentPlans();
  const { data: customers } = useCustomers();
  const { data: mandates } = useMandates();
  const manage = useManagePaymentPlan();

  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [mandateId, setMandateId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');

  const reset = () => { setCustomerId(''); setMandateId(undefined); setAmount(''); setEndDate(''); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !amount) { toast.error('Customer and amount required'); return; }
    try {
      await manage.mutateAsync({
        action: 'create',
        customer_id: customerId,
        mandate_id: mandateId,
        amount: parseFloat(amount),
        currency,
        frequency,
        start_date: startDate,
        end_date: endDate || undefined,
      });
      toast.success('Subscription created');
      setOpen(false);
      reset();
    } catch (err: any) {
      toast.error('Failed', { description: err.message });
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this subscription? This stops future automatic charges.')) return;
    try {
      await manage.mutateAsync({ action: 'cancel', plan_id: id });
      toast.success('Subscription cancelled');
    } catch (err: any) {
      toast.error('Failed', { description: err.message });
    }
  };

  if (isLoading) return <div className="flex justify-center h-64 items-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Repeat className="w-6 h-6 text-primary" /> Subscriptions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Recurring payment plans for your customers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />New Subscription</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Subscription</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {(customers ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mandate (optional)</Label>
                <Select value={mandateId ?? 'none'} onValueChange={v => setMandateId(v === 'none' ? undefined : v)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(mandates ?? []).filter((m: any) => !customerId || m.customer_id === customerId).map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.id.slice(0, 8)} — {m.status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="bg-muted border-border font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-muted border-border" />
                </div>
                <div className="space-y-2">
                  <Label>End date (optional)</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-muted border-border" />
                </div>
              </div>
              <Button className="w-full" disabled={manage.isPending}>{manage.isPending ? 'Creating...' : 'Create Subscription'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {(plans ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">No subscriptions yet. Create one to start collecting recurring payments automatically.</p>
      ) : (
        <div className="space-y-2">
          {(plans ?? []).map((plan: any, i: number) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {plan.currency === 'USD' ? '$' : plan.currency === 'GBP' ? '£' : '€'}{Number(plan.amount).toLocaleString()} <span className="text-xs text-muted-foreground">/ {plan.frequency}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.customers?.name ?? 'Customer'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Next: {plan.next_payment_date ?? '—'}{plan.end_date ? ` · Ends ${plan.end_date}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[plan.status] ?? ''}>{plan.status}</Badge>
                {plan.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => handleCancel(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansPage;
