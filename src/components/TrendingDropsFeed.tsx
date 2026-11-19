import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Info,
  ShoppingBag,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDrop, WardrobeItem } from '../types/wardrobe';
import {
  DropPriceChartPoint,
  buildVisibleDropsPriceData,
  calculateWardrobeCompatibility,
  formatINR,
} from '../utils/wardrobeLogic';
import { GarmentArtwork } from './GarmentArtwork';

interface TrendingDropsFeedProps {
  drops: TrendingDrop[];
  wardrobe: WardrobeItem[];
  remainingBudgetInr: number;
  purchasedDropIds: string[];
  activeTestDropId: string | null;
  onTestDrop: (drop: TrendingDrop) => void;
  onMarkPurchased: (drop: TrendingDrop) => void;
  onOpenVerdict: (drop: TrendingDrop) => void;
}

type VibeFilter =
  | 'All'
  | 'Streetwear'
  | 'Minimalist'
  | 'Smart Casual'
  | 'Techwear';

const VIBE_FILTERS: VibeFilter[] = [
  'All',
  'Streetwear',
  'Minimalist',
  'Smart Casual',
  'Techwear',
];

export const TrendingDropsFeed: React.FC<TrendingDropsFeedProps> = ({
  drops,
  wardrobe,
  remainingBudgetInr,
  purchasedDropIds,
  activeTestDropId,
  onTestDrop,
  onMarkPurchased,
  onOpenVerdict,
}) => {
  const [vibeFilter, setVibeFilter] = useState<VibeFilter>('All');

  const filteredDrops = useMemo(() => {
    if (vibeFilter === 'All') return drops;
    return drops.filter((d) => d.vibe === vibeFilter);
  }, [drops, vibeFilter]);

  const priceSummary = useMemo(
    () => buildVisibleDropsPriceData(filteredDrops, remainingBudgetInr),
    [filteredDrops, remainingBudgetInr],
  );

  return (
    <aside
      aria-label="Trending Drops Feed"
      className="flex flex-col bg-[#151922] border border-white/10 rounded-xl overflow-hidden h-full"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-white tracking-tight">
              Trending Drops
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              1-click test drive against your closet
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs text-slate-400">
            {filteredDrops.length} drops
          </span>
        </div>

        {/* Vibe Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter trending drops by vibe"
          className="mt-3 flex items-center justify-between gap-1 p-1 bg-[#0E1117] rounded-lg"
        >
          {VIBE_FILTERS.map((vibe) => {
            const active = vibeFilter === vibe;
            return (
              <button
                key={vibe}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setVibeFilter(vibe)}
                className={`px-2 py-1.5 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {vibe}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drops List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Recharts Price Trends Card for Currently Visible Drops */}
        {priceSummary.points.length > 0 && (
          <section
            data-testid="drops-price-chart"
            aria-label="Visible drops price trends"
            className="bg-[#0E1117]/80 border border-white/[0.08] rounded-xl p-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-display text-xs font-semibold text-white tracking-tight">
                Price Trends
              </h3>
              <p
                data-testid="drops-price-summary"
                className="font-mono tabular-nums text-[11px] text-slate-400"
              >
                Avg {formatINR(priceSummary.avgPriceInr)} · Max{' '}
                {formatINR(priceSummary.maxPriceInr)}
              </p>
            </div>

            <div className="h-[112px] w-full">
              <ResponsiveContainer width="100%" height={112} minWidth={0}>
                <BarChart
                  data={priceSummary.points}
                  margin={{ top: 6, right: 4, left: -18, bottom: 0 }}
                >
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: '#94A3B8', fontSize: 10 }}
                    tickFormatter={(val: string) =>
                      priceSummary.points.length > 6 ? val.slice(0, 5) : val
                    }
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    tickFormatter={(val: number) =>
                      val === 0 ? '₹0' : `₹${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}k`
                    }
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) {
                        return null;
                      }
                      const point = payload[0].payload as DropPriceChartPoint;
                      return (
                        <div className="bg-[#151922] border border-white/15 rounded-lg px-2.5 py-2 shadow-xl text-xs">
                          <p className="font-semibold text-white leading-snug">
                            {point.fullName}
                          </p>
                          <p className="text-slate-400 mt-0.5">
                            {point.brand} · {point.storeName}
                          </p>
                          <p
                            className={`font-mono tabular-nums font-bold mt-1 ${
                              point.fitsBudget
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {formatINR(point.priceInr)} ·{' '}
                            {point.fitsBudget ? 'Within Budget' : 'Over Budget'}
                          </p>
                        </div>
                      );
                    }}
                  />
                  {remainingBudgetInr > 0 &&
                    remainingBudgetInr <= priceSummary.maxPriceInr && (
                      <ReferenceLine
                        y={remainingBudgetInr}
                        stroke="#D4A853"
                        strokeDasharray="3 3"
                        strokeWidth={1.2}
                      />
                    )}
                  <Bar dataKey="priceInr" radius={[4, 4, 0, 0]} maxBarSize={26}>
                    {priceSummary.points.map((entry) => {
                      const isTesting = entry.id === activeTestDropId;
                      const fill = isTesting
                        ? '#D4A853'
                        : entry.fitsBudget
                        ? '#10B981'
                        : '#F43F5E';
                      return <Cell key={entry.id} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span>Emerald: Fits budget · Rose: Over budget</span>
              {remainingBudgetInr > 0 &&
                remainingBudgetInr <= priceSummary.maxPriceInr && (
                  <span className="font-mono tabular-nums text-[#D4A853]">
                    Limit {formatINR(remainingBudgetInr)}
                  </span>
                )}
            </div>
          </section>
        )}

        {filteredDrops.map((drop) => {
          const compat = calculateWardrobeCompatibility(drop, wardrobe);
          const budgetAfter = remainingBudgetInr - drop.priceInr;
          const fitsBudget = budgetAfter >= 0;
          const isPurchased = purchasedDropIds.includes(drop.id);
          const isTesting = activeTestDropId === drop.id;

          const compatTone =
            compat >= 70
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
              : compat < 40
              ? 'text-rose-700 bg-rose-50 border-rose-200'
              : 'text-amber-800 bg-amber-50 border-amber-200';

          return (
            <article
              key={drop.id}
              data-testid={`drop-card-${drop.id}`}
              className={`bg-white text-slate-900 rounded-xl p-3.5 transition-all duration-150 ${
                isTesting
                  ? 'ring-2 ring-[#D4A853] shadow-lg'
                  : 'hover:translate-y-[-1px]'
              }`}
            >
              {/* Top Row: Image + Title + Compatibility */}
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-[#F4F3EF]">
                  <GarmentArtwork
                    silhouette={drop.silhouette}
                    colorHex={drop.colorHex}
                    name={drop.name}
                    imageUrl={drop.imageUrl}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-slate-500 truncate">
                        {drop.brand} · {drop.category}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                        {drop.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenVerdict(drop)}
                      aria-label={`View verdict details for ${drop.name}`}
                      className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-colors shrink-0"
                    >
                      <Info className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Clean inline metadata */}
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {drop.vibe} · {drop.fit} · {drop.colorName}
                  </p>

                  {/* Price & Store Badge */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {formatINR(drop.priceInr)} on {drop.storeName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compatibility & Budget Signals */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span
                  data-testid={`drop-compat-${drop.id}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono tabular-nums font-semibold ${compatTone}`}
                >
                  {compat >= 70 ? (
                    <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                  ) : compat < 40 ? (
                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  ) : null}
                  {compat}% Match
                </span>

                <span
                  data-testid={`drop-budget-${drop.id}`}
                  className={`font-mono tabular-nums font-semibold ${
                    fitsBudget ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {fitsBudget
                    ? `Fits Budget (Leaves ${formatINR(budgetAfter)})`
                    : `Over Budget by ${formatINR(Math.abs(budgetAfter))}`}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onTestDrop(drop)}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isTesting
                      ? 'bg-[#D4A853] text-slate-950'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  {isTesting ? 'On Canvas' : 'Test in My Closet'}
                </button>

                <button
                  type="button"
                  disabled={isPurchased}
                  onClick={() => onMarkPurchased(drop)}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                    isPurchased
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
                      : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                  {isPurchased ? 'Purchased' : 'Buy'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
};
