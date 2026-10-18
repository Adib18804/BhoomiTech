import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import authService from "../services/authService";
import {
  MapPin,
  Shield,
  FileCheck,
  Users,
  Search,
  ClipboardList,
  Gauge,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const FEATURE_KEYS = ["map", "risk", "check", "users"] as const;

const CHECK_KEYS = [
  "Land Identity",
  "Ownership",
  "Mutation",
  "Area/Share",
  "Legal Cases",
  "Government Status",
  "Acquisition",
  "Transaction History",
  "Historical Consistency",
  "Cross-Record Consistency",
] as const;

const WORKFLOW_KEYS = ["select", "seller", "verify", "decide"] as const;

const CHECKLIST_KEYS = [
  "khatian",
  "dag",
  "ownership",
  "mutation",
  "cases",
] as const;

const RISK_LEVELS: { key: string; classes: string; dot: string }[] = [
  {
    key: "LOW_CONCERN",
    classes: "border-green-300 bg-green-50 text-green-800",
    dot: "bg-green-500",
  },
  {
    key: "REVIEW_REQUIRED",
    classes: "border-sky-300 bg-sky-50 text-sky-900",
    dot: "bg-sky-500",
  },
  {
    key: "HIGH_ATTENTION",
    classes: "border-orange-300 bg-orange-50 text-orange-900",
    dot: "bg-orange-500",
  },
  {
    key: "CRITICAL_SIGNAL",
    classes: "border-red-300 bg-red-50 text-red-900",
    dot: "bg-red-500",
  },
  {
    key: "INSUFFICIENT_DATA",
    classes: "border-gray-300 bg-gray-50 text-gray-700",
    dot: "bg-gray-400",
  },
];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isBengali = i18n.language === "bn";
  const bn = isBengali ? "font-bengali" : "";
  const isAuthenticated = authService.isAuthenticated();

  const featureIcons = [
    <MapPin className="w-12 h-12 text-primary-600 mx-auto mb-4" />,
    <Shield className="w-12 h-12 text-primary-600 mx-auto mb-4" />,
    <FileCheck className="w-12 h-12 text-primary-600 mx-auto mb-4" />,
    <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />,
  ];

  const workflowIcons = [
    <Search className="w-6 h-6" />,
    <ClipboardList className="w-6 h-6" />,
    <Gauge className="w-6 h-6" />,
    <CheckCircle2 className="w-6 h-6" />,
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        {/* Rural Bangladesh backdrop (paddy field hut, Unsplash) */}
        <img
          src="https://images.unsplash.com/photo-1642832520839-a30ac9bcadd9?auto=format&fit=crop&w=1920&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark green gradient overlay keeps the text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/85 via-primary-900/75 to-primary-950/90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img
              src="/logo.png"
              alt="BhoomiTech"
              className="h-16 sm:h-20 md:h-24 w-auto mx-auto mb-6 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/logo.png";
              }}
            />
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 break-words ${bn}`}
            >
              {t("common.appName")}
            </h1>
            <p
              className={`text-xl sm:text-2xl md:text-3xl text-primary-200 font-semibold mb-6 break-words ${bn}`}
            >
              {t("common.tagline")}
            </p>
            <p
              className={`text-base sm:text-lg text-gray-100 mb-8 max-w-3xl mx-auto ${bn}`}
            >
              {t("home.heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/land-search"
                    className="btn-primary text-base sm:text-lg px-8 py-3"
                  >
                    {t("nav.checkLand")}
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn-secondary text-base sm:text-lg px-8 py-3"
                  >
                    {t("nav.dashboard")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn-primary text-base sm:text-lg px-8 py-3"
                  >
                    {t("nav.register")}
                  </Link>
                  <Link
                    to="/login"
                    className="btn-secondary text-base sm:text-lg px-8 py-3"
                  >
                    {t("nav.login")}
                  </Link>
                </>
              )}
            </div>
            <p className={`text-sm text-gray-300 mt-4 ${bn}`}>
              {t("home.demoNotice")}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 ${bn}`}
          >
            {t("home.featuresTitle")}
          </h2>
          <p
            className={`text-center text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto ${bn}`}
          >
            {t("home.featuresSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {FEATURE_KEYS.map((key, idx) => (
              <div key={key} className="card p-6 text-center">
                {featureIcons[idx]}
                <h3 className={`text-lg font-semibold mb-2 ${bn}`}>
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className={`text-sm text-gray-600 ${bn}`}>
                  {t(`home.features.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we check */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 ${bn}`}
          >
            {t("home.whatWeCheckTitle")}
          </h2>
          <p
            className={`text-center text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto ${bn}`}
          >
            {t("home.whatWeCheckSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CHECK_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-center gap-3 border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                <span
                  className={`text-sm font-medium text-gray-800 break-words ${bn}`}
                >
                  {t(`verification.checks.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 ${bn}`}
          >
            {t("home.workflowTitle")}
          </h2>
          <p
            className={`text-center text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto ${bn}`}
          >
            {t("home.workflowSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_KEYS.map((key, idx) => (
              <div key={key} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-600 text-white flex-shrink-0">
                    {workflowIcons[idx]}
                  </span>
                  <span className={`text-sm font-bold text-primary-700 ${bn}`}>
                    {t("home.stepLabel")} {idx + 1}
                  </span>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${bn}`}>
                  {t(`home.workflow.${key}.title`)}
                </h3>
                <p className={`text-sm text-gray-600 ${bn}`}>
                  {t(`home.workflow.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk levels explained */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 ${bn}`}
          >
            {t("home.riskTitle")}
          </h2>
          <p
            className={`text-center text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto ${bn}`}
          >
            {t("home.riskSubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RISK_LEVELS.map((level) => (
              <div
                key={level.key}
                className={`border rounded-lg p-4 ${level.classes}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`w-3 h-3 rounded-full flex-shrink-0 ${level.dot}`}
                  />
                  <span className={`font-semibold ${bn}`}>
                    {t(`riskLevels.${level.key}`)}
                  </span>
                </div>
                <p className={`text-sm ${bn}`}>
                  {t(`home.riskDescriptions.${level.key}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before you buy */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className={`text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-3 ${bn}`}
          >
            {t("home.beforeYouBuyTitle")}
          </h2>
          <p
            className={`text-center text-gray-600 mb-8 sm:mb-12 max-w-3xl mx-auto ${bn}`}
          >
            {t("home.beforeYouBuySubtitle")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {CHECKLIST_KEYS.map((key) => (
              <div
                key={key}
                className="flex items-start gap-3 border border-gray-200 rounded-lg p-4 bg-white"
              >
                <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className={`text-sm text-gray-700 ${bn}`}>
                  {t(`home.checklist.${key}`)}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link
              to="/land-buying-guide"
              className="inline-flex items-center gap-2 text-primary-700 hover:text-primary-800 font-medium"
            >
              <span className={bn}>{t("home.viewGuide")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Data Notice */}
      <section className="py-12 bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className={`text-xl font-bold text-yellow-900 mb-3 ${bn}`}>
              {t("map.syntheticData")}
            </h3>
            <p className={`text-yellow-800 ${bn}`}>
              {t("home.syntheticDataNotice")}
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-6 sm:p-8">
            <h3 className={`text-xl font-bold text-gray-900 mb-4 ${bn}`}>
              {t("disclaimer.title")}
            </h3>
            <p className={`text-sm text-gray-700 ${bn}`}>
              {t("disclaimer.text")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
