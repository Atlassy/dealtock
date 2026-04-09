// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import EmailConfirmation from "./components/auth/EmailConfirmation";
import CheckEmail from "./components/auth/CheckEmail";
import PasswordUpdated from "./components/auth/PasswordUpdated";
import Login from "./components/auth/login";
import SignUpForm from "./components/auth/SignUpForm";
import Dashboard from "./components/dashboard/Dashboard";
import ProfilePage from "./components/ProfilePage";
import Navbar from "./components/Navbar";
import MarketplacePage from "./components/marketplace/MarketplacePage";
import CartPage from "./components/marketplace/CartPage";
import Inventory from "./components/dashboard/seller/Inventory";
import { Toaster } from "sonner";

// Dropshipper components
import DropshipperOrders from "./components/dashboard/dropshipper/DropshipperOrders";
import DropshipperCustomersPage from "./components/dashboard/dropshipper/DropshipperCustomersPage";
import DropshipperEarningsPage from "./components/dashboard/dropshipper/DropshipperEarningsPage";

export default function App() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster richColors position="top-right" />
      
      {/* Unified Navbar - Shows for all users */}
      <Navbar />

      {/* Main content with proper padding for navbar */}
      <div className={`pt-16 ${user ? 'pl-16' : ''}`}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/cart" element={<CartPage />} />
          
          {/* Auth routes */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUpForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/password-updated" element={<PasswordUpdated />} />
          <Route path="/email-confirmation" element={<EmailConfirmation />} />

          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <div className="pl-16">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <div className="pl-16">
                  <Inventory />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div className="pl-16">
                  <ProfilePage />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Dropshipper Routes */}
          <Route
            path="/dropshipper/orders"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <div className="pl-16">
                  <DropshipperOrders dropshipperId={user?.id} />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dropshipper/customers"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <div className="pl-16">
                  <DropshipperCustomersPage dropshipperId={user?.id} />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dropshipper/earnings"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <div className="pl-16">
                  <DropshipperEarningsPage dropshipperId={user?.id} />
                </div>
              </ProtectedRoute>
            }
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}