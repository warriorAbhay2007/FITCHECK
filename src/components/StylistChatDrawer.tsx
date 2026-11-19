import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImagePlus,
  Loader2,
  MessageSquare,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  OutfitSlots,
  TrendingDrop,
  WardrobeItem,
} from '../types/wardrobe';
import {
  DEFAULT_STYLIST_PROFILE,
  IntendedFit,
  SkinDepth,
  SkinUndertone,
  StylistProfile,
  TargetSize,
  VerifiedSource,
  normalizeStylistProfile,
  sanitizeHttpUrl,
} from '../utils/stylistPrompt';
import { formatINR, isTrendingDrop } from '../utils/wardrobeLogic';

export interface StylistMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageDataUrl?: string;
  modelLabel?: string;
  sources?: VerifiedSource[];
}

type ChatMode = 'stylist' | 'quick';

interface StylistChatDrawerProps {
  isOpen: boolean;
  wardrobe: WardrobeItem[];
  slots: OutfitSlots;
  activeDrop: TrendingDrop | null;
  monthlyLimitInr: number;
  remainingBudgetInr: number;
  onClose: () => void;
}

const STORAGE_KEY = 'fitcheck_stylist_chat_v1';
const PROFILE_STORAGE_KEY = 'fitcheck_stylist_profile_v1';

const SIZE_OPTIONS: TargetSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const FIT_OPTIONS: IntendedFit[] = [
  'Slim',
  'Regular',
  'Relaxed/Oversized',
  'Cropped',
];
const SKIN_TONE_OPTIONS: SkinDepth[] = [
  'Fair/Light',
  'Medium/Wheatish',
  'Olive/Tan',
  'Deep/Rich',
];
const UNDERTONE_OPTIONS: SkinUndertone[] = ['Warm', 'Cool', 'Neutral'];

const STARTER_PROMPTS = [
  'Evaluate my current canvas outfit & suggest under-₹1,000 swaps.',
  'Find under-₹1,000 Zudio or Westside picks that flatter my skin tone.',
  'How do my canvas colors and fit pair with my size & undertone?',
];

function loadInitialMessages(): StylistMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StylistMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadInitialProfile(): StylistProfile {
  if (typeof window === 'undefined') return { ...DEFAULT_STYLIST_PROFILE };
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STYLIST_PROFILE };
    const parsed = JSON.parse(raw) as Partial<Record<keyof StylistProfile, string>>;
    return normalizeStylistProfile(parsed);
  } catch {
    return { ...DEFAULT_STYLIST_PROFILE };
  }
}

async function compressPhotoForUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected image.'));
    reader.onload = () => {
      const rawUrl = reader.result;
      if (typeof rawUrl !== 'string') {
        reject(new Error('Invalid image data.'));
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawUrl);
      img.onload = () => {
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

function renderInlineSegments(text: string): React.ReactNode {
  return text
    .split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .map((segment, segIdx) => {
      const linkMatch = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const safeUrl = sanitizeHttpUrl(linkMatch[2]);
        if (safeUrl) {
          return (
            <a
              key={segIdx}
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 hover:text-emerald-900 underline decoration-emerald-600/60 underline-offset-2 break-words"
            >
              {label}
              <ExternalLink
                className="inline w-3 h-3 ml-0.5 align-text-bottom"
                aria-hidden="true"
              />
            </a>
          );
        }
        return <React.Fragment key={segIdx}>{label}</React.Fragment>;
      }
      if (segment.startsWith('**') && segment.endsWith('**')) {
        return (
          <strong key={segIdx} className="font-semibold">
            {segment.slice(2, -2)}
          </strong>
        );
      }
      if (
        segment.startsWith('*') &&
        segment.endsWith('*') &&
        segment.length > 2
      ) {
        return (
          <em key={segIdx} className="italic text-slate-700">
            {segment.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={segIdx}>{segment}</React.Fragment>;
    });
}

function renderFormattedText(text: string): React.ReactNode {
  return text.split('\n').map((line, lineIdx) => {
    const headingMatch = line.match(/^\s*#{1,4}\s+(.*)$/);
    if (headingMatch) {
      return (
        <p key={lineIdx} className="font-display font-bold text-slate-950 pt-1.5">
          {renderInlineSegments(headingMatch[1])}
        </p>
      );
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (bulletMatch) {
      return (
        <div key={lineIdx} className="flex items-start gap-1.5 pl-1 mt-0.5">
          <span aria-hidden="true" className="text-slate-500">
            •
          </span>
          <span>{renderInlineSegments(bulletMatch[1])}</span>
        </div>
      );
    }

    if (line.trim() === '') {
      return <div key={lineIdx} className="h-2" />;
    }

    return <p key={lineIdx}>{renderInlineSegments(line)}</p>;
  });
}

export const StylistChatDrawer: React.FC<StylistChatDrawerProps> = ({
  isOpen,
  wardrobe,
  slots,
  activeDrop,
  monthlyLimitInr,
  remainingBudgetInr,
  onClose,
}) => {
  const [messages, setMessages] = useState<StylistMessage[]>(() =>
    loadInitialMessages(),
  );
  const [profile, setProfile] = useState<StylistProfile>(() =>
    loadInitialProfile(),
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>('stylist');
  const [draft, setDraft] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Fallback: strip base64 image payloads if storage quota is tight
      try {
        const compact = messages.map(({ imageDataUrl: _ignored, ...rest }) => rest);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage errors
    }
  }, [profile]);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages.length, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const buildWardrobeContext = () => {
    const wardrobeSummary = wardrobe.map(
      (item) =>
        `${item.name} (${item.category}, ${item.colorName}, ${item.vibe}, ${item.fit} fit)`,
    );
    const canvasSummary = Object.entries(slots)
      .filter(([, item]) => item !== null)
      .map(([slot, item]) => {
        if (!item) return '';
        const dropSuffix = isTrendingDrop(item)
          ? ` [Test-Driving Drop · ${formatINR(item.priceInr)}]`
          : '';
        return `${slot}: ${item.name} (${item.colorName}, ${item.vibe}, ${item.fit} fit)${dropSuffix}`;
      })
      .filter(Boolean);

    const activeDropSummary = activeDrop
      ? `${activeDrop.name} by ${activeDrop.brand} (${activeDrop.category}, ${activeDrop.vibe}, ${activeDrop.fit} fit, ${activeDrop.colorName}, ${formatINR(activeDrop.priceInr)} at ${activeDrop.storeName}, URL: ${activeDrop.storeUrl})`
      : null;

    return {
      monthlyLimitInr,
      remainingBudgetInr,
      wardrobeSummary,
      canvasSummary,
      activeDropSummary,
      stylistProfile: profile,
    };
  };

  const handlePhotoSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      setErrorMsg('');
      const compressed = await compressPhotoForUpload(file);
      setPendingPhoto(compressed);
    } catch {
      setErrorMsg('Could not process that outfit photo. Try a PNG or JPEG.');
    }
  };

  const sendMessage = async (
    textToSend: string,
    attachedPhoto: string | null = pendingPhoto,
  ) => {
    const trimmed = textToSend.trim();
    if (!trimmed && !attachedPhoto) {
      setErrorMsg('Type a styling question or attach an outfit photo before sending.');
      return;
    }
    if (isSending) return;

    const effectiveText =
      trimmed || 'Evaluate this outfit photo for fit, size, and color harmony.';

    setErrorMsg('');
    const userMessage: StylistMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: effectiveText,
      ...(attachedPhoto ? { imageDataUrl: attachedPhoto } : {}),
    };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setDraft('');
    setPendingPhoto(null);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          messages: nextHistory.map((m) => ({
            role: m.role,
            text: m.text,
            ...(m.imageDataUrl ? { imageDataUrl: m.imageDataUrl } : {}),
          })),
          wardrobeContext: buildWardrobeContext(),
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        model?: string;
        sources?: VerifiedSource[];
        error?: string;
      };

      if (!response.ok || !data.reply) {
        setErrorMsg(
          data.error ?? 'Unable to reach FitCheck AI right now.',
        );
        return;
      }

      const modelLabel =
        data.model === 'gemini-3.1-flash-lite'
          ? 'Quick · Flash Lite'
          : 'FitCheck AI · Hydrogen + Search';

      const verifiedSources = Array.isArray(data.sources)
        ? data.sources.filter((s) => Boolean(sanitizeHttpUrl(s.uri)))
        : [];

      setMessages((prev) => [
        ...prev,
        {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.reply as string,
          modelLabel,
          ...(verifiedSources.length > 0 ? { sources: verifiedSources } : {}),
        },
      ]);
    } catch {
      setErrorMsg('Network error while contacting FitCheck AI.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(draft);
  };

  const handleClearChat = () => {
    setMessages([]);
    setPendingPhoto(null);
    setErrorMsg('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stylist-chat-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/70"
    >
      <div className="w-full max-w-md bg-[#151922] border-l border-white/10 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare
              className="w-4 h-4 text-[#D4A853] shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="stylist-chat-title"
                className="font-display text-base font-bold text-white truncate"
              >
                FitCheck AI Stylist
              </h2>
              <p className="text-[11px] text-slate-400 truncate">
                Try-on fit, skin tone & under-₹1,000 India picks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClearChat}
                aria-label="Clear stylist conversation"
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close stylist chat"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Model Tier Toggle & Fit/Skin Tone Profile */}
        <div className="px-4 py-2.5 border-b border-white/[0.06] bg-[#11151E] space-y-2">
          <div
            role="tablist"
            aria-label="Select Gemini response speed"
            className="grid grid-cols-2 gap-1 p-1 bg-[#0E1117] rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'stylist'}
              onClick={() => setMode('stylist')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'stylist'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Stylist (Hydrogen)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'quick'}
              onClick={() => setMode('quick')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                mode === 'quick'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" />
              Quick (Flash Lite)
            </button>
          </div>

          <button
            type="button"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#0E1117] border border-white/10 hover:border-white/20 text-xs transition-colors"
          >
            <span className="inline-flex items-center gap-1.5 text-slate-300 truncate">
              <SlidersHorizontal
                className="w-3.5 h-3.5 text-[#D4A853] shrink-0"
                aria-hidden="true"
              />
              <span className="truncate">
                Size {profile.selectedSize} · {profile.intendedFit} ·{' '}
                {profile.skinTone} ({profile.undertone})
              </span>
            </span>
            {isProfileOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            )}
          </button>

          {isProfileOpen && (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#0E1117] border border-white/10 text-xs">
              <label className="space-y-1">
                <span className="block text-[10px] font-medium text-slate-400">
                  Target Size
                </span>
                <select
                  aria-label="Target Size"
                  value={profile.selectedSize}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      selectedSize: e.target.value as TargetSize,
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded-md bg-[#151922] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
                >
                  {SIZE_OPTIONS.map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[10px] font-medium text-slate-400">
                  Preferred Fit
                </span>
                <select
                  aria-label="Preferred Fit"
                  value={profile.intendedFit}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      intendedFit: e.target.value as IntendedFit,
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded-md bg-[#151922] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
                >
                  {FIT_OPTIONS.map((fit) => (
                    <option key={fit} value={fit}>
                      {fit}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[10px] font-medium text-slate-400">
                  Skin Depth
                </span>
                <select
                  aria-label="Skin Depth"
                  value={profile.skinTone}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      skinTone: e.target.value as SkinDepth,
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded-md bg-[#151922] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
                >
                  {SKIN_TONE_OPTIONS.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="block text-[10px] font-medium text-slate-400">
                  Undertone
                </span>
                <select
                  aria-label="Undertone"
                  value={profile.undertone}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      undertone: e.target.value as SkinUndertone,
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded-md bg-[#151922] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#D4A853]"
                >
                  {UNDERTONE_OPTIONS.map((ut) => (
                    <option key={ut} value={ut}>
                      {ut}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Scrollable Message Thread */}
        <div
          data-testid="stylist-chat-thread"
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 ? (
            <div className="space-y-4 py-4">
              <div className="bg-[#0E1117]/80 border border-white/10 rounded-xl p-4">
                <p className="font-display text-sm font-semibold text-white">
                  FitCheck AI · Under-₹1,000 India Finder
                </p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Upload a try-on photo or ask about your{' '}
                  {wardrobe.length}-piece closet. Set your size, preferred fit,
                  and skin depth above for fit critiques and verified Zudio,
                  Westside, Reliance Trends &amp; The Souled Store links under
                  ₹1,000.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-medium text-slate-400">
                  Suggested questions
                </p>
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void sendMessage(prompt, null)}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-[#0E1117] hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`chat-message-${msg.role}`}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#D4A853] text-slate-950 font-medium rounded-br-sm whitespace-pre-wrap space-y-2'
                      : 'bg-white text-slate-900 rounded-bl-sm space-y-0.5'
                  }`}
                >
                  {msg.imageDataUrl && (
                    <img
                      src={msg.imageDataUrl}
                      alt="Uploaded outfit for FitCheck"
                      className="max-h-44 w-auto rounded-lg object-cover border border-black/10"
                    />
                  )}
                  {msg.role === 'model' ? (
                    renderFormattedText(msg.text)
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>
                {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 max-w-[88%] rounded-xl bg-[#0E1117] border border-white/10 px-3 py-2 space-y-1">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Verified Search Links
                    </p>
                    <ul className="space-y-1">
                      {msg.sources.slice(0, 6).map((src) => (
                        <li key={src.uri}>
                          <a
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 break-all"
                          >
                            <span className="line-clamp-1">{src.title}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {msg.role === 'model' && msg.modelLabel && (
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.modelLabel}
                  </span>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-start">
              <div className="inline-flex items-center gap-2 bg-white/10 text-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs">
                <Loader2
                  className="w-3.5 h-3.5 animate-spin text-[#D4A853]"
                  aria-hidden="true"
                />
                <span>Checking fit, skin tone &amp; under-₹1,000 picks…</span>
              </div>
            </div>
          )}

          <div ref={scrollEndRef} />
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            role="alert"
            className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-rose-950/80 border border-rose-500/40 px-3 py-2 text-xs text-rose-200"
          >
            <AlertCircle
              className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-white/10 bg-[#11151E] space-y-2.5"
        >
          {pendingPhoto && (
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0E1117] border border-white/10">
              <img
                src={pendingPhoto}
                alt="Outfit photo ready to send"
                className="w-11 h-11 rounded-md object-cover border border-white/10 shrink-0"
              />
              <span className="text-xs text-slate-300 flex-1 truncate">
                Outfit photo attached
              </span>
              <button
                type="button"
                onClick={() => setPendingPhoto(null)}
                aria-label="Remove attached outfit photo"
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              aria-label="Upload outfit photo"
              onChange={(e) => void handlePhotoSelected(e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              aria-label="Attach outfit photo"
              className="inline-flex items-center justify-center p-2.5 bg-[#0E1117] hover:bg-white/10 border border-white/15 text-slate-200 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <ImagePlus className="w-4 h-4 text-[#D4A853]" aria-hidden="true" />
            </button>
            <label htmlFor="stylist-chat-input" className="sr-only">
              Ask FitCheck AI
            </label>
            <input
              id="stylist-chat-input"
              type="text"
              placeholder="Ask for under-₹1,000 picks, fit check, or attach photo…"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              disabled={isSending}
              className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-[#0E1117] border border-white/15 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4A853] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSending}
              aria-label="Send message to FitCheck AI"
              className="inline-flex items-center justify-center p-2.5 bg-[#D4A853] hover:bg-[#DFB96E] text-slate-950 rounded-lg transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
