import { useEffect, useState } from "react";

export default function PasswordStrength({ password, onStrengthChange }) {
  const [strength, setStrength] = useState("");

  useEffect(() => {
    if (!password) {
      setStrength("");
      onStrengthChange("");
      return;
    }

    let score = 0;

    // Rules
    if (password.length >= 8) score++;          // Min length
    if (/[A-Z]/.test(password)) score++;        // Uppercase
    if (/[a-z]/.test(password)) score++;        // Lowercase
    if (/[0-9]/.test(password)) score++;        // Number
    if (/[^A-Za-z0-9]/.test(password)) score++; // Special char

    let result = "";

    if (score <= 2) result = "Weak";
    else if (score === 3 || score === 4) result = "Medium";
    else if (score === 5) result = "Strong";

    setStrength(result);
    onStrengthChange(result);
  }, [password]);

  const color =
    strength === "Strong"
      ? "text-green-600"
      : strength === "Medium"
      ? "text-yellow-600"
      : strength === "Weak"
      ? "text-red-600"
      : "text-gray-500";

  return (
    <p className={`text-sm font-medium ${color}`}>
      {strength ? `Password strength: ${strength}` : "Enter a password"}
    </p>
  );
}
