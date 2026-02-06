import { Link } from "react-router-dom";

export default function PasswordUpdated() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow rounded text-center">
        <h2 className="text-2xl font-bold mb-4">Password Updated</h2>
        <p className="mb-6">Your password has been successfully changed.</p>

        <Link to="/login" className="text-blue-600 underline">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
