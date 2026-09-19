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
import MyOrders from "./components/MyOrders";
import Navbar from "./components/Navbar";

import MarketplacePage from "./components/marketplace/MarketplacePage";
import CartPage from "./components/marketplace/CartPage";

import Inventory from "./components/dashboard/seller/Inventory";

// Admin components
import ProductListingManagement from "./components/dashboard/admin/products/ProductListingManagement";

// Dropshipper components
import DropshipperOrders from "./components/dashboard/dropshipper/DropshipperOrders";
import DropshipperCustomersPage from "./components/dashboard/dropshipper/DropshipperCustomersPage";
import DropshipperEarningsPage from "./components/dashboard/dropshipper/DropshipperEarningsPage";

import { Toaster } from "sonner";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster richColors position="top-right" />

      {/* Unified Navbar - Shows for all users */}
      <Navbar />

      {/* Main application content */}
      <div className={user ? "pl-16" : ""}>
        <Routes>
          {/* =============================================================== */}
          {/* PUBLIC ROUTES                                                    */}
          {/* =============================================================== */}

          <Route path="/" element={<MarketplacePage />} />

          <Route path="/marketplace" element={<MarketplacePage />} />

          <Route path="/cart" element={<CartPage />} />

          {/* =============================================================== */}
          {/* AUTH ROUTES                                                      */}
          {/* =============================================================== */}

          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          <Route
            path="/signup"
            element={
              user ? <Navigate to="/dashboard" replace /> : <SignUpForm />
            }
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/check-email"
            element={<CheckEmail />}
          />

          <Route
            path="/password-updated"
            element={<PasswordUpdated />}
          />

          <Route
            path="/email-confirmation"
            element={<EmailConfirmation />}
          />

          {/* =============================================================== */}
          {/* GENERAL PROTECTED ROUTES                                         */}
          {/* =============================================================== */}

          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />

          {/* =============================================================== */}
          {/* ADMIN ROUTES                                                     */}
          {/* =============================================================== */}

          {/* Admin Product Listing Management
              Navbar:
              Products / Inventory
                -> Approve Product Listing
          */}
          <Route
            path="/admin/products/approve"
            element={
              <ProtectedRoute requiredRole="admin">
                <ProductListingManagement />
              </ProtectedRoute>
            }
          />

          {/* Parent route redirects to the product listing management page */}
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute requiredRole="admin">
                <Navigate
                  to="/admin/products/approve"
                  replace
                />
              </ProtectedRoute>
            }
          />

          {/* =============================================================== */}
          {/* DROPSHIPPER ROUTES                                               */}
          {/* =============================================================== */}

          <Route
            path="/dropshipper/orders"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <DropshipperOrders dropshipperId={user?.id} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dropshipper/customers"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <DropshipperCustomersPage dropshipperId={user?.id} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dropshipper/earnings"
            element={
              <ProtectedRoute requiredRole="dropshipper">
                <DropshipperEarningsPage dropshipperId={user?.id} />
              </ProtectedRoute>
            }
          />

          {/* =============================================================== */}
          {/* CATCH-ALL                                                        */}
          {/* =============================================================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </div>
    </div>
  );
}
