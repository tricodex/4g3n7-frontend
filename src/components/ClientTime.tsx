'use client';

import { useState, useEffect } from 'react';

interface ClientTimeProps {
  date: Date;
  format?: 'time' | 'date' | 'datetime';
  className?: string;
}

export default function ClientTime({ date, format = 'time', className = '' }: ClientTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string>('');
  
  useEffect(() => {
    // Only format the time on the client side
    if (format === 'time') {
      setFormattedTime(date.toLocaleTimeString());
    } else if (format === 'date') {
      setFormattedTime(date.toLocaleDateString());
    } else {
      setFormattedTime(date.toLocaleString());
    }
  }, [date, format]);
  
  // Return a placeholder during server rendering
  // and the actual time during client rendering
  return <span className={className}>{formattedTime}</span>;
}
