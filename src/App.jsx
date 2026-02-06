import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import EmailConfirmation from "./components/auth/EmailConfirmation";
import CheckEmail from "./components/auth/CheckEmail";
import PasswordUpdated from "./components/auth/PasswordUpdated";
import Login from "./components/auth/login"; // ✅ Changed from Login to login
import SignUpForm from "./components/auth/SignUpForm";
import Dashboard from "./components/dashboard/Dashboard";
import ProfilePage from "./components/ProfilePage";
import Navbar from "./components/Navbar";
import { Toaster } from "sonner";

export default function App() {
  const { user, loading } = useAuth(); // ✅ FIXED: Changed from useAuthContext to useAuth

  // While session is loading → show loading screen
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Loading...
      </div>
    );
  }

  return (
  
    <div className="min-h-screen bg-neutral-50">
	<Toaster richColors position="top-right" />
      {/* Show navbar only if logged in */}
      {user && <Navbar />} {/* ✅ FIXED: Changed from session to user */}

      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/password-updated" element={<PasswordUpdated />} />
        <Route path="/email-confirmation" element={<EmailConfirmation />} />

        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" replace /> : <SignUpForm />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
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

        {/* Default redirect */}
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}