import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const SALES_CONTRACT_ENDPOINT = "/local-contract-service/sales-contract";

function getPathname(url = "") {
  return url.split("?")[0] ?? "";
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("JSON body o'qilmadi."));
      }
    });
    req.on("error", reject);
  });
}

function runPowerShellScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      [
        "-NoLogo",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
        ...args,
      ],
      {
        windowsHide: true,
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(
        new Error(
          stderr.trim() ||
            stdout.trim() ||
            "Word orqali shartnoma yaratib bo'lmadi.",
        ),
      );
    });
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

async function handleSalesContractRequest({
  req,
  res,
  templatePath,
  scriptPath,
}) {
  const body = await readJsonBody(req);

  if (!body?.contractNumber || !body?.fullName) {
    sendJson(res, 400, {
      message: "Shartnoma ma'lumotlari to'liq yuborilmadi.",
    });
    return;
  }

  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `sales-contract-${randomUUID()}-`),
  );
  const payloadPath = path.join(tempDir, "payload.json");
  const outputPath = path.join(tempDir, "sales-contract.pdf");

  try {
    await fs.writeFile(payloadPath, JSON.stringify(body, null, 2), "utf8");

    await runPowerShellScript(scriptPath, [
      "-TemplatePath",
      templatePath,
      "-PayloadPath",
      payloadPath,
      "-OutputPath",
      outputPath,
    ]);

    const pdfBuffer = await fs.readFile(outputPath);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    sendJson(res, 500, {
      message: error?.message || "Shartnoma PDF yaratilmadi.",
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

export function createSalesContractServicePlugin() {
  const templatePath = path.resolve(
    process.cwd(),
    "public/contracts/sales-contract-template.doc",
  );
  const scriptPath = path.resolve(
    process.cwd(),
    "tools/sales-contract-service/generate-sales-contract.ps1",
  );

  const middleware = async (req, res, next) => {
    const pathname = getPathname(req.url);
    if (pathname !== SALES_CONTRACT_ENDPOINT) {
      next();
      return;
    }

    if (req.method !== "POST") {
      sendJson(res, 405, { message: "Faqat POST so'rovi qo'llab-quvvatlanadi." });
      return;
    }

    await handleSalesContractRequest({
      req,
      res,
      templatePath,
      scriptPath,
    });
  };

  return {
    name: "sales-contract-service",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
