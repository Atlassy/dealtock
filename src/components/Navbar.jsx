import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/SupabaseAuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Link to="/" className="font-bold text-xl">
        Dealtock
      </Link>

      <div className="space-x-4">
        {user ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button
              onClick={signOut}
              className="text-red-600 underline"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/login">Connexion</Link>
        )}
      </div>
    </nav>
  );
}
