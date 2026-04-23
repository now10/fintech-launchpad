import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, Shield, Zap, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

type TokenInfo = {
  customer_name: string;
  customer_email: string;
  business_name: string;
  scheme: string;
  status: string;
  expires_at: string;
};

const PublicMandatePage = () => {
  const { token } = useParams<{ token: string }>();
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [iban, setIban] = useState('');
  const [holder, setHolder] = useState('');

  const fnUrl = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/public-mandate`;

  useEffect(() => {
    if (!token) return;
    fetch(`${fnUrl}?token=${encodeURIComponent(token)}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setError(d.error ?? 'Invalid link'); return; }
        setInfo(d);
        setHolder(d.customer_name);
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, [token, fnUrl]);

  const handleAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iban || !holder) return;
    setSubmitting(true);
    try {
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, iban: iban.replace(/\s+/g, ''), account_holder_name: holder }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? 'Failed');
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">AutoCollect</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : error && !info ? (
            <div className="text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Link unavailable</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              <h2 className="text-lg font-semibold text-foreground">Mandate authorized</h2>
              <p className="text-sm text-muted-foreground">
                Thank you, {info?.customer_name}. {info?.business_name} can now collect payments from your account in accordance with the mandate.
              </p>
            </div>
          ) : info ? (
            <>
              <h1 className="text-xl font-bold text-foreground mb-1">Authorize direct debit</h1>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-foreground">{info.business_name}</strong> is requesting authorization to collect payments from your bank account using the {info.scheme.toUpperCase()} scheme.
              </p>

              {info.status !== 'pending' ? (
                <div className="border border-warning/30 bg-warning/5 rounded-lg p-3 text-sm text-foreground">
                  This link has already been used.
                </div>
              ) : (
                <form onSubmit={handleAuthorize} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Account holder name</Label>
                    <Input value={holder} onChange={e => setHolder(e.target.value)} required className="bg-muted border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input value={iban} onChange={e => setIban(e.target.value.toUpperCase())} placeholder="DE89 3704 0044 0532 0130 00" required className="bg-muted border-border font-mono" />
                  </div>
                  <div className="border border-border rounded-lg p-3 text-xs text-muted-foreground flex gap-2">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>By submitting, you authorize {info.business_name} to debit your account. You may cancel this authorization at any time by contacting your bank.</span>
                  </div>
                  {error && <p className="text-xs text-destructive">{error}</p>}
                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? 'Authorizing...' : 'Authorize mandate'}
                  </Button>
                </form>
              )}
            </>
          ) : null}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">Secured by AutoCollect · Encrypted in transit</p>
      </motion.div>
    </div>
  );
};

export default PublicMandatePage;
