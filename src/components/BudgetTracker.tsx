import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  MessageSquare,
  Pencil,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { BudgetState } from '../types/wardrobe';
import { formatINR } from '../utils/wardrobeLogic';

interface BudgetTrackerProps {
  budget: BudgetState;
  savedCount: number;
  onUpdateMonthlyLimit: (newLimit: number) => void;
  onOpenSavedLooks: () => void;
  onOpenStylistChat: () => void;
  onResetDemoData: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budget,
  savedCount,
  onUpdateMonthlyLimit,
  onOpenSavedLooks,
  onOpenStylistChat,
  onResetDemoData,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLimit, setDraftLimit] = useState(String(budget.monthlyLimitInr));
  const [confirmReset, setConfirmReset] = useState(false);

  const remaining = budget.monthlyLimitInr - budget.spentInr;
  const spentPct =
    budget.monthlyLimitInr > 0
      ? Math.min(100, Math.round((budget.spentInr / budget.monthlyLimitInr) * 100))
      : 100;
  const isOverBudget = remaining < 0;

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(draftLimit.replace(/[^0-9]/g, ''));
    if (!Number.isNaN(parsed) && parsed >= 500) {
      onUpdateMonthlyLimit(parsed);
    } else {
      setDraftLimit(String(budget.monthlyLimitInr));
    }
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setDraftLimit(String(budget.monthlyLimitInr));
    setIsEditing(true);
  };

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    setConfirmReset(false);
    onResetDemoData();
  };

  return (
    <div className="bg-[#11151E] border-b border-white/10">
      {/* Top Bar Contract: 3 clean zones */}
      <header className="max-w-[1440px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center shrink-0">
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Fit<span className="text-[#D4A853]">Check</span>
          </span>
        </div>

        {/* Zone 2: Clean single-line utility links */}
        <nav
          aria-label="Workspace actions"
          className="flex items-center gap-2.5 sm:gap-7 text-xs sm:text-sm font-medium text-slate-300"
        >
          <button
            type="button"
            onClick={onOpenSavedLooks}
            aria-label={`Saved Looks (${savedCount})`}
            className="inline-flex items-center gap-1 sm:gap-2 hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A853] rounded px-1 py-1"
          >
            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A853]" aria-hidden="true" />
            <span>
              Saved<span className="hidden sm:inline"> Looks</span>
            </span>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              ({savedCount})
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenStylistChat}
            aria-label="AI Stylist"
            className="inline-flex items-center gap-1 sm:gap-2 hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A853] rounded px-1 py-1"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4A853]" aria-hidden="true" />
            <span>
              <span className="hidden sm:inline">AI </span>Stylist
            </span>
          </button>

          <button
            type="button"
            onClick={handleResetClick}
            aria-label={confirmReset ? 'Confirm Reset' : 'Reset Demo Data'}
            className={`inline-flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A853] rounded px-1 sm:px-1.5 py-1 ${
              confirmReset
                ? 'text-amber-300 hover:text-amber-200'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {confirmReset ? (
                'Confirm'
              ) : (
                <>
                  Reset<span className="hidden sm:inline"> Demo Data</span>
                </>
              )}
            </span>
          </button>
        </nav>

        {/* Zone 3: Primary Budget Edit CTA */}
        <div className="hidden sm:flex items-center shrink-0">
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-4 py-2 text-xs font-semibold text-[#0E1117] bg-[#D4A853] hover:bg-[#DFB96E] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Set Budget
          </button>
        </div>
      </header>

      {/* Monthly Shopping Budget Strip */}
      <section
        aria-label="Monthly shopping budget"
        className="border-t border-white/[0.06] bg-[#151A24]"
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-200">
              <Wallet className="w-4 h-4 text-[#D4A853]" aria-hidden="true" />
              <span className="font-medium whitespace-nowrap">Monthly Budget</span>
            </div>

            {isEditing ? (
              <form
                onSubmit={handleSaveLimit}
                className="flex items-center gap-2"
              >
                <label htmlFor="monthly-budget-input" className="sr-only">
                  Monthly budget in INR
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-2.5 text-xs font-mono text-slate-400">
                    ₹
                  </span>
                  <input
                    id="monthly-budget-input"
                    type="number"
                    min={500}
                    step={250}
                    value={draftLimit}
                    onChange={(e) => setDraftLimit(e.target.value)}
                    autoFocus
                    className="w-28 pl-6 pr-2 py-1 text-sm font-mono tabular-nums bg-[#0E1117] border border-[#D4A853] rounded-md text-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Save monthly budget"
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500 text-slate-950 rounded-md hover:bg-emerald-400 transition-colors whitespace-nowrap shrink-0"
                >
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2 py-1 text-xs text-slate-400 hover:text-white whitespace-nowrap shrink-0"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Edit monthly budget"
                  className="inline-flex items-center gap-1.5 font-mono tabular-nums font-semibold text-white hover:text-[#D4A853] transition-colors"
                >
                  <span data-testid="monthly-limit-value">
                    {formatINR(budget.monthlyLimitInr)}
                  </span>
                  <Pencil className="w-3 h-3 text-slate-400" aria-hidden="true" />
                </button>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span className="text-slate-400 whitespace-nowrap">
                  Spent:{' '}
                  <strong
                    data-testid="spent-budget-value"
                    className="font-mono tabular-nums font-medium text-slate-200"
                  >
                    {formatINR(budget.spentInr)}
                  </strong>
                </span>
                <span className="text-slate-600" aria-hidden="true">
                  ·
                </span>
                <span
                  data-testid="remaining-budget-value"
                  className={`font-mono tabular-nums font-semibold whitespace-nowrap ${
                    isOverBudget ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isOverBudget
                    ? `Over by ${formatINR(Math.abs(remaining))}`
                    : `${formatINR(remaining)} left`}
                </span>
              </div>
            )}
          </div>

          {/* Progress meter */}
          <div className="flex items-center gap-3 w-full sm:w-56">
            <div className="flex-1 h-2 bg-[#0E1117] rounded-full overflow-hidden border border-white/5">
              <div
                className={`h-full transition-all duration-200 ${
                  isOverBudget
                    ? 'bg-rose-500'
                    : spentPct >= 80
                    ? 'bg-[#D4A853]'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${spentPct}%` }}
              />
            </div>
            <span className="font-mono tabular-nums text-xs text-slate-400 w-10 text-right">
              {spentPct}%
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
