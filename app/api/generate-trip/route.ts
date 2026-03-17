import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import type { GenerateTripResult, TripFormData, TripPlan } from '../../../lib/trip-types';

export const runtime = 'nodejs';

type StreamEvent =
  | { type: 'progress'; stage: string; status: string; message: string }
  | { type: 'result'; data: GenerateTripResult }
  | { type: 'error'; message: string };

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'trip';
}

function buildOutputName(payload: TripFormData): string {
  return `${slugify(payload.destination)}_${Date.now()}`;
}

function getPythonCandidates(repoRoot: string): string[] {
  return [
    path.join(repoRoot, '.venv', 'bin', 'python3'),
    path.join(repoRoot, '.venv', 'Scripts', 'python.exe'),
    'python3',
    'python',
  ];
}

async function resolvePythonCommand(repoRoot: string): Promise<string> {
  for (const candidate of getPythonCandidates(repoRoot).slice(0, 2)) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next candidate.
    }
  }
  return process.platform === 'win32' ? 'python' : 'python3';
}

function writeEvent(controller: ReadableStreamDefaultController<Uint8Array>, event: StreamEvent): void {
  controller.enqueue(new TextEncoder().encode(`${JSON.stringify(event)}\n`));
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as TripFormData;
  const repoRoot = process.cwd();
  const pythonCommand = await resolvePythonCommand(repoRoot);
  const backendScript = path.join(repoRoot, 'backend', 'api.py');
  const outputsDir = path.join(repoRoot, 'backend', 'outputs');
  const outputName = buildOutputName(payload);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const args = [
        backendScript,
        '--destination', payload.destination,
        '--duration', payload.duration,
        '--budget', payload.budget,
        '--interests', payload.interests.join(','),
        '--travel-dates', payload.travelDates,
        '--travel-style', payload.travelStyle,
        '--trip-notes', payload.tripNotes,
        '--research-mode', 'live',
        '--planner-mode', 'live',
        '--prompt-mode', 'live',
        '--canvas-mode', 'live',
        '--max-images', '4',
        '--quiet-plan-print',
        '--output-name', outputName,
        '--progress-json',
      ];

      const child = spawn(pythonCommand, args, { cwd: repoRoot, env: process.env });
      let stderr = '';
      let stdoutBuffer = '';

      writeEvent(controller, {
        type: 'progress',
        stage: 'init',
        status: 'start',
        message: 'Launching backend generator',
      });

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString();
        const lines = stdoutBuffer.split(/\r?\n/);
        stdoutBuffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }
          try {
            const parsed = JSON.parse(trimmed) as { event?: string; stage?: string; status?: string; message?: string };
            if (parsed.event === 'progress' && parsed.stage && parsed.status && parsed.message) {
              writeEvent(controller, {
                type: 'progress',
                stage: parsed.stage,
                status: parsed.status,
                message: parsed.message,
              });
            }
          } catch {
            // Ignore non-JSON log lines; frontend only consumes structured progress events.
          }
        }
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', () => {
        writeEvent(controller, {
          type: 'error',
          message: `Unable to start the Python backend using ${pythonCommand}. Ensure .venv or a local Python runtime is available.`,
        });
        controller.close();
      });

      child.on('close', async (code: number | null) => {
        if (code !== 0) {
          writeEvent(controller, {
            type: 'error',
            message: stderr.trim() || `Backend generator exited with code ${code}`,
          });
          controller.close();
          return;
        }

        try {
          const planPath = path.join(outputsDir, `${outputName}.json`);
          const markdownPath = path.join(outputsDir, `${outputName}_frontend_dump.md`);
          const planRaw = await fs.readFile(planPath, 'utf-8');
          const plan = JSON.parse(planRaw) as TripPlan;
          const outputFiles = await fs.readdir(outputsDir);
          const generatedImages = outputFiles
            .filter((name: string) => name.startsWith(`${outputName}_scene_`) && name.endsWith('.png'))
            .sort()
            .map((name: string, index: number) => ({
              scene_id: plan.media_scenes[index]?.scene_id ?? name.replace(`${outputName}_`, '').replace('.png', ''),
              file: path.join(outputsDir, name),
              url: `/api/generated-asset?name=${encodeURIComponent(name)}`,
            }));

          const result: GenerateTripResult = {
            plan,
            generatedImages,
            markdownPath: markdownPath,
            outputName,
          };
          writeEvent(controller, { type: 'result', data: result });
        } catch (error) {
          writeEvent(controller, {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unable to read generated output',
          });
        }
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
