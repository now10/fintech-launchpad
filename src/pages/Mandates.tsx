import { useState } from 'react';
import { useMandates, useCustomers, useCreateMandate, useDeleteMandate } from '@/hooks/useBusinessData';
import { useCreateMandateLink } from '@/hooks/useSubscriptions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Plus, ExternalLink, Loader2, Trash2, Link2, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  active: 'bg-success/10 text-success border-success/20',
  pending: 'bg-warning/10 text-warning border-warning/20',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
  expired: 'bg-muted text-muted-foreground',
};

const MandatesPage = () => {
  const { data: mandates, isLoading } = useMandates();
  const { data: customers } = useCustomers();
  const createMandate = useCreateMandate();
  const deleteMandate = useDeleteMandate();
  const createLink = useCreateMandateLink();
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [scheme, setScheme] = useState('sepa_core');
  const [linkEmail, setLinkEmail] = useState('');
  const [linkName, setLinkName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail || !linkName) { toast.error('Name and email required'); return; }
    try {
      const r = await createLink.mutateAsync({ customer_email: linkEmail, customer_name: linkName, scheme });
      setGeneratedLink(r.url);
      toast.success('Authorization link created');
    } catch (err: any) {
      toast.error('Failed', { description: err.message });
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreate = async () => {
    if (!selectedCustomer) {
      toast.error('Select a customer');
      return;
    }
    try {
      const result = await createMandate.mutateAsync({ customer_id: selectedCustomer, scheme });
      if (result?.approval_url) {
        window.open(result.approval_url as string, '_blank', 'noopener,noreferrer');
      }
      toast.success('Mandate created successfully!', {
        description: result?.approval_url
          ? 'Open the new tab to complete customer authorization (if the browser blocked it, check the popup).'
          : 'Mandate has been recorded locally. Connect GoCardless and ensure the customer has IBAN (SEPA) or US routing + account (ACH) plus GoCardless sync for live mandates.',
      });
      setOpen(false);
      setSelectedCustomer('');
      setScheme('sepa_core');
    } catch (err: any) {
      toast.error('Failed to create mandate', { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMandate.mutateAsync(id);
      toast.success('Mandate removed');
    } catch (err: any) {
      toast.error('Failed', { description: err.message });
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mandates</h1>
          <p className="text-sm text-muted-foreground mt-1">SEPA & ACH Direct Debit mandates</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={linkOpen} onOpenChange={(v) => { setLinkOpen(v); if (!v) { setGeneratedLink(null); setLinkEmail(''); setLinkName(''); } }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Link2 className="w-4 h-4 mr-2" />Send Auth Link</Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border">
              <DialogHeader><DialogTitle>Generate customer authorization link</DialogTitle></DialogHeader>
              {generatedLink ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Share this link with your customer. They can authorize without an account. Expires in 7 days.</p>
                  <div className="flex gap-2">
                    <Input readOnly value={generatedLink} className="bg-muted border-border font-mono text-xs" />
                    <Button size="sm" onClick={handleCopy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleGenerateLink}>
                  <div className="space-y-2"><Label>Customer name</Label><Input value={linkName} onChange={e => setLinkName(e.target.value)} required className="bg-muted border-border" /></div>
                  <div className="space-y-2"><Label>Customer email</Label><Input type="email" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} required className="bg-muted border-border" /></div>
                  <div className="space-y-2">
                    <Label>Scheme</Label>
                    <Select value={scheme} onValueChange={setScheme}>
                      <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sepa_core">SEPA Core (EUR)</SelectItem>
                        <SelectItem value="ach">ACH (USD)</SelectItem>
                        <SelectItem value="bacs">BACS (GBP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={createLink.isPending}>{createLink.isPending ? 'Generating...' : 'Generate link'}</Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" />Create Mandate</Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border">
              <DialogHeader><DialogTitle>Create Direct Debit Mandate</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue placeholder="Select customer" /></SelectTrigger>
                    <SelectContent>
                      {(customers ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name} – {c.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Scheme</Label>
                  <Select value={scheme} onValueChange={setScheme}>
                    <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sepa_core">SEPA Core (EUR)</SelectItem>
                      <SelectItem value="ach">ACH Transfer (USD)</SelectItem>
                      <SelectItem value="bacs">BACS (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={createMandate.isPending}>
                  {createMandate.isPending ? 'Creating...' : 'Create Mandate'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(mandates ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No mandates yet. Create one by selecting a customer.</p>
      ) : (
        <div className="space-y-2">
          {(mandates ?? []).map((mandate: any, i: number) => (
            <motion.div key={mandate.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground">{mandate.customers?.name ?? 'Unknown'}</p>
                  <Badge className={statusColors[mandate.status] ?? ''}>{mandate.status}</Badge>
                </div>
                {mandate.gocardless_id && <p className="text-xs text-muted-foreground font-mono">{mandate.gocardless_id}</p>}
                <p className="text-xs text-muted-foreground">Created {new Date(mandate.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ExternalLink className="w-3 h-3 mr-1" /> View
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(mandate.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MandatesPage;
