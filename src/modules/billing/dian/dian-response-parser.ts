import type { DianSubmissionResult } from "./dian-adapter.interface";

/**
 * Normaliza la respuesta de la DIAN/proveedor a una forma estable para el
 * resto del sistema. En la fase real parseará el XML de respuesta (ApplicationResponse)
 * y extraerá estado, CUFE, errores y observaciones.
 */
export interface ParsedDianResponse {
  accepted: boolean;
  cufe: string | null;
  status: DianSubmissionResult["status"];
  messages: string[];
}

export function parseDianResponse(
  result: DianSubmissionResult,
): ParsedDianResponse {
  const messages: string[] = [];
  const raw = result.rawResponse ?? {};

  if (Array.isArray((raw as { errors?: unknown }).errors)) {
    for (const e of (raw as { errors: unknown[] }).errors) {
      messages.push(String(e));
    }
  }

  return {
    accepted: result.status === "accepted" || result.status === "mock",
    cufe: result.cufe,
    status: result.status,
    messages,
  };
}
