import { useMemo, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export default function OtpInput({
  length,
  value,
  onChange,
  disabled = false,
  ariaLabel = 'OTP code',
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const normalized = value.replace(/\D/g, '').slice(0, length);
    return Array.from({ length }, (_, index) => normalized[index] || '');
  }, [value, length]);

  const updateValue = (index: number, digit: string) => {
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(''));
  };

  const handleChange = (index: number, nextValue: string) => {
    const digit = nextValue.replace(/\D/g, '').slice(0, 1);
    updateValue(index, digit);
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace') return;
    if (digits[index]) {
      updateValue(index, '');
      return;
    }
    if (index > 0) {
      inputsRef.current[index - 1]?.focus();
      updateValue(index - 1, '');
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    event.preventDefault();
    const activeIndex = inputsRef.current.findIndex(
      (input) => input === document.activeElement
    );
    const startIndex = activeIndex >= 0 ? activeIndex : 0;
    const next = [...digits];
    for (let i = 0; i < length - startIndex; i += 1) {
      next[startIndex + i] = pasted[i] || next[startIndex + i];
    }
    onChange(next.join('').slice(0, length));
    const focusIndex = Math.min(startIndex + pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={`${ariaLabel}-${index}`}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${index + 1}`}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-11 w-10 rounded-lg border border-apex-white/20 bg-apex-black/50 text-base text-apex-white font-mono text-center focus:outline-none focus:border-apex-green transition-colors disabled:opacity-60"
        />
      ))}
    </div>
  );
}
