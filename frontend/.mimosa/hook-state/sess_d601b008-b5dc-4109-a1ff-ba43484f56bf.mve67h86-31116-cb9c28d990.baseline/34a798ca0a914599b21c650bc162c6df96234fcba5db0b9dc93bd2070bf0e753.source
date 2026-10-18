import { useTranslation } from "react-i18next";
import {
  Building2,
  Landmark,
  PhoneCall,
  Phone,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
} from "lucide-react";

const OFFICIAL_RESOURCES: { key: string; url: string }[] = [
  { key: "landInfo", url: "https://land.gov.bd" },
  { key: "ministry", url: "https://minland.gov.bd" },
  { key: "mutation", url: "https://mutation.land.gov.bd" },
  { key: "recordMap", url: "https://dlrms.land.gov.bd" },
  { key: "landTax", url: "https://portal.ldtax.gov.bd" },
  { key: "laws", url: "https://bdlaws.minlaw.gov.bd" },
];

export default function Footer() {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isBengali = i18n.language === "bn";

  return (
    <footer
      className={`bg-primary-950 text-primary-50 mt-auto border-t border-primary-800 ${
        isBengali ? "font-bengali" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* COLUMN 1 — BHOOMITECH */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/logo.png" alt="BhoomiTech" className="h-9 w-auto" />
              <span className="text-lg font-bold text-white">BhoomiTech</span>
            </div>
            <p className="text-sm font-semibold text-primary-300 mb-2">
              {t("common.tagline")}
            </p>
            <p className="text-sm text-primary-100/80 leading-relaxed">
              {t("footer.brandDescription")}
            </p>
            <span className="inline-flex items-center gap-1.5 mt-4 rounded-full border border-primary-700 bg-primary-900 px-3 py-1 text-xs font-medium text-primary-200">
              <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t("footer.prototypeBadge")}
            </span>
          </div>

          {/* COLUMN 2 — OFFICIAL LAND & REGISTRATION RESOURCES */}
          <div id="footer-official">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wide mb-4">
              <Landmark
                className="w-4 h-4 text-primary-300"
                aria-hidden="true"
              />
              {t("footer.official.title")}
            </h3>
            <ul className="space-y-2.5">
              {OFFICIAL_RESOURCES.map(({ key, url }) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t(`footer.official.${key}`)} (${t(
                      "footer.official.externalLabel",
                    )})`}
                    className="group inline-flex items-center gap-2 text-sm text-primary-100/85 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 rounded transition-colors"
                  >
                    <ExternalLink
                      className="w-3.5 h-3.5 shrink-0 text-primary-400 group-hover:text-primary-200"
                      aria-hidden="true"
                    />
                    <span>{t(`footer.official.${key}`)}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-l-2 border-primary-700 pl-3 text-xs text-primary-200/70 leading-relaxed">
              {t("footer.official.notice")}
            </p>
          </div>

          {/* COLUMN 3 — CITIZEN SUPPORT & CONTACT */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wide mb-4">
              <PhoneCall
                className="w-4 h-4 text-primary-300"
                aria-hidden="true"
              />
              {t("footer.support.title")}
            </h3>
            <p className="text-xs text-primary-200/70 mb-3 leading-relaxed">
              {t("footer.support.subtitle")}
            </p>

            <ul className="space-y-3">
              <li>
                <a
                  href="tel:16122"
                  aria-label={`${t("footer.support.landHelplineNumber")} ${t(
                    "footer.support.landHelplineLabel",
                  )}`}
                  className="flex items-start gap-3 rounded-lg border border-primary-800 bg-primary-900 px-3 py-2.5 hover:border-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 transition-colors"
                >
                  <Phone
                    className="w-4 h-4 mt-0.5 shrink-0 text-primary-300"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-base font-semibold text-white">
                      {t("footer.support.landHelplineNumber")}
                    </span>
                    <span className="block text-xs text-primary-200/80">
                      {t("footer.support.landHelplineLabel")}
                    </span>
                    <span className="block text-xs text-primary-300/70">
                      {t("footer.support.landHelplineNote")}
                    </span>
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="tel:333"
                  aria-label={`${t("footer.support.nationalHelplineNumber")} ${t(
                    "footer.support.nationalHelplineLabel",
                  )} (${t("footer.support.hours")})`}
                  className="flex items-start gap-3 rounded-lg border border-primary-800 bg-primary-900 px-3 py-2.5 hover:border-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 transition-colors"
                >
                  <Phone
                    className="w-4 h-4 mt-0.5 shrink-0 text-primary-300"
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-base font-semibold text-white">
                      {t("footer.support.nationalHelplineNumber")}
                    </span>
                    <span className="block text-xs text-primary-200/80">
                      {t("footer.support.nationalHelplineLabel")}
                    </span>
                    <span className="block text-xs text-primary-300/70">
                      {t("footer.support.nationalHelplineNote")} ·{" "}
                      {t("footer.support.hours")}
                    </span>
                  </span>
                </a>
              </li>
            </ul>

            {/* Compact emergency card */}
            <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                {t("footer.support.emergencyTitle")}
              </div>
              <a
                href="tel:999"
                aria-label={`${t("footer.support.emergencyNumber")} ${t(
                  "footer.support.emergencyLabel",
                )}`}
                className="mt-1.5 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-white hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {t("footer.support.emergencyNumber")}
                <span className="text-xs font-normal text-amber-100/80">
                  · {t("footer.support.emergencyLabel")}
                </span>
              </a>
            </div>
          </div>

          {/* COLUMN 4 — SECURITY & TRANSPARENCY */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wide mb-4">
              <ShieldCheck
                className="w-4 h-4 text-primary-300"
                aria-hidden="true"
              />
              {t("footer.security.title")}
            </h3>
            <ul className="space-y-2.5 text-sm text-primary-100/85 leading-relaxed">
              <li className="flex items-start gap-2">
                <Info
                  className="w-4 h-4 mt-0.5 shrink-0 text-primary-400"
                  aria-hidden="true"
                />
                <span>{t("footer.security.prototype")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Info
                  className="w-4 h-4 mt-0.5 shrink-0 text-primary-400"
                  aria-hidden="true"
                />
                <span>{t("footer.security.dataNotice")}</span>
              </li>
              <li className="flex items-start gap-2">
                <Info
                  className="w-4 h-4 mt-0.5 shrink-0 text-primary-400"
                  aria-hidden="true"
                />
                <span>{t("footer.security.informational")}</span>
              </li>
            </ul>
            <div className="mt-4 space-y-2">
              <a
                href="#footer-disclaimer"
                className="block rounded text-sm text-primary-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                {t("footer.security.disclaimerLink")}
              </a>
              <a
                href="#footer-official"
                className="block rounded text-sm text-primary-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              >
                {t("footer.security.officialNoticeLink")}
              </a>
            </div>
          </div>
        </div>

        {/* DISCLAIMER / INFORMATION PANEL */}
        <section
          id="footer-disclaimer"
          className="mt-10 rounded-xl border border-primary-800 bg-primary-900 px-5 py-5 sm:px-6"
          aria-labelledby="footer-disclaimer-title"
        >
          <div className="flex items-start gap-3">
            <span
              className="shrink-0 rounded-lg bg-primary-800 p-2"
              aria-hidden="true"
            >
              <ShieldCheck className="w-5 h-5 text-primary-200" />
            </span>
            <div>
              <h4
                id="footer-disclaimer-title"
                className="text-sm font-semibold text-white mb-1.5"
              >
                {t("footer.disclaimer.title")}
              </h4>
              <p className="text-xs text-primary-100/80 leading-relaxed">
                {t("footer.disclaimer.text")}
              </p>
              <p className="mt-2 text-xs text-primary-200/75 leading-relaxed">
                {t("footer.disclaimer.governmentNotice")}
              </p>
            </div>
          </div>
        </section>

        {/* BOTTOM BAR */}
        <div className="mt-8 border-t border-primary-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-primary-200/70">
          <p className="text-center sm:text-left">
            © {currentYear} BhoomiTech — {t("footer.prototypeBadge")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <a
              href="#footer-disclaimer"
              className="rounded hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              {t("footer.security.disclaimerLink")}
            </a>
            <a
              href="#footer-official"
              className="rounded hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
            >
              {t("footer.official.sourceLabel")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
