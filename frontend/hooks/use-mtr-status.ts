import { useState, useEffect } from 'react';

export function useMTRStatus() {
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      // Create date object for current time
      const now = new Date();
      
      // Convert to HK time string to parse hours correctly regardless of local timezone
      const hkTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Hong_Kong',
        hour12: false,
        hour: 'numeric',
        minute: 'numeric'
      });

      const [hours, minutes] = hkTime.split(':').map(Number);
      
      // Check if time is between 01:00 and 06:00
      // 01:00 inclusive to 06:00 exclusive (01:00 - 05:59)
      const closed = hours >= 1 && hours < 6;
      
      setIsClosed(closed);
    };

    checkStatus();
    // Check every minute
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return { isClosed };
}
