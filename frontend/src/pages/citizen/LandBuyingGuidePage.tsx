import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck, AlertTriangle, ArrowRight, Info } from 'lucide-react';

interface GuideStep {
  title: string;
  body: string;
}

export default function LandBuyingGuidePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isBn = i18n.language === 'bn';
  const bnFont = isBn ? 'font-bengali' : '';
  const steps = t('landGuide.steps', { returnObjects: true }) as GuideStep[];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start mb-6">
        <BookOpen className="w-10 h-10 text-primary-600 mr-4 flex-shrink-0 mt-0.5" />
        <div>
          <h1 className={`text-3xl font-bold text-gray-900 ${bnFont}`}>{t('landGuide.title')}</h1>
          <p className={`text-gray-600 mt-2 ${bnFont}`}>{t('landGuide.subtitle')}</p>
        </div>
      </div>

      {/* Safety notice (required wording) */}
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-8 flex items-start">
        <AlertTriangle className="w-6 h-6 text-yellow-700 mr-3 flex-shrink-0 mt-0.5" />
        <p className={`text-sm text-yellow-900 ${bnFont}`}>{t('landGuide.notice')}</p>
      </div>

      <div className="space-y-4 mb-8">
        {Array.isArray(steps) && steps.map((step, idx) => (
          <div key={idx} className="card p-6 border border-gray-200">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center mr-4">
                {idx + 1}
              </div>
              <div>
                <p className={`text-xs font-semibold uppercase tracking-wide text-primary-600 mb-1 ${bnFont}`}>
                  {t('landGuide.stepLabel')} {idx + 1}
                </p>
                <h2 className={`text-lg font-semibold text-gray-900 mb-2 ${bnFont}`}>{step.title}</h2>
                <p className={`text-sm text-gray-700 ${bnFont}`}>{step.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA to run a check */}
      <div className="card p-6 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start">
          <ShieldCheck className="w-8 h-8 text-primary-600 mr-3 flex-shrink-0 mt-0.5" />
          <p className={`text-gray-800 ${bnFont}`}>{t('landGuide.checkInBhoomiTech')}</p>
        </div>
        <button
          onClick={() => navigate('/land-search')}
          className="btn-primary flex items-center space-x-2"
        >
          <span className={bnFont}>{t('nav.checkLand')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Existing disclaimer content */}
      <div className="card p-6 bg-gray-50">
        <h3 className={`font-semibold text-gray-900 mb-3 flex items-center ${bnFont}`}>
          <Info className="w-5 h-5 mr-2 text-primary-600" />
          {t('disclaimer.title')}
        </h3>
        <p className={`text-sm text-gray-700 ${bnFont}`}>{t('disclaimer.text')}</p>
      </div>
    </div>
  );
}
