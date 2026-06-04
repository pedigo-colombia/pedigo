/**
 * Interfaz del adaptador DIAN.
 *
 * El motor de facturación NO conoce los detalles de la DIAN. Habla con esta
 * interfaz. Hoy existe un `MockDianAdapter`; mañana se implementará un
 * `RealDianAdapter` (software propio habilitado) sin tocar el motor.
 *
 * Fases futuras cubiertas por esta interfaz:
 *  - generación de XML compatible DIAN
 *  - firma digital
 *  - validación previa
 *  - set de pruebas
 *  - CUFE
 *  - recepción de respuesta DIAN
 *  - contingencia y reintentos
 */

export interface DianDocumentPayload {
  organizationId: string;
  docType: string;
  fullNumber: string;
  /** Representación neutra del documento (luego se serializa a XML). */
  document: Record<string, unknown>;
}

export interface DianSubmissionResult {
  /** Código Único de Factura Electrónica (vacío en mock). */
  cufe: string | null;
  status: "accepted" | "rejected" | "pending" | "mock";
  /** Respuesta cruda del proveedor/DIAN para trazabilidad. */
  rawResponse: Record<string, unknown>;
  /** XML firmado, cuando aplique. */
  signedXml?: string | null;
}

export interface DianAdapter {
  readonly environment: "mock" | "test" | "prod";

  /** Valida el documento antes de enviarlo (pre-validación). */
  validate(payload: DianDocumentPayload): Promise<{
    valid: boolean;
    errors: string[];
  }>;

  /** Construye, firma y envía el documento a la DIAN. */
  submit(payload: DianDocumentPayload): Promise<DianSubmissionResult>;

  /** Consulta el estado de un documento previamente enviado. */
  getStatus(cufe: string): Promise<DianSubmissionResult>;
}
