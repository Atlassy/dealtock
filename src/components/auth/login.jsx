import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { data, error } = await signIn(email, password);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundColor: "#f8fafc",
      padding: "1rem"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "28rem",
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "0.5rem",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }}>
        {/* Dealtock Logo Section */}
        <div style={{ 
          textAlign: "center", 
          marginBottom: "1.5rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Logo Image */}
          <div style={{
            width: "80px",
            height: "80px",
            marginBottom: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img src="https://i.ibb.co/PGkjFhwv/Dealtock.png"
              alt="Dealtock Logo" 
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain"
              }}
              onError={(e) => {
                // Fallback if image fails to load
                e.target.style.display = 'none';
                const parent = e.target.parentElement;
                parent.innerHTML = `
                  <div style="
                    width: 100%;
                    height: 100%;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
                  ">
                    <span style="
                      color: white;
                      font-weight: bold;
                      font-size: 1.5rem;
                    ">D</span>
                  </div>
                `;
              }}
            />
          </div>
          
          {/* Brand Name */}
          <h1 style={{
            fontSize: "1.875rem",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
            marginBottom: "0.25rem"
          }}>
            Dealtock
          </h1>
          
          {/* Tagline */}
          <p style={{
            color: "#6b7280",
            fontSize: "0.875rem",
            fontWeight: "500"
          }}>
Version 1.0          </p>
        </div>

        <h2 style={{
          fontSize: "1.25rem",
          fontWeight: "600",
          marginBottom: "1.5rem",
          textAlign: "center",
          color: "#1f2937"
        }}>
          Welcome Back
        </h2>

        {errorMsg && (
          <div style={{
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            padding: "0.75rem",
            borderRadius: "0.375rem",
            marginBottom: "1rem",
            fontSize: "0.875rem",
            textAlign: "center",
            border: "1px solid #fca5a5"
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "0.5rem"
            }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.375rem",
                fontSize: "0.875rem"
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem"
            }}>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#374151"
              }}>
                Password
              </label>
              <Link 
                to="/forgot-password" 
                style={{ 
                  fontSize: "0.75rem",
                  color: "#2563eb", 
                  textDecoration: "none"
                }}
              >
                Forgot password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  paddingRight: "0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem"
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#4b5563",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.25rem"
                }}
                onClick={() => setShowPwd(!showPwd)}
              >
                {showPwd ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              fontWeight: "600",
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              transition: "background-color 0.2s",
              marginTop: "0.5rem"
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#2563eb";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = "#3b82f6";
              }
            }}
          >
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "1rem",
                  height: "1rem",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite"
                }} />
                Signing in...
              </div>
            ) : "Sign In"}
          </button>
        </form>

        <div style={{ 
          marginTop: "1.5rem", 
          textAlign: "center", 
          color: "#6b7280",
          fontSize: "0.875rem",
          paddingTop: "1.5rem",
          borderTop: "1px solid #e5e7eb"
        }}>
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            style={{ 
              color: "#2563eb", 
              textDecoration: "none",
              fontWeight: "500"
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
            onMouseLeave={(e) => e.target.style.textDecoration = "none"}
          >
            Create account
          </Link>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: "2rem", 
          textAlign: "center", 
          color: "#9ca3af",
          fontSize: "0.75rem"
        }}>
          <p>© {new Date().getFullYear()} Dealtock. All rights reserved.</p>
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}