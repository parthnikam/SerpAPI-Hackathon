import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

const TIMEOUT_MS = 170_000;

function redact(text: string): string {
  return text.replace(/api_key=[^&\s"']+/gi, "api_key=[redacted]");
}

function killTree(proc: ChildProcess) {
  if (!proc.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  proc.kill("SIGKILL");
}

function runQuery(query: string, signal: AbortSignal): Promise<string> {
  const python = process.env.PYTHON_BIN || "python";
  const backend = path.resolve(process.cwd(), "..", "backend");
  return new Promise((resolve, reject) => {
    const proc = spawn(python, ["query.py", query], {
      cwd: backend,
      env: process.env,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      fn();
    };
    const timer = setTimeout(() => {
      killTree(proc);
      finish(() => reject(new Error("Search timed out. Jev or SerpApi took too long.")));
    }, TIMEOUT_MS);
    const onAbort = () => {
      killTree(proc);
      finish(() => reject(new Error("Search cancelled.")));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort);

    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    proc.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    proc.on("error", (error) => {
      const missing = (error as NodeJS.ErrnoException).code === "ENOENT";
      finish(() =>
        reject(missing ? new Error("Python was not found. Set PYTHON_BIN to the interpreter that can run query.py.") : error),
      );
    });
    proc.on("close", (code) => {
      finish(() => {
        if (code !== 0) {
          reject(new Error(redact(stderr.trim() || stdout.trim() || `query.py exited with ${code}.`)));
          return;
        }
        resolve(stdout);
      });
    });
  });
}

function payloadFrom(stdout: string) {
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error(redact(stdout.trim()) || "query.py returned no JSON.");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(stdout.slice(start, end + 1));
  } catch {
    throw new Error("query.py returned invalid JSON.");
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("query.py returned an unexpected payload.");
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.engine !== "string" || !Array.isArray(record.components)) {
    throw new Error("query.py returned an unexpected payload.");
  }
  return record;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Enter a query." }, { status: 400 });
  }
  const query =
    body && typeof body === "object" && "query" in body && typeof body.query === "string"
      ? body.query.trim()
      : "";
  if (!query) return Response.json({ error: "Enter a query." }, { status: 400 });
  if (query.length > 300) return Response.json({ error: "Query is too long." }, { status: 400 });

  try {
    const stdout = await runQuery(query, request.signal);
    return Response.json(payloadFrom(stdout));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed.";
    const status = message === "Search cancelled." ? 499 : 502;
    return Response.json({ error: redact(message).slice(0, 500) }, { status });
  }
}
