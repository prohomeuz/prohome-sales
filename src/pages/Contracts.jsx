import { Button } from "@/shared/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const REMOTE_CONTRACT_API =
  "https://uncompulsively-unroasted-nicolette.ngrok-free.dev";

function createContract(id, overrides = {}) {
  return {
    id,
    contractNumber: `SH-${new Date().getFullYear()}-${String(id).padStart(4, "0")}`,
    contractDate: "TODAY",
    companyName: "PROHOME DEVELOPMENT MCHJ",
    companyAddress: "Farg'ona sh., Mustaqillik ko'chasi, 12-uy",
    companyDirector: "Azizbek Karimov",
    clientFullName: "Akmaljon Erkinov",
    clientPassport: "AA1234567",
    clientAddress: "Farg'ona vil., Farg'ona tumani, Navbahor MFY",
    clientPhone: "+998 90 123 45 67",
    apartmentNumber: "58",
    apartmentArea: 54.1,
    apartmentFloor: 5,
    buildingAddress: "Farg'ona sh., Ilg'or MFY, MG1730401071/23",
    totalPrice: 400660000,
    downPayment: 0,
    paymentMonths: 60,
    notes: "To'lov oyma-oy bank o'tkazmasi orqali amalga oshiriladi.",
    ...overrides,
  };
}

const MOCK_CONTRACTS = [
  createContract(1),
  createContract(2, {
    clientFullName: "Dilshodbek Rasulov",
    clientPassport: "AB7823490",
    clientPhone: "+998 91 707 12 88",
    apartmentNumber: "63",
    apartmentArea: 61.8,
    apartmentFloor: 6,
    totalPrice: 457320000,
    downPayment: 50000000,
    paymentMonths: 48,
  }),
  createContract(3, {
    clientFullName: "Muhlisa Ergasheva",
    clientPassport: "AC4432281",
    clientAddress: "Farg'ona sh., Yangi Asr ko'chasi, 15-uy",
    clientPhone: "+998 99 880 00 44",
    apartmentNumber: "41",
    apartmentArea: 47.5,
    apartmentFloor: 4,
    totalPrice: 351500000,
    downPayment: 25000000,
    paymentMonths: 36,
  }),
  createContract(4, {
    clientFullName: "Boburjon Tursunov",
    clientPassport: "AD6654321",
    clientPhone: "+998 97 532 41 00",
    apartmentNumber: "77",
    apartmentArea: 72.3,
    apartmentFloor: 8,
    totalPrice: 536120000,
    downPayment: 120000000,
    paymentMonths: 24,
  }),
];

function formatAmount(value) {
  return `${Number(value ?? 0).toLocaleString()} so'm`;
}

async function createContractPdf(contract) {
  const payload = contract;

  const request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };

  const res = await fetch(`${REMOTE_CONTRACT_API}/api/contracts`, request);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "";
    try {
      message = JSON.parse(text)?.error ?? "";
    } catch {
      message = "";
    }
    if (!message && text.includes("ERR_NGROK_3200")) {
      message = "Backend endpoint offline (ngrok link eskirgan)";
    }
    if (!message) message = `PDF generatsiya xatosi (HTTP ${res.status})`;
    throw new Error(message);
  }

  const responsePayload = await res.json();
  if (!responsePayload?.urls?.pdf) throw new Error("PDF link qaytmadi");
  return responsePayload.urls.pdf;
}

export default function Contracts() {
  const [downloadingId, setDownloadingId] = useState(null);
  const [hasVerticalScroll, setHasVerticalScroll] = useState(false);
  const scrollRef = useRef(null);
  const headerShadow = useMemo(
    () =>
      hasVerticalScroll ? "shadow-[0_6px_10px_-8px_rgba(0,0,0,0.35)]" : "",
    [hasVerticalScroll],
  );

  const handleDownloadContract = useCallback(async (contract) => {
    setDownloadingId(contract.id);

    try {
      const pdfUrl = await createContractPdf(contract);
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      toast.success("Shartnoma PDF ochildi");
    } catch (err) {
      toast.error(err?.message || "Shartnomani yuklab bo'lmadi");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setHasVerticalScroll(el.scrollTop > 2);
  }, []);

  return (
    <section className="animate-fade-in h-full p-5">
      <header className="bg-primary/2 mb-6 rounded border p-3">
        <h2 className="text-2xl font-bold">Shartnomalar</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          Hozircha mock ma&apos;lumotlar ko&apos;rsatilmoqda.
        </p>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[calc(100%-96px)] overflow-y-auto pr-2"
      >
        <div className="relative w-full">
          <table className="w-full table-fixed text-xs">
            <thead
              className={`bg-background sticky top-0 z-[3] [&_tr]:border-b ${headerShadow}`}
            >
              <tr className="border-b">
                <th className="text-foreground bg-background sticky left-0 z-[4] h-10 w-[14%] px-2 text-left align-middle font-medium whitespace-normal shadow-[6px_0_10px_-10px_rgba(0,0,0,0.25)]">
                  Shartnoma
                </th>
                <th className="text-foreground h-10 w-[9%] px-2 text-left align-middle font-medium whitespace-normal">
                  Sana
                </th>
                <th className="text-foreground h-10 w-[17%] px-2 text-left align-middle font-medium whitespace-normal">
                  Mijoz
                </th>
                <th className="text-foreground h-10 w-[12%] px-2 text-left align-middle font-medium whitespace-normal">
                  Telefon
                </th>
                <th className="text-foreground h-10 w-[16%] px-2 text-left align-middle font-medium whitespace-normal">
                  Ko'chmas mulk
                </th>
                <th className="text-foreground h-10 w-[15%] px-2 text-left align-middle font-medium whitespace-normal">
                  To'lov shartlari
                </th>
                <th className="text-foreground bg-background sticky right-0 z-[4] h-10 w-[72px] px-2 text-right align-middle font-medium whitespace-normal shadow-[-6px_0_10px_-10px_rgba(0,0,0,0.35)]">
                  Amal
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {MOCK_CONTRACTS.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-muted/50 border-b transition-colors"
                >
                  <td className="bg-background sticky left-0 z-[2] p-2 align-middle whitespace-normal shadow-[6px_0_10px_-10px_rgba(0,0,0,0.22)]">
                    <p className="font-medium">{contract.contractNumber}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {contract.clientPassport}
                    </p>
                  </td>
                  <td className="p-2 align-middle whitespace-normal">
                    {contract.contractDate}
                  </td>
                  <td className="p-2 align-middle break-words whitespace-normal">
                    {contract.clientFullName}
                  </td>
                  <td className="p-2 align-middle break-words whitespace-normal">
                    {contract.clientPhone}
                  </td>
                  <td className="p-2 align-middle break-words whitespace-normal">
                    <p>Uy: {contract.apartmentNumber}</p>
                    <p className="text-muted-foreground text-[11px]">
                      {contract.apartmentFloor}-qavat · {contract.apartmentArea}{" "}
                      m²
                    </p>
                  </td>
                  <td className="p-2 align-middle whitespace-normal">
                    <p>{formatAmount(contract.totalPrice)}</p>
                    <p className="text-muted-foreground text-[11px]">
                      Boshlang'ich: {formatAmount(contract.downPayment)}
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Muddat: {contract.paymentMonths} oy
                    </p>
                  </td>
                  <td className="bg-background sticky right-0 z-[2] w-[72px] p-2 text-right align-middle shadow-[-6px_0_10px_-10px_rgba(0,0,0,0.28)]">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={downloadingId === contract.id}
                      onClick={() => handleDownloadContract(contract)}
                      title="Shartnomani yuklab olish"
                    >
                      {downloadingId === contract.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Download />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
