import { Link } from "react-router-dom";

export default function CheckEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded text-center">
        <h2 className="text-2xl font-bold mb-4">Check your email</h2>
        <p className="mb-6">
          We’ve sent you a password reset link.  
          Please check your inbox.
        </p>

        <Link to="/login" className="text-blue-600 underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
