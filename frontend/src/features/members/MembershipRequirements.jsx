import { useTranslation } from 'react-i18next'
import {
  ShieldCheck,
  BookOpen,
  Sparkles,
  BookMarked,
  HeartHandshake,
  UserCheck,
  AlertCircle,
  Info,
} from 'lucide-react'
import './membershipRequirements.css'

export const MEMBERSHIP_RULES = [
  {
    id: 1,
    num: '01',
    icon: ShieldCheck,
    textSo: 'In qofku ixtiraamo xeerarka iyo nidaamka maktabadda.',
    textEn: 'Respect and adhere to library rules and policies.',
    textAr: 'احترام لوائح وسياسات المكتبة والالتزام بها.',
  },
  {
    id: 2,
    num: '02',
    icon: BookOpen,
    textSo: 'Inuu ilaaliyo buugaagta iyo agabka maktabadda.',
    textEn: 'Protect and care for library books and equipment.',
    textAr: 'الحفاظ على الكتب وممتلكات المكتبة ورعايتها.',
  },
  {
    id: 3,
    num: '03',
    icon: Sparkles,
    textSo: 'Inuu dhowro nadaafadda iyo xasilloonida goobta.',
    textEn: 'Maintain cleanliness and a quiet, peaceful environment.',
    textAr: 'المحافظة على النظافة والهدوء داخل المكتبة.',
  },
  {
    id: 4,
    num: '04',
    icon: BookMarked,
    textSo: 'Inuu buugaagta ku akhriyo ama ku isticmaalo si waafaqsan nidaamka maktabadda.',
    textEn: 'Read and use books strictly according to library regulations.',
    textAr: 'قراءة الكتب واستخدامها وفقاً لإجراءات وأنظمة المكتبة.',
  },
  {
    id: 5,
    num: '05',
    icon: HeartHandshake,
    textSo: 'Inuu ixtiraamo shaqaalaha iyo xubnaha kale.',
    textEn: 'Respect library staff and fellow members at all times.',
    textAr: 'احترام موظفي المكتبة وجميع الأعضاء الآخرين.',
  },
  {
    id: 6,
    num: '06',
    icon: UserCheck,
    textSo: 'Inuu bixiyo xogta lagama maarmaanka u ah diiwaangelinta xubinnimada.',
    textEn: 'Provide accurate and required information for registration.',
    textAr: 'تقديم المعلومات والبيانات الصحيحة اللازمة للتسجيل.',
  },
  {
    id: 7,
    num: '07',
    icon: AlertCircle,
    textSo: 'Inuu ka fogaado wax kasta oo carqaladaynaya waxbarashada iyo akhriska.',
    textEn: 'Avoid any behavior that disrupts study, learning, or reading.',
    textAr: 'تجنب أي تصرف يعيق الدراسة أو يشوش على القراءة.',
  },
]

export default function MembershipRequirements({ compact = false }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'so'

  const getText = (rule) => {
    if (lang === 'ar') return rule.textAr
    if (lang === 'en') return rule.textEn
    return rule.textSo
  }

  const getSubText = (rule) => {
    // Show Somali alongside English when in English, or English when in Somali for clarity
    if (lang === 'en') return rule.textSo
    if (lang === 'so') return rule.textEn
    return rule.textSo
  }

  const title =
    lang === 'ar'
      ? 'شروط عضوية المكتبة'
      : lang === 'en'
      ? 'Library Membership Requirements'
      : 'Shuruudaha Xubinnimada Maktabadda'

  const intro =
    lang === 'ar'
      ? 'يرجى مراجعة وقبول شروط العضوية التالية قبل تقديم طلبك:'
      : lang === 'en'
      ? 'Please review and observe the following conditions when joining the library:'
      : 'Fadlan dhowr oo u hoggaansan shuruudaha iyo anshaxa soo socda marka aad codsaneyso xubinnimada:'

  const noteTitle = lang === 'ar' ? 'ملاحظة هامة:' : lang === 'en' ? 'Important Note:' : 'Fiiro gaar ah:'

  const noteText =
    lang === 'ar'
      ? 'تقوم عضوية مكتبة غربهاري العامة على الاحترام المتبادل، والتعاون، وحماية الممتلكات العامة المشتركة.'
      : lang === 'en'
      ? 'Garbaharey Public Library membership is built on mutual respect, cooperation, and the protection of shared public resources.'
      : 'Xubinnimada Maktabadda Dadweynaha Garbaharay waxay ku dhisan tahay ixtiraam, wada-shaqayn iyo ilaalinta hantida guud.'

  return (
    <section
      className={`membership-req-container${compact ? ' compact' : ''}`}
      aria-labelledby="membership-req-heading"
    >
      <header className="membership-req-header">
        <span className="membership-req-eyebrow">
          <ShieldCheck size={14} aria-hidden="true" />
          {lang === 'ar' ? 'العضوية واللوائح' : lang === 'en' ? 'MEMBERSHIP CODE' : 'XEERARKA XUBINNIMADA'}
        </span>
        <h2 id="membership-req-heading" className="membership-req-title">
          {title}
        </h2>
        <p className="membership-req-intro">{intro}</p>
      </header>

      <div className="membership-req-grid">
        {MEMBERSHIP_RULES.map((rule) => {
          const Icon = rule.icon
          return (
            <article key={rule.id} className="membership-req-card">
              <div className="membership-req-card-badge">{rule.num}</div>
              <div className="membership-req-card-icon">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="membership-req-card-body">
                <p className="membership-req-card-text">{getText(rule)}</p>
                {compact ? null : (
                  <span className="membership-req-card-sub">{getSubText(rule)}</span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <aside className="membership-req-note" role="note">
        <Info size={22} className="membership-req-note-icon" aria-hidden="true" />
        <div className="membership-req-note-content">
          <strong>{noteTitle}</strong>
          <p>{noteText}</p>
        </div>
      </aside>
    </section>
  )
}

export function RequirementsAgreement() {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'so'

  const agreementText =
    lang === 'ar'
      ? 'أقر بأنني قرأت وفهمت ووافقت على جميع شروط العضوية المذكورة أعلاه.'
      : lang === 'en'
      ? 'I understand and agree to all the library membership requirements stated above.'
      : 'Waan fahmay oo waan aqbalay dhammaan shuruudaha xubinnimada ee kor ku xusan.'

  return (
    <label className="membership-agree-box">
      <input type="checkbox" required />
      <span>{agreementText}</span>
    </label>
  )
}
