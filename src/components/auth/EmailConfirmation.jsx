import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EmailConfirmation() {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const resendEmail = async () => {
    setError("");

    const user = (await supabase.auth.getUser()).data?.user;
    if (!user) {
      setError("You must login again to resend confirmation email.");
      return;
    }

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
    });

    if (error) setError(error.message);
    else setResent(true);
  };

  return (
    <div className="h-screen flex items-center justify-center px-6">
      <div className="bg-white shadow border p-8 max-w-md w-full rounded">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Confirm Your Email
        </h2>

        <p className="text-gray-700 mb-4 leading-relaxed">
          We sent a confirmation link to your email.
          <br />
          Please click the link to activate your account.
        </p>

        {resent ? (
          <p className="text-green-600 mb-4">A new confirmation email was sent.</p>
        ) : (
          <button
            onClick={resendEmail}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mb-3"
          >
            Resend Confirmation Email
          </button>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
