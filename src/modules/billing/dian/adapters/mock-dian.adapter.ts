import { randomUUID } from "node:crypto";

import type {
  DianAdapter,
  DianDocumentPayload,
  DianSubmissionResult,
} from "../dian-adapter.interface";

/**
 * Adaptador DIAN simulado (entorno `mock`).
 *
 * Permite operar el motor de facturación completo SIN integración real:
 *  - genera un "CUFE" simulado (hash UUID),
 *  - siempre acepta documentos válidos,
 *  - registra el payload para trazabilidad.
 *
 * Cuando se habilite el software propio ante la DIAN, se creará
 * `RealDianAdapter implements DianAdapter` y se cambiará la fábrica en
 * `factory.ts`. El motor no cambia.
 */
export class MockDianAdapter implements DianAdapter {
  readonly environment = "mock" as const;

  async validate(payload: DianDocumentPayload) {
    const errors: string[] = [];
    if (!payload.fullNumber) errors.push("Falta numeración fiscal.");
    const doc = payload.document as { lines?: unknown[] };
    if (!doc.lines || doc.lines.length === 0) {
      errors.push("El documento no tiene líneas.");
    }
    return { valid: errors.length === 0, errors };
  }

  async submit(payload: DianDocumentPayload): Promise<DianSubmissionResult> {
    const { valid, errors } = await this.validate(payload);
    if (!valid) {
      return {
        cufe: null,
        status: "rejected",
        rawResponse: { errors },
      };
    }

    // CUFE simulado determinístico-ish para la demo.
    const cufe = `MOCK-${randomUUID().replace(/-/g, "").slice(0, 32)}`;

    return {
      cufe,
      status: "mock",
      signedXml: null,
      rawResponse: {
        environment: "mock",
        acceptedAt: new Date().toISOString(),
        fullNumber: payload.fullNumber,
      },
    };
  }

  async getStatus(cufe: string): Promise<DianSubmissionResult> {
    return {
      cufe,
      status: "mock",
      rawResponse: { note: "Estado simulado (mock)." },
    };
  }
}
