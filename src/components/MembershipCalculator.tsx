import { useState, useMemo } from 'react';

/**
 * MembershipCalculator.tsx — Interactive pricing comparison tool.
 * React island component for Astro (use with client:load).
 *
 * Shows all membership/pack options side-by-side with
 * per-session cost based on user's intended visit frequency.
 */

interface Props {
  membershipUrl: string;
  classesUrl: string;
}

/* ── Pricing Data (hardcoded from Supabase pricing_plans) ── */

interface PlanOption {
  id: string;
  name: string;
  type: 'drop_in' | 'class_pack' | 'membership' | 'intro';
  /** Total price in dollars */
  price: number;
  /** Number of sessions included (null = unlimited) */
  sessions: number | null;
  /** Whether this is a monthly recurring charge */
  isMonthly: boolean;
  /** Short descriptor shown under the price */
  subtitle: string;
}

const PLANS: PlanOption[] = [
  {
    id: 'intro',
    name: 'Sauna Sampler',
    type: 'intro',
    price: 60,
    sessions: 3,
    isMonthly: false,
    subtitle: 'Intro offer \u00B7 3 sessions',
  },
  {
    id: 'drop-in',
    name: 'Single Drop-In',
    type: 'drop_in',
    price: 39,
    sessions: 1,
    isMonthly: false,
    subtitle: 'No commitment',
  },
  {
    id: 'pack-5',
    name: '5-Pack',
    type: 'class_pack',
    price: 175,
    sessions: 5,
    isMonthly: false,
    subtitle: '5 sessions \u00B7 use anytime',
  },
  {
    id: 'pack-10',
    name: '10-Pack',
    type: 'class_pack',
    price: 300,
    sessions: 10,
    isMonthly: false,
    subtitle: '10 sessions \u00B7 use anytime',
  },
  {
    id: 'mem-4',
    name: '4x / Month',
    type: 'membership',
    price: 109,
    sessions: 4,
    isMonthly: true,
    subtitle: 'Monthly membership',
  },
  {
    id: 'mem-8',
    name: '8x / Month',
    type: 'membership',
    price: 179,
    sessions: 8,
    isMonthly: true,
    subtitle: 'Monthly membership',
  },
  {
    id: 'mem-unlimited',
    name: 'Unlimited',
    type: 'membership',
    price: 249,
    sessions: null,
    isMonthly: true,
    subtitle: 'Monthly membership',
  },
];

/* ── Calculation helpers ── */

interface CalculatedPlan extends PlanOption {
  monthlyCost: number;
  costPerSession: number;
  savingsVsDropIn: number;
  isApplicable: boolean;
}

function calculatePlans(sessionsPerMonth: number): CalculatedPlan[] {
  const dropInMonthly = 39 * sessionsPerMonth;

  return PLANS.map((plan) => {
    let monthlyCost: number;
    let costPerSession: number;
    let isApplicable = true;

    if (plan.isMonthly) {
      // Monthly memberships
      if (plan.sessions === null) {
        // Unlimited
        monthlyCost = plan.price;
        costPerSession = plan.price / sessionsPerMonth;
      } else if (sessionsPerMonth > plan.sessions) {
        // User wants more sessions than this plan includes
        monthlyCost = plan.price;
        costPerSession = plan.price / plan.sessions;
        isApplicable = false;
      } else {
        monthlyCost = plan.price;
        costPerSession = plan.price / sessionsPerMonth;
      }
    } else {
      // Drop-ins and packs: compute monthly equivalent
      if (plan.sessions === null) {
        monthlyCost = plan.price;
        costPerSession = plan.price / sessionsPerMonth;
      } else {
        costPerSession = plan.price / plan.sessions;
        monthlyCost = costPerSession * sessionsPerMonth;
      }
    }

    const savingsVsDropIn = dropInMonthly - monthlyCost;

    return {
      ...plan,
      monthlyCost,
      costPerSession,
      savingsVsDropIn,
      isApplicable,
    };
  });
}

/* ── Component ── */

export default function MembershipCalculator({ membershipUrl, classesUrl }: Props) {
  const [sessionsPerMonth, setSessionsPerMonth] = useState(4);

  const calculated = useMemo(() => calculatePlans(sessionsPerMonth), [sessionsPerMonth]);

  // Find the best value (lowest cost per session among applicable plans)
  const bestValueId = useMemo(() => {
    const applicable = calculated.filter((p) => p.isApplicable);
    if (applicable.length === 0) return null;
    return applicable.reduce((best, plan) =>
      plan.costPerSession < best.costPerSession ? plan : best
    ).id;
  }, [calculated]);

  // Separate into categories for display
  const introAndDropIn = calculated.filter(
    (p) => p.type === 'intro' || p.type === 'drop_in'
  );
  const packs = calculated.filter((p) => p.type === 'class_pack');
  const memberships = calculated.filter((p) => p.type === 'membership');

  const allCards = [...introAndDropIn, ...packs, ...memberships];

  function getCtaUrl(plan: CalculatedPlan): string {
    return membershipUrl || '#';
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* ── Slider Section ── */}
      <div
        style={{
          maxWidth: 600,
          margin: '0 auto 3rem',
          textAlign: 'center',
        }}
      >
        <label
          htmlFor="session-slider"
          style={{
            display: 'block',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
            color: '#23383D',
            marginBottom: '1.5rem',
            textTransform: 'uppercase' as const,
          }}
        >
          How many times per month do you plan to come?
        </label>

        {/* Frequency display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '1rem',
          }}
        >
          <button
            onClick={() => setSessionsPerMonth((v) => Math.max(1, v - 1))}
            aria-label="Decrease sessions"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #2BBCCD',
              background: 'transparent',
              color: '#2BBCCD',
              fontSize: '1.5rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease-out',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2BBCCD';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#2BBCCD';
            }}
          >
            -
          </button>

          <div
            style={{
              minWidth: 100,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                fontWeight: 700,
                color: '#2BBCCD',
                lineHeight: 1,
                display: 'block',
              }}
            >
              {sessionsPerMonth}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                color: '#666',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
              }}
            >
              {sessionsPerMonth === 1 ? 'session' : 'sessions'} / month
            </span>
          </div>

          <button
            onClick={() => setSessionsPerMonth((v) => Math.min(20, v + 1))}
            aria-label="Increase sessions"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #2BBCCD',
              background: 'transparent',
              color: '#2BBCCD',
              fontSize: '1.5rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease-out',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2BBCCD';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#2BBCCD';
            }}
          >
            +
          </button>
        </div>

        {/* Range slider */}
        <div style={{ padding: '0 0.5rem' }}>
          <input
            id="session-slider"
            type="range"
            min={1}
            max={20}
            step={1}
            value={sessionsPerMonth}
            onChange={(e) => setSessionsPerMonth(Number(e.target.value))}
            aria-valuemin={1}
            aria-valuemax={20}
            aria-valuenow={sessionsPerMonth}
            aria-label="Sessions per month"
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right, #2BBCCD 0%, #2BBCCD ${((sessionsPerMonth - 1) / 19) * 100}%, #e2e8f0 ${((sessionsPerMonth - 1) / 19) * 100}%, #e2e8f0 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#999',
              marginTop: 4,
            }}
          >
            <span>1x</span>
            <span>5x</span>
            <span>10x</span>
            <span>15x</span>
            <span>20x</span>
          </div>
        </div>
      </div>

      {/* ── Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        {allCards.map((plan) => {
          const isBest = plan.id === bestValueId;
          const isNotApplicable = !plan.isApplicable;

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              isBest={isBest}
              isNotApplicable={isNotApplicable}
              sessionsPerMonth={sessionsPerMonth}
              ctaUrl={getCtaUrl(plan)}
            />
          );
        })}
      </div>

      {/* ── Slider custom thumb styles (injected once) ── */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2BBCCD;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 150ms ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2BBCCD;
          cursor: pointer;
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        input[type="range"]::-moz-range-track {
          height: 6px;
          border-radius: 3px;
        }
        input[type="range"]:focus-visible::-webkit-slider-thumb {
          outline: 3px solid #2BBCCD;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}

/* ── PlanCard Sub-component ── */

interface PlanCardProps {
  plan: CalculatedPlan;
  isBest: boolean;
  isNotApplicable: boolean;
  sessionsPerMonth: number;
  ctaUrl: string;
}

function PlanCard({ plan, isBest, isNotApplicable, sessionsPerMonth, ctaUrl }: PlanCardProps) {
  const [hovered, setHovered] = useState(false);

  const formatCurrency = (n: number) =>
    n % 1 === 0 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`;

  // Card styles
  const cardBackground = isBest
    ? '#E8A838'
    : '#fff';

  const cardBorder = isBest
    ? '2px solid #E8A838'
    : '1px solid rgba(0,0,0,0.06)';

  const textColor = isBest ? '#23383D' : '#000';
  const subtextColor = isBest ? 'rgba(35,56,61,0.7)' : '#666';
  const priceColor = isBest ? '#23383D' : '#2BBCCD';

  const shadow = hovered
    ? '0 12px 32px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.04)'
    : '0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)';

  const transform = hovered ? 'translateY(-6px)' : 'translateY(0)';

  const opacity = isNotApplicable ? 0.5 : 1;

  // Determine label for not-applicable plans
  const notApplicableReason =
    isNotApplicable && plan.type === 'membership' && plan.sessions !== null
      ? `Only includes ${plan.sessions} sessions`
      : '';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: cardBackground,
        borderRadius: 20,
        border: cardBorder,
        padding: '2rem 1.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: shadow,
        transform,
        opacity,
        transition: 'all 300ms ease-out',
        cursor: 'default',
      }}
    >
      {/* Best Value badge */}
      {isBest && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#23383D',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '5px 16px',
            borderRadius: 60,
            whiteSpace: 'nowrap',
          }}
        >
          Best Value
        </div>
      )}

      {/* Plan type label */}
      <span
        style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: isBest ? 'rgba(35,56,61,0.6)' : '#999',
          marginBottom: '0.5rem',
        }}
      >
        {plan.type === 'intro'
          ? 'Intro Offer'
          : plan.type === 'drop_in'
            ? 'Pay As You Go'
            : plan.type === 'class_pack'
              ? 'Class Pack'
              : 'Membership'}
      </span>

      {/* Plan name */}
      <h3
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 400,
          fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
          color: textColor,
          margin: '0 0 0.25rem',
          textTransform: 'uppercase',
          lineHeight: 1.2,
        }}
      >
        {plan.name}
      </h3>

      {/* Subtitle */}
      <p
        style={{
          fontSize: '0.8rem',
          color: subtextColor,
          margin: '0 0 1.25rem',
        }}
      >
        {plan.subtitle}
      </p>

      {/* Cost per session */}
      <div style={{ marginBottom: '0.25rem' }}>
        <span
          style={{
            fontSize: 'clamp(2rem, 4vw, 2.75rem)',
            fontWeight: 700,
            color: priceColor,
            lineHeight: 1,
          }}
        >
          {formatCurrency(plan.costPerSession)}
        </span>
      </div>
      <p
        style={{
          fontSize: '0.8rem',
          color: subtextColor,
          margin: '0 0 1rem',
        }}
      >
        per session
      </p>

      {/* Divider */}
      <div
        style={{
          width: '80%',
          height: 1,
          background: isBest ? 'rgba(35,56,61,0.15)' : 'rgba(0,0,0,0.08)',
          margin: '0 auto 1rem',
        }}
      />

      {/* Monthly cost */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          fontSize: '0.85rem',
          color: subtextColor,
          marginBottom: '0.5rem',
          padding: '0 0.25rem',
        }}
      >
        <span>Monthly cost</span>
        <span style={{ fontWeight: 700, color: textColor }}>
          {formatCurrency(plan.monthlyCost)}
          {plan.isMonthly ? '/mo' : '/mo*'}
        </span>
      </div>

      {/* Savings vs drop-in */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          fontSize: '0.85rem',
          color: subtextColor,
          marginBottom: '1.25rem',
          padding: '0 0.25rem',
        }}
      >
        <span>vs. drop-in</span>
        <span
          style={{
            fontWeight: 700,
            color:
              plan.savingsVsDropIn > 0
                ? isBest
                  ? '#23383D'
                  : '#16a34a'
                : plan.savingsVsDropIn === 0
                  ? subtextColor
                  : '#ef4444',
          }}
        >
          {plan.savingsVsDropIn > 0
            ? `Save ${formatCurrency(plan.savingsVsDropIn)}`
            : plan.savingsVsDropIn === 0
              ? '$0'
              : `-${formatCurrency(Math.abs(plan.savingsVsDropIn))}`}
        </span>
      </div>

      {/* Not applicable warning */}
      {isNotApplicable && notApplicableReason && (
        <p
          style={{
            fontSize: '0.75rem',
            color: '#ef4444',
            margin: '0 0 0.75rem',
            fontStyle: 'italic',
          }}
        >
          {notApplicableReason}
        </p>
      )}

      {/* CTA button */}
      <a
        href={ctaUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isBest ? '#23383D' : '#2BBCCD',
          color: isBest ? '#fff' : '#000',
          border: 'none',
          borderRadius: 60,
          padding: '12px 28px',
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 200ms ease-out',
          marginTop: 'auto',
          boxShadow: isBest
            ? '0 4px 12px rgba(35,56,61,0.3)'
            : '0 4px 12px rgba(43,188,205,0.2)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = isBest
            ? '0 6px 16px rgba(35,56,61,0.4)'
            : '0 6px 16px rgba(43,188,205,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isBest
            ? '0 4px 12px rgba(35,56,61,0.3)'
            : '0 4px 12px rgba(43,188,205,0.2)';
        }}
      >
        {plan.type === 'membership' ? 'Subscribe' : plan.type === 'intro' ? 'Get Started' : 'Buy'}
      </a>

      {/* Asterisk note for non-monthly */}
      {!plan.isMonthly && (
        <p
          style={{
            fontSize: '0.65rem',
            color: isBest ? 'rgba(35,56,61,0.5)' : '#aaa',
            margin: '0.75rem 0 0',
          }}
        >
          *Based on {sessionsPerMonth}x/month usage
        </p>
      )}
    </div>
  );
}
