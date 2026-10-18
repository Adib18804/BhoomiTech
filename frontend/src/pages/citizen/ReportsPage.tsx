import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import reportService, { ReportSummary } from "../../services/reportService";

const RISK_STYLES: Record<string, string> = {
  LOW_CONCERN: "text-green-700 bg-green-100 border-green-200",
  REVIEW_REQUIRED: "text-yellow-700 bg-yellow-100 border-yellow-200",
  HIGH_ATTENTION: "text-orange-700 bg-orange-100 border-orange-200",
  CRITICAL_SIGNAL: "text-red-700 bg-red-100 border-red-200",
  INSUFFICIENT_DATA: "text-gray-700 bg-gray-100 border-gray-200",
};

export default function ReportsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<{
    id: string;
    action: "view" | "download";
  } | null>(null);

  const isBn = i18n.language === "bn";
  const bnFont = isBn ? "font-bengali" : "";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setReports(await reportService.listMyReports());
    } catch {
      setError(t("reportsPage.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString(isBn ? "bn-BD" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const handleView = async (reportId: string) => {
    setBusy({ id: reportId, action: "view" });
    try {
      await reportService.viewReportPdf(reportId);
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (reportId: string) => {
    setBusy({ id: reportId, action: "download" });
    try {
      await reportService.downloadReportPdf(reportId);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start mb-6">
        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 mr-3 sm:mr-4 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <h1
            className={`text-2xl sm:text-3xl font-bold text-gray-900 break-words ${bnFont}`}
          >
            {t("reportsPage.title")}
          </h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>
            {t("reportsPage.subtitle")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-10 h-10 text-primary-600 mx-auto mb-3 animate-spin" />
          <p className={`text-gray-600 ${bnFont}`}>{t("common.loading")}</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <AlertTriangle className="w-9 h-9 text-red-600 mx-auto mb-3" />
          <p className={`text-red-700 mb-4 ${bnFont}`}>{error}</p>
          <button
            onClick={load}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className={bnFont}>{t("reportsPage.retry")}</span>
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <FileText className="w-14 h-14 mx-auto mb-4 text-gray-400" />
          <p className={`mb-4 ${bnFont}`}>{t("reportsPage.noReports")}</p>
          <button
            onClick={() => navigate("/my-checks")}
            className="btn-secondary"
          >
            {t("myChecks.title")}
          </button>
        </div>
      ) : (
        <div className="card p-6">
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.report_id}
                className="border border-gray-200 rounded-md p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full border text-xs font-semibold ${RISK_STYLES[r.overall_risk_level || ""] || RISK_STYLES.INSUFFICIENT_DATA} ${bnFont}`}
                      >
                        {t(
                          `riskLevels.${r.overall_risk_level}`,
                          r.overall_risk_level || "",
                        )}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-medium text-gray-600 uppercase">
                        {r.language}
                      </span>
                    </div>
                    <p
                      className={`text-sm text-gray-900 font-medium ${bnFont}`}
                    >
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {t("reportsPage.reportId")}: {r.report_id}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {t("reportsPage.caseId")}:{" "}
                      <button
                        onClick={() =>
                          navigate(`/verification/case/${r.case_id}`)
                        }
                        className="text-primary-600 hover:text-primary-700 underline"
                      >
                        {r.case_id}
                      </button>
                    </p>
                    <p className={`text-xs text-gray-500 mt-1 ${bnFont}`}>
                      {t("reportsPage.createdOn")} {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleView(r.report_id)}
                      disabled={busy !== null}
                      className="btn-secondary text-xs px-3 py-1.5 flex items-center disabled:opacity-60"
                    >
                      {busy?.id === r.report_id && busy.action === "view" ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span className={bnFont}>{t("reportsPage.view")}</span>
                    </button>
                    <button
                      onClick={() => handleDownload(r.report_id)}
                      disabled={busy !== null}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center disabled:opacity-60"
                    >
                      {busy?.id === r.report_id &&
                      busy.action === "download" ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1" />
                      )}
                      <span className={bnFont}>
                        {t("reportsPage.download")}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-md p-4">
        <p className={`text-xs text-amber-800 ${bnFont}`}>
          {t("reportsPage.notice")}
        </p>
      </div>
    </div>
  );
}
