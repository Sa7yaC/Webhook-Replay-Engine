import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckIcon } from '@hugeicons/core-free-icons';

export default function Toast({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="toast-notification">
      <HugeiconsIcon icon={CheckIcon} size={16} color="#4ade80" />
      <span>{message}</span>
    </div>
  );
}
