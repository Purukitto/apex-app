import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { calculatePasswordStrength, getPasswordLengthStatus } from '../lib/passwordStrength';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface RequirementItemProps {
  met: boolean;
  label: string;
}

const RequirementItem = ({ met, label }: RequirementItemProps) => (
  <div className="flex items-center gap-2 text-sm">
    {met ? (
      <Check size={16} className="text-apex-green shrink-0" />
    ) : (
      <X size={16} className="text-apex-white/40 shrink-0" />
    )}
    <span className={met ? 'text-apex-white' : 'text-apex-white/60'}>
      {label}
    </span>
  </div>
);

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = calculatePasswordStrength(password);
  const lengthStatus = getPasswordLengthStatus(password);

  // Don't render anything if password is empty to prevent layout issues
  if (!password) {
    return null;
  }

  const getStrengthBarColor = () => {
    switch (strength.level) {
      case 'weak':
        return 'bg-apex-red';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-apex-green';
      default:
        return 'bg-apex-white/20';
    }
  };

  const getStrengthBarWidth = () => {
    return `${(strength.score / 5) * 100}%`;
  };

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-apex-white/60">Password Strength</span>
          <span
            className={`font-semibold ${
              strength.level === 'strong'
                ? 'text-apex-green'
                : strength.level === 'medium'
                  ? 'text-yellow-500'
                  : 'text-apex-red'
            }`}
          >
            {strength.level.toUpperCase()}
          </span>
        </div>
        <div className="h-1.5 bg-apex-white/10 rounded-full overflow-hidden">
          <motion.div
            key={password}
            initial={{ width: 0 }}
            animate={{ width: getStrengthBarWidth() }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full ${getStrengthBarColor()} rounded-full`}
          />
        </div>
      </div>

      {/* Length Indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-apex-white/60">Length</span>
          <span
            className={`font-mono ${
              lengthStatus.meetsRequired
                ? 'text-apex-green'
                : lengthStatus.meetsRecommended
                  ? 'text-yellow-500'
                  : lengthStatus.meetsMin
                    ? 'text-apex-white/60'
                    : 'text-apex-red'
            }`}
          >
            {lengthStatus.current} / {lengthStatus.required} characters
          </span>
        </div>
        {lengthStatus.current < lengthStatus.required && (
          <div className="text-xs text-apex-white/40">
            Minimum {lengthStatus.required} characters required
          </div>
        )}
      </div>

      {/* Requirements Checklist */}
      <div className="space-y-2 pt-1 border-t border-apex-white/10">
        <div className="text-xs text-apex-white/60 mb-2">
          Password Requirements:
        </div>
        <div className="space-y-1.5">
          <RequirementItem
            met={strength.requirements.hasMinLength}
            label={`At least ${lengthStatus.required} characters`}
          />
          <RequirementItem
            met={strength.requirements.hasLowercase}
            label="Lowercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasUppercase}
            label="Uppercase letter"
          />
          <RequirementItem
            met={strength.requirements.hasDigit}
            label="Number"
          />
          <RequirementItem
            met={strength.requirements.hasSymbol}
            label="Special character"
          />
        </div>
      </div>
    </div>
  );
}
