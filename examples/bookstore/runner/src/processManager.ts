import { spawn, ChildProcess } from "node:child_process";
import { dirname, join } from "node:path";

/**
 * Represents a managed child service process.
 */
interface ManagedProcess {
    name: string;
    process: ChildProcess;
}

const managedProcesses: ManagedProcess[] = [];

/**
 * Spawns a service as a child process using tsx and waits for it to print [READY].
 *
 * Captures stdout/stderr and pipes both to the parent's stdout (prefixed with
 * the service name) so the developer can see service logs during the demo.
 *
 * @param name - Display name for logging and error messages
 * @param scriptPath - Absolute path to the service's entry point .ts file
 * @param timeoutMs - Maximum time to wait for [READY] before failing
 */
export function spawnService(name: string, scriptPath: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
        // Resolve tsx from the service's own node_modules/.bin — pnpm isolates
        // binaries per package, so we can't rely on a global or root-level tsx.
        const serviceRoot = dirname(dirname(scriptPath)); // src/index.ts → src → package root
        const tsxBin = join(serviceRoot, "node_modules", ".bin", "tsx");
        const child = spawn(tsxBin, [scriptPath], {
            stdio: ["ignore", "pipe", "pipe"],
            env: process.env,
        });

        managedProcesses.push({ name, process: child });

        let ready = false;
        let buffer = "";

        const timeoutHandle = setTimeout(() => {
            if (!ready) {
                reject(
                    new Error(
                        `[processManager] ${name} did not print [READY] within ${timeoutMs}ms — ` +
                            `check that RabbitMQ is running and the service config is correct`
                    )
                );
            }
        }, timeoutMs);

        child.stdout?.on("data", (data: Buffer) => {
            buffer += data.toString();
            const lines = buffer.split("\n");
            // Keep the last incomplete line in the buffer
            buffer = lines.pop() ?? "";

            for (const line of lines) {
                if (line.trim()) {
                    // Print service output prefixed for clarity in the runner terminal
                    process.stdout.write(`  [${name}] ${line.trim()}\n`);
                }
                if (!ready && line.includes("[READY]")) {
                    ready = true;
                    clearTimeout(timeoutHandle);
                    resolve();
                }
            }
        });

        child.stderr?.on("data", (data: Buffer) => {
            const text = data.toString().trim();
            if (text) {
                process.stderr.write(`  [${name}] ${text}\n`);
            }
        });

        child.on("error", err => {
            clearTimeout(timeoutHandle);
            reject(new Error(`[processManager] Failed to spawn ${name}: ${err.message}`));
        });

        child.on("exit", (code, signal) => {
            clearTimeout(timeoutHandle);
            if (!ready) {
                reject(
                    new Error(
                        `[processManager] ${name} exited before [READY] — code: ${code}, signal: ${signal}`
                    )
                );
            }
        });
    });
}

/**
 * Sends SIGTERM to all managed child processes and waits for them to exit.
 * Used for graceful shutdown of the demo.
 */
export function killAll(): Promise<void> {
    return new Promise(resolve => {
        if (managedProcesses.length === 0) {
            resolve();
            return;
        }

        let remaining = managedProcesses.length;

        for (const { process: child } of managedProcesses) {
            child.once("exit", () => {
                remaining--;
                if (remaining === 0) {
                    resolve();
                }
            });
            child.kill("SIGTERM");
        }

        // Don't wait forever if a service ignores SIGTERM
        setTimeout(resolve, 3000);
    });
}
