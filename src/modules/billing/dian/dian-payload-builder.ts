import type { FiscalSnapshot, FiscalSettings } from "../types";
import type { DianDocumentPayload } from "./dian-adapter.interface";

/**
 * Construye el payload neutro que luego se transformará en XML DIAN.
 *
 * Por ahora produce una estructura JSON con los campos fiscales mínimos.
 * En la fase de software propio, este mismo builder alimentará al serializador
 * UBL 2.1 (formato exigido por la DIAN).
 */
export function buildDianPayload(args: {
  docType: string;
  fullNumber: string;
  fiscal: FiscalSettings;
  snapshot: FiscalSnapshot;
}): DianDocumentPayload {
  const { docType, fullNumber, fiscal, snapshot } = args;

  return {
    organizationId: fiscal.organizationId,
    docType,
    fullNumber,
    document: {
      issuer: {
        legalName: fiscal.legalName,
        nit: fiscal.nit,
        regime: fiscal.regime,
        address: fiscal.address,
      },
      customer: snapshot.customer,
      lines: snapshot.lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
        discount: l.discount ?? 0,
      })),
      totals: snapshot.money,
      meta: {
        channel: snapshot.channel,
        capturedAt: snapshot.capturedAt,
        orderId: snapshot.orderId,
      },
    },
  };
}
