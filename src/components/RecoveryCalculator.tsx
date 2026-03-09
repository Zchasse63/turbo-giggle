import { useState, useMemo } from 'react';

/**
 * RecoveryCalculator.tsx -- Interactive Recovery Score Calculator.
 * React island component for Astro (use with client:load).
 *
 * Users input workout type, intensity, sleep quality, and stress level
 * to receive a personalized contrast therapy recommendation with a
 * shareable recovery score from 0-100.
 */

interface Props {
  bookingUrl: string;
}

/* -- Option Types -- */

type WorkoutType =
  | 'strength'
  | 'cardio'
  | 'crossfit'
  | 'sports'
  | 'yoga'
  | 'rest';

type Intensity = 'light' | 'moderate' | 'intense' | 'extreme';
type SleepQuality = 'poor' | 'fair' | 'good' | 'great';
type StressLevel = 'low' | 'moderate' | 'high' | 'very_high';

interface WorkoutOption {
  value: WorkoutType;
  label: string;
}

interface ButtonOption<T extends string> {
  value: T;
  label: string;
}

/* -- Data -- */

const WORKOUT_OPTIONS: WorkoutOption[] = [
  { value: 'strength', label: 'Strength Training' },
  { value: 'cardio', label: 'Running / Cardio' },
  { value: 'crossfit', label: 'CrossFit / HIIT' },
  { value: 'sports', label: 'Sports / Team Activity' },
  { value: 'yoga', label: 'Yoga / Mobility' },
  { value: 'rest', label: 'Rest Day' },
];

const INTENSITY_OPTIONS: ButtonOption<Intensity>[] = [
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'intense', label: 'Intense' },
  { value: 'extreme', label: 'Extreme' },
];

const SLEEP_OPTIONS: ButtonOption<SleepQuality>[] = [
  { value: 'poor', label: 'Poor (under 5 hrs)' },
  { value: 'fair', label: 'Fair (5-6 hrs)' },
  { value: 'good', label: 'Good (7-8 hrs)' },
  { value: 'great', label: 'Great (8+ hrs)' },
];

const STRESS_OPTIONS: ButtonOption<StressLevel>[] = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];

/* -- Scoring Weights -- */

const WORKOUT_SCORES: Record<WorkoutType, number> = {
  rest: 5,
  yoga: 15,
  cardio: 30,
  sports: 35,
  strength: 40,
  crossfit: 45,
};

const INTENSITY_SCORES: Record<Intensity, number> = {
  light: 5,
  moderate: 15,
  intense: 25,
  extreme: 35,
};

const SLEEP_SCORES: Record<SleepQuality, number> = {
  great: 0,
  good: 5,
  fair: 15,
  poor: 25,
};

const STRESS_SCORES: Record<StressLevel, number> = {
  low: 0,
  moderate: 5,
  high: 15,
  very_high: 25,
};

/* -- Recommendation Data -- */

interface ScoreTier {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  saunaDuration: string;
  plungeDuration: string;
  rounds: string;
  recommendation: string;
}

function getScoreTier(score: number): ScoreTier {
  if (score <= 30) {
    return {
      label: 'Low Recovery Need',
      color: '#16a34a',
      bgColor: 'rgba(22, 163, 74, 0.08)',
      borderColor: 'rgba(22, 163, 74, 0.2)',
      ringColor: '#16a34a',
      saunaDuration: '10-12 min',
      plungeDuration: '1-2 min',
      rounds: '1-2 rounds',
      recommendation:
        'A light contrast session focused on relaxation and maintenance. Enjoy the warmth, take a quick plunge, and let your body unwind.',
    };
  }
  if (score <= 60) {
    return {
      label: 'Moderate Recovery Need',
      color: '#2BBCCD',
      bgColor: 'rgba(43, 188, 205, 0.08)',
      borderColor: 'rgba(43, 188, 205, 0.2)',
      ringColor: '#2BBCCD',
      saunaDuration: '12-15 min',
      plungeDuration: '2-3 min',
      rounds: '2-3 rounds',
      recommendation:
        'A standard contrast therapy session will do wonders. Focus on steady breathing during each phase and allow full rest between rounds.',
    };
  }
  if (score <= 80) {
    return {
      label: 'High Recovery Need',
      color: '#E8A838',
      bgColor: 'rgba(232, 168, 56, 0.08)',
      borderColor: 'rgba(232, 168, 56, 0.2)',
      ringColor: '#E8A838',
      saunaDuration: '15-18 min',
      plungeDuration: '3-4 min',
      rounds: '3-4 rounds',
      recommendation:
        'Your body is calling for serious recovery. An extended session with extra cold plunge rounds will help flush metabolic waste and reduce inflammation.',
    };
  }
  return {
    label: 'Maximum Recovery Need',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.06)',
    borderColor: 'rgba(220, 38, 38, 0.2)',
    ringColor: '#dc2626',
    saunaDuration: '18-20 min',
    plungeDuration: '4-5 min',
    rounds: '4+ rounds',
    recommendation:
      'You need the full treatment. A guided contrast therapy session with maximum rounds, extended cold exposure, and dedicated post-session relaxation time is strongly recommended.',
  };
}

/* -- Component -- */

export default function RecoveryCalculator({ bookingUrl }: Props) {
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [intensity, setIntensity] = useState<Intensity | null>(null);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality | null>(null);
  const [stressLevel, setStressLevel] = useState<StressLevel | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [shareText, setShareText] = useState('');

  const isComplete =
    workoutType !== null &&
    intensity !== null &&
    sleepQuality !== null &&
    stressLevel !== null;

  const score = useMemo(() => {
    if (!isComplete) return 0;

    const raw =
      WORKOUT_SCORES[workoutType] +
      INTENSITY_SCORES[intensity] +
      SLEEP_SCORES[sleepQuality] +
      STRESS_SCORES[stressLevel];

    // Scale raw (range ~5-130) down to 0-100
    // Min possible: rest(5) + light(5) + great(0) + low(0) = 10
    // Max possible: crossfit(45) + extreme(35) + poor(25) + very_high(25) = 130
    const minRaw = 10;
    const maxRaw = 130;
    const scaled = Math.round(((raw - minRaw) / (maxRaw - minRaw)) * 100);
    return Math.max(0, Math.min(100, scaled));
  }, [workoutType, intensity, sleepQuality, stressLevel, isComplete]);

  const tier = useMemo(() => getScoreTier(score), [score]);

  function handleCalculate() {
    if (isComplete) {
      setShowResult(true);
    }
  }

  function handleReset() {
    setWorkoutType(null);
    setIntensity(null);
    setSleepQuality(null);
    setStressLevel(null);
    setShowResult(false);
    setShareText('');
  }

  function handleShare() {
    const tierLabel = tier.label;
    const text = `My Recovery Score is ${score}/100 \u2014 ${tierLabel}! Get yours at thesaunaguys.com/recovery-score`;
    navigator.clipboard.writeText(text).then(() => {
      setShareText('Copied to clipboard!');
      setTimeout(() => setShareText(''), 2500);
    }).catch(() => {
      setShareText('Could not copy');
      setTimeout(() => setShareText(''), 2500);
    });
  }

  // Circumference for the SVG ring (radius = 54)
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {!showResult ? (
        /* -- Input Form -- */
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
          }}
        >
          {/* Workout Type */}
          <FormGroup label="What type of workout did you do?">
            <div style={{ position: 'relative' }}>
              <select
                value={workoutType || ''}
                onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
                aria-label="Workout type"
                style={{
                  width: '100%',
                  padding: '14px 44px 14px 16px',
                  borderRadius: 12,
                  border: '2px solid',
                  borderColor: workoutType ? '#2BBCCD' : 'rgba(0,0,0,0.12)',
                  background: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  color: workoutType ? '#23383D' : '#999',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 200ms ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#2BBCCD';
                }}
                onBlur={(e) => {
                  if (!workoutType) {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                  }
                }}
              >
                <option value="" disabled>
                  Select your workout type
                </option>
                {WORKOUT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#999',
                  fontSize: '0.75rem',
                }}
              >
                &#9662;
              </div>
            </div>
          </FormGroup>

          {/* Intensity */}
          <FormGroup label="How intense was it?">
            <ButtonGroup<Intensity>
              options={INTENSITY_OPTIONS}
              value={intensity}
              onChange={(v) => setIntensity(v)}
            />
          </FormGroup>

          {/* Sleep Quality */}
          <FormGroup label="How did you sleep last night?">
            <ButtonGroup<SleepQuality>
              options={SLEEP_OPTIONS}
              value={sleepQuality}
              onChange={(v) => setSleepQuality(v)}
            />
          </FormGroup>

          {/* Stress Level */}
          <FormGroup label="What is your current stress level?">
            <ButtonGroup<StressLevel>
              options={STRESS_OPTIONS}
              value={stressLevel}
              onChange={(v) => setStressLevel(v)}
            />
          </FormGroup>

          {/* Calculate Button */}
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={handleCalculate}
              disabled={!isComplete}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isComplete ? '#2BBCCD' : '#ccc',
                color: isComplete ? '#000' : '#666',
                border: 'none',
                borderRadius: 60,
                padding: '16px 48px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1rem',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                cursor: isComplete ? 'pointer' : 'not-allowed',
                transition: 'all 200ms ease-out',
                boxShadow: isComplete
                  ? '0 4px 12px rgba(43,188,205,0.3)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (isComplete) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 6px 16px rgba(43,188,205,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isComplete
                  ? '0 4px 12px rgba(43,188,205,0.3)'
                  : 'none';
              }}
            >
              Calculate My Score
            </button>
          </div>
        </div>
      ) : (
        /* -- Results Display -- */
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
          }}
        >
          {/* Score Card */}
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              border: `2px solid ${tier.borderColor}`,
              padding: '2.5rem 2rem',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              marginBottom: '1.5rem',
            }}
          >
            {/* Score Ring */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ position: 'relative', width: 140, height: 140 }}>
                <svg
                  width="140"
                  height="140"
                  viewBox="0 0 120 120"
                  style={{ transform: 'rotate(-90deg)' }}
                >
                  {/* Background ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  {/* Score ring */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={tier.ringColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transition: 'stroke-dashoffset 800ms ease-out',
                    }}
                  />
                </svg>
                {/* Score number overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      color: tier.color,
                      lineHeight: 1,
                      display: 'block',
                    }}
                  >
                    {score}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#999',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.05em',
                    }}
                  >
                    out of 100
                  </span>
                </div>
              </div>
            </div>

            {/* Tier Label */}
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                color: tier.color,
                margin: '0 0 0.75rem',
                textTransform: 'uppercase' as const,
              }}
            >
              {tier.label}
            </h3>

            {/* Recommendation Text */}
            <p
              style={{
                fontSize: '1rem',
                color: '#555',
                lineHeight: 1.7,
                maxWidth: 500,
                margin: '0 auto 1.5rem',
              }}
            >
              {tier.recommendation}
            </p>

            {/* Divider */}
            <div
              style={{
                width: '80%',
                height: 1,
                background: 'rgba(0,0,0,0.08)',
                margin: '0 auto 1.5rem',
              }}
            />

            {/* Protocol Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                maxWidth: 420,
                margin: '0 auto 2rem',
              }}
            >
              <ProtocolStat label="Sauna" value={tier.saunaDuration} />
              <ProtocolStat label="Cold Plunge" value={tier.plungeDuration} />
              <ProtocolStat label="Rounds" value={tier.rounds} />
            </div>

            {/* Book CTA */}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#2BBCCD',
                color: '#000',
                border: 'none',
                borderRadius: 60,
                padding: '14px 36px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
                boxShadow: '0 4px 12px rgba(43,188,205,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(43,188,205,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 4px 12px rgba(43,188,205,0.2)';
              }}
            >
              Book Your Recovery Session
            </a>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {/* Share Button */}
            <button
              onClick={handleShare}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: '#23383D',
                border: '2px solid #23383D',
                borderRadius: 60,
                padding: '12px 28px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#23383D';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#23383D';
              }}
            >
              {shareText || 'Share Your Score'}
            </button>

            {/* Recalculate Button */}
            <button
              onClick={handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                color: '#2BBCCD',
                border: '2px solid #2BBCCD',
                borderRadius: 60,
                padding: '12px 28px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 200ms ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2BBCCD';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#2BBCCD';
              }}
            >
              Recalculate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- Sub-components -- */

/** Label + children wrapper for each form question */
function FormGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <label
        style={{
          display: 'block',
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
          color: '#23383D',
          marginBottom: '0.75rem',
          textTransform: 'uppercase' as const,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

/** Selectable button group for single-select options */
function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ButtonOption<T>[];
  value: T | null;
  onChange: (val: T) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <OptionButton
            key={opt.value}
            label={opt.label}
            isActive={isActive}
            onClick={() => onChange(opt.value)}
          />
        );
      })}
    </div>
  );
}

/** Individual option button with hover and active states */
function OptionButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const background = isActive
    ? '#2BBCCD'
    : hovered
      ? 'rgba(43,188,205,0.1)'
      : '#fff';
  const color = isActive ? '#000' : '#23383D';
  const border = isActive ? '2px solid #2BBCCD' : '2px solid rgba(0,0,0,0.12)';

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background,
        color,
        border,
        borderRadius: 10,
        padding: '10px 18px',
        fontFamily: 'var(--font-body)',
        fontWeight: isActive ? 700 : 500,
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 150ms ease-out',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/** Small stat display for protocol details (sauna duration, etc.) */
function ProtocolStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'rgba(43,188,205,0.06)',
        borderRadius: 12,
        padding: '0.75rem 0.5rem',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          display: 'block',
          fontSize: '0.7rem',
          color: '#999',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          marginBottom: '0.25rem',
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'block',
          fontSize: '0.95rem',
          fontWeight: 700,
          color: '#23383D',
        }}
      >
        {value}
      </span>
    </div>
  );
}
