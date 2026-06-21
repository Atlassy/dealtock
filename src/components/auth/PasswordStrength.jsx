import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function PasswordStrength({ password, onStrengthChange }) {
  const { t } = useTranslation();
  const [strength, setStrength] = useState("");
  const [checks, setChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    notCommon: true
  });

  useEffect(() => {
    if (!password) {
      setStrength("");
      onStrengthChange("");
      setChecks({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        notCommon: true
      });
      return;
    }

    // Common passwords to reject
    const commonPasswords = [
      'password', '123456', 'qwerty', 'admin', 'welcome',
      'password123', '123456789', 'letmein', 'monkey'
    ];

    // Update checks
    const newChecks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      notCommon: !commonPasswords.includes(password.toLowerCase())
    };
    
    setChecks(newChecks);

    // Calculate weighted score
    let score = 0;
    if (password.length >= 12) score += 3;
    else if (password.length >= 8) score += 1;

    if (newChecks.uppercase) score += 1;
    if (newChecks.lowercase) score += 1;
    if (newChecks.number) score += 1;
    if (newChecks.special) score += 2; // Extra weight for special chars
    
    if (!newChecks.notCommon) score = 0; // Common password = zero

    // Determine strength
    let result = "";
    if (score === 0) result = "Very Weak";
    else if (score <= 3) result = "Weak";
    else if (score <= 6) result = "Medium";
    else result = "Strong";

    setStrength(result);
    onStrengthChange(result);
  }, [password, onStrengthChange]);

  const getColor = () => {
    switch(strength) {
      case "Very Weak": return "text-red-700";
      case "Weak": return "text-red-600";
      case "Medium": return "text-yellow-600";
      case "Strong": return "text-green-600";
      default: return "text-gray-500";
    }
  };

  const getBgColor = () => {
    switch(strength) {
      case "Very Weak": return "bg-red-100";
      case "Weak": return "bg-red-50";
      case "Medium": return "bg-yellow-50";
      case "Strong": return "bg-green-50";
      default: return "bg-gray-50";
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case "Very Weak": return t('auth.passwordStrength.veryWeak');
      case "Weak": return t('auth.passwordStrength.weak');
      case "Medium": return t('auth.passwordStrength.medium');
      case "Strong": return t('auth.passwordStrength.strong');
      default: return "";
    }
  };

  return (
    <div className={`p-3 rounded ${getBgColor()}`}>
      <p className={`text-sm font-semibold ${getColor()} mb-2`}>
        {strength ? t('auth.passwordStrength.strengthLabel', { strength: getStrengthLabel() }) : t('auth.passwordStrength.enterPassword')}
      </p>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full ${
            strength === "Very Weak" ? "w-1/4 bg-red-500" :
            strength === "Weak" ? "w-1/2 bg-red-400" :
            strength === "Medium" ? "w-3/4 bg-yellow-500" :
            strength === "Strong" ? "w-full bg-green-500" : "w-0"
          }`}
        />
      </div>

      {/* Requirements checklist */}
      <div className="text-xs space-y-1">
        <div className={`flex items-center ${checks.length ? "text-green-600" : "text-red-500"}`}>
          <span className="mr-2">{checks.length ? "✓" : "✗"}</span>
          {t('auth.passwordStrength.atLeast8')} {password.length >= 12 && t('auth.passwordStrength.bonus12')}
        </div>
        <div className={`flex items-center ${checks.uppercase ? "text-green-600" : "text-red-500"}`}>
          <span className="mr-2">{checks.uppercase ? "✓" : "✗"}</span>
          {t('auth.passwordStrength.uppercase')}
        </div>
        <div className={`flex items-center ${checks.number ? "text-green-600" : "text-red-500"}`}>
          <span className="mr-2">{checks.number ? "✓" : "✗"}</span>
          {t('auth.passwordStrength.number')}
        </div>
        <div className={`flex items-center ${checks.special ? "text-green-600" : "text-red-500"}`}>
          <span className="mr-2">{checks.special ? "✓" : "✗"}</span>
          {t('auth.passwordStrength.special')}
        </div>
        <div className={`flex items-center ${checks.notCommon ? "text-green-600" : "text-red-500"}`}>
          <span className="mr-2">{checks.notCommon ? "✓" : "✗"}</span>
          {t('auth.passwordStrength.notCommon')}
        </div>
      </div>
    </div>
  );
}