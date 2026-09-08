import React from 'react';
import { Check } from 'lucide-react';

export default function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="toast-notification">
      <Check size={16} color="#4ade80" />
      <span>{message}</span>
    </div>
  );
}
