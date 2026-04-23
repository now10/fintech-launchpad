import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import CustomersPage from "@/pages/Customers";
import MandatesPage from "@/pages/Mandates";
import PaymentsPage from "@/pages/Payments";
import PlansPage from "@/pages/Plans";
import WalletPage from "@/pages/WalletPage";
import BankAccountsPage from "@/pages/BankAccounts";
import PayoutsPage from "@/pages/Payouts";
import LedgerPage from "@/pages/Ledger";
import SettingsPage from "@/pages/Settings";
import AdminPage from "@/pages/Admin";
import PublicMandate from "@/pages/PublicMandate";
import NotFound from "./pages/NotFound";
import OAuthCallback from "./pages/OAuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/pay/:token" element={<PublicMandate />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/mandates" element={<MandatesPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/bank-accounts" element={<BankAccountsPage />} />
              <Route path="/payouts" element={<PayoutsPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
