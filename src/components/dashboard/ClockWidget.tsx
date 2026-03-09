import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

interface HourLogData {
  id: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number | null;
  shift_date: string;
  employee_id: string;
}

interface ClockWidgetProps {
  userId: string;
  initialLog: HourLogData | null;
  supabaseUrl: string;
  supabaseKey: string;
}

export default function ClockWidget({
  userId,
  initialLog,
  supabaseUrl,
  supabaseKey,
}: ClockWidgetProps) {
  const [todayLog, setTodayLog] = useState<HourLogData | null>(initialLog);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient(supabaseUrl, supabaseKey);
  const isClockedIn = Boolean(todayLog?.clock_in && !todayLog?.clock_out);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClock = useCallback(async () => {
    setLoading(true);
    setStatus(null);

    try {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      if (isClockedIn && todayLog) {
        // Clock OUT
        const clockIn = new Date(todayLog.clock_in!);
        const clockOut = new Date(now);
        const hoursWorked =
          (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

        const { error } = await supabase
          .from('hour_logs')
          .update({
            clock_out: now,
            hours_worked: Math.round(hoursWorked * 100) / 100,
          })
          .eq('id', todayLog.id);

        if (error) throw error;

        setTodayLog({
          ...todayLog,
          clock_out: now,
          hours_worked: Math.round(hoursWorked * 100) / 100,
        });
        setStatus({ message: 'Clocked out successfully!', type: 'success' });
      } else {
        // Clock IN
        const { data, error } = await supabase
          .from('hour_logs')
          .insert({
            employee_id: userId,
            shift_date: today,
            clock_in: now,
            approval_status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        setTodayLog(data);
        setStatus({ message: 'Clocked in successfully!', type: 'success' });
      }
    } catch (err: any) {
      setStatus({ message: err.message || 'Something went wrong', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isClockedIn, todayLog, userId, supabase]);

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const clockInTime = todayLog?.clock_in
    ? new Date(todayLog.clock_in).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
      <p
        className="text-4xl font-bold text-gray-900 mb-2"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {timeStr}
      </p>
      <p className="text-sm text-gray-500 mb-6">{dateStr}</p>

      <button
        onClick={handleClock}
        disabled={loading}
        className={`w-full max-w-xs mx-auto py-4 px-8 rounded-xl text-lg font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isClockedIn
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#2BBCCD] hover:bg-[#1a8a99] text-white'
        }`}
      >
        {loading ? 'Processing...' : isClockedIn ? 'Clock Out' : 'Clock In'}
      </button>

      {isClockedIn && clockInTime && (
        <p className="text-xs text-gray-400 mt-3">Clocked in at {clockInTime}</p>
      )}

      {status && (
        <p
          className={`mt-3 text-sm ${
            status.type === 'success' ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
