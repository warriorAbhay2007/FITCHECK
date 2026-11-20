import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Part, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  VerifiedSource,
  WardrobeContextPayload,
  buildFitCheckSystemInstruction,
  extractGroundingSources,
  parseImageDataUrl,
} from './src/utils/stylistPrompt';
import {
  LifestyleSceneKey,
  MOODBOARD_RESPONSE_SCHEMA,
  MoodboardGarmentInput,
  MoodboardProfileInput,
  VALID_SCENE_KEYS,
  buildMoodboardPrompt,
  normalizeMoodboardPlan,
} from './src/utils/moodboard';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface ChatMessagePayload {
  role: 'user' | 'model';
  text: string;
  imageDataUrl?: string;
}

interface ChatRequestBody {
  messages?: ChatMessagePayload[];
  mode?: 'stylist' | 'quick';
  wardrobeContext?: WardrobeContextPayload;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractReadableError(err: unknown): { status: number; message: string } {
  const rawStatus =
    typeof (err as { status?: number })?.status === 'number'
      ? (err as { status: number }).status
      : 502;
  const status = rawStatus >= 400 && rawStatus < 600 ? rawStatus : 502;
  const rawMessage =
    err instanceof Error ? err.message : 'Unexpected Gemini API error.';

  try {
    const parsed = JSON.parse(rawMessage) as {
      error?: { message?: string; code?: number };
      message?: string;
    };
    const innerMsg = parsed?.error?.message ?? parsed?.message;
    if (innerMsg) {
      return {
        status: parsed?.error?.code ?? status,
        message: innerMsg,
      };
    }
  } catch {
    // Not JSON, keep rawMessage
  }

  return { status, message: rawMessage };
}

async function sendWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let attempt = 0;
  let delayMs = 450;

  while (true) {
    try {
      return await fn();
    } catch (err: unknown) {
      const { status } = extractReadableError(err);
      const retryable = status === 503 || status === 429;
      if (!retryable || attempt >= retries) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
      delayMs *= 2;
    }
  }
}

function toGeminiParts(msg: { text: string; imageDataUrl?: string }): Part[] {
  const parts: Part[] = [];
  const parsedImage = parseImageDataUrl(msg.imageDataUrl);
  if (parsedImage) {
    parts.push({
      inlineData: {
        mimeType: parsedImage.mimeType,
        data: parsedImage.data,
      },
    });
  }
  const text = msg.text.trim();
  if (text) {
    parts.push({ text });
  } else if (parsedImage) {
    parts.push({
      text: 'Evaluate this outfit photo using the FitCheck AI rubric.',
    });
  }
  return parts;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/chat', async (req: Request, res: Response) => {
    const body = req.body as ChatRequestBody;
    const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
    const cleaned = rawMessages
      .filter(
        (m): m is ChatMessagePayload =>
          (m.role === 'user' || m.role === 'model') &&
          ((typeof m.text === 'string' && m.text.trim().length > 0) ||
            parseImageDataUrl(m.imageDataUrl) !== null),
      )
      .map((m) => ({
        role: m.role,
        text: typeof m.text === 'string' ? m.text.trim() : '',
        imageDataUrl: m.imageDataUrl,
      }));

    if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
      res.status(400).json({
        error: 'Please enter a message or attach an outfit photo before sending.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Check Settings > Secrets to attach GEMINI_API_KEY.',
      });
      return;
    }

    const mode = body.mode === 'quick' ? 'quick' : 'stylist';
    const model =
      mode === 'quick' ? 'gemini-3.1-flash-lite' : 'gemini-4-hydrogen';

    const priorTurns = cleaned.slice(0, -1).map((m) => ({
      role: m.role,
      parts: toGeminiParts(m),
    }));
    const latestParts = toGeminiParts(cleaned[cleaned.length - 1]);

    try {
      const result = await sendWithRetry(async () => {
        const chat = ai.chats.create({
          model,
          history: priorTurns,
          config: {
            systemInstruction: buildFitCheckSystemInstruction(body.wardrobeContext),
            tools: [{ googleSearch: {} }],
            ...(mode === 'stylist'
              ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
              : {}),
          },
        });

        const response = await chat.sendMessage({
          message:
            latestParts.length === 1 && typeof latestParts[0].text === 'string'
              ? latestParts[0].text
              : latestParts,
        });
        const text = (response.text ?? '').trim();
        const sources: VerifiedSource[] = extractGroundingSources(
          response.candidates?.[0]?.groundingMetadata?.groundingChunks,
        );
        return { text, sources };
      });

      if (!result.text) {
        res.status(502).json({
          error: 'Stylist returned an empty response. Please try again.',
        });
        return;
      }

      res.json({
        reply: result.text,
        model,
        sources: result.sources,
      });
    } catch (err: unknown) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({
        error: message,
      });
    }
  });

  app.post('/api/moodboard', async (req: Request, res: Response) => {
    const body = req.body as {
      items?: MoodboardGarmentInput[];
      profile?: MoodboardProfileInput;
      lighting?: 'Daylight' | 'Warm Indoor' | 'Evening';
      sceneKey?: string;
      customNote?: string;
    };

    const items = Array.isArray(body?.items)
      ? body.items.filter(
          (i): i is MoodboardGarmentInput =>
            Boolean(i && typeof i.name === 'string' && i.name.trim().length > 0),
        )
      : [];

    if (items.length === 0) {
      res.status(400).json({
        error: 'Equip at least one garment in the Smart Mirror before generating a moodboard.',
      });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Gemini API key is not configured. Check Settings > Secrets to attach GEMINI_API_KEY.',
      });
      return;
    }

    const sceneKey: LifestyleSceneKey = VALID_SCENE_KEYS.has(
      body.sceneKey as LifestyleSceneKey,
    )
      ? (body.sceneKey as LifestyleSceneKey)
      : 'campus_cafe';

    const lighting =
      body.lighting === 'Daylight' ||
      body.lighting === 'Evening' ||
      body.lighting === 'Warm Indoor'
        ? body.lighting
        : 'Warm Indoor';

    const profile: MoodboardProfileInput = {
      skinTone: body.profile?.skinTone ?? 'wheatish',
      undertone: body.profile?.undertone ?? 'Warm',
      size: body.profile?.size ?? 'M',
      fitPreference: body.profile?.fitPreference ?? 'Regular',
      bodyType: body.profile?.bodyType ?? 'average',
    };

    const parts: Part[] = [];
    for (const item of items.slice(0, 2)) {
      const parsedImage = parseImageDataUrl(item.imageUrl);
      if (parsedImage) {
        parts.push({
          inlineData: {
            mimeType: parsedImage.mimeType,
            data: parsedImage.data,
          },
        });
      }
    }
    parts.push({
      text: buildMoodboardPrompt({
        items,
        profile,
        lighting,
        sceneKey,
        customNote: typeof body.customNote === 'string' ? body.customNote : undefined,
      }),
    });

    try {
      const result = await sendWithRetry(async () => {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: MOODBOARD_RESPONSE_SCHEMA,
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });
        const rawText = (response.text ?? '').trim();
        if (!rawText) {
          throw new Error('Moodboard model returned an empty response.');
        }
        const parsedJson = JSON.parse(rawText) as unknown;
        return normalizeMoodboardPlan(parsedJson, {
          items,
          sceneKey,
          lighting,
        });
      });

      res.json({
        moodboard: result,
        model: 'gemini-3.1-flash-lite',
      });
    } catch (err: unknown) {
      const { status, message } = extractReadableError(err);
      res.status(status).json({
        error: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      plugins: [
        {
          name: 'disable-hmr-client-ws',
          enforce: 'post',
          transform(code: string, id: string) {
            const cleanId = id.split('?')[0];
            if (cleanId.endsWith('/vite/dist/client/client.mjs')) {
              return {
                code: code.replace(
                  'transport.connect(createHMRHandler(handleMessage));',
                  '/* HMR WebSocket connection disabled */',
                ),
                map: null,
              };
            }
          },
        },
      ],
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitCheck server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start FitCheck server:', err);
  process.exit(1);
});
