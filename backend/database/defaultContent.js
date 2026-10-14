import { Content } from '../models/Announcement.js'

// Confirmed library services and events for Garbaharey Public Library.
// They are stored as Content records so staff can edit, translate, or archive them.
const confirmedServices = [
  {
    title: {
      en: 'Book Lending and Borrowing',
      so: 'Amaahda Buugaagta',
      ar: 'استعارة الكتب وإعارتها',
    },
    body: {
      en: 'Browse our catalog of thousands of books, borrow copies for home reading, and renew loans with ease.',
      so: 'Ka amaaho kumanaan buug oo isugu jira sheekooyin, saynis, taariikh, iyo manhajka dugsiyada.',
      ar: 'استعر من آلاف الكتب في الأدب والعلوم والتاريخ والمناهج المدرسية مع خيارات التجديد الميسرة.',
    },
  },
  {
    title: {
      en: 'Online Catalog',
      so: 'Kaydka Buugaagta ee Online-ka ah',
      ar: 'الفهرس الإلكتروني',
    },
    body: {
      en: 'Search our complete library collection 24/7. Check book availability in real-time, view summaries, and manage reservations.',
      so: 'Ka raadi dhammaan buugaagta maktabadda 24/7. Hubi haddii buuggu yaallo oo eeg khaanadda uu yaallo.',
      ar: 'ابحث في فهرس المكتبة الكامل على مدار الساعة وتحقق من توفر النسخ ومواقعها على الأرفف.',
    },
  },
  {
    title: {
      en: 'Reading and Study Facilities',
      so: 'Goobaha Akhriska iyo Waxbarashada',
      ar: 'مرافق القراءة والدراسة',
    },
    body: {
      en: 'Equipped with quiet study desks, group reading tables, comfortable seating, and natural lighting for academic focus.',
      so: 'Meelo deggan, hawo wanaagsan leh oo loogu talagalay wax akhris gaar ah iyo diyaarinta imtixaannada.',
      ar: 'بيئة هادئة ومضاءة طبيعياً مخصصة للمطالعة الفردية والدراسة المركزة ومراجعة الاختبارات.',
    },
  },
  {
    title: {
      en: 'Research and Information Assistance',
      so: 'Caawinta Cilmi-baarista iyo Macluumaadka',
      ar: 'المساعدة في البحث والمعلومات',
    },
    body: {
      en: 'Get expert guidance from our professional librarians for academic assignments, exam preparation, and source verification.',
      so: 'Hel caawinaad toos ah oo ka timaada shaqaalaheenna si aad u hesho agabka waxbarashada iyo macluumaadka.',
      ar: 'احصل على استشارات وتوجيهات متخصصة من أمناء المكتبة لإنجاز البحوث المدرسية والجامعية.',
    },
  },
  {
    title: {
      en: 'Reservations',
      so: 'Qabashada Buugaagta (Reservations)',
      ar: 'الحجوزات وقوائم الانتظار',
    },
    body: {
      en: 'Place holds on popular titles and get notified the moment a copy becomes available for pickup at the circulation desk.',
      so: 'Online ka qabso buugaagta la amaahday, waxaana lagu soo wargelinayaa isla markii la soo celiyo.',
      ar: 'احجز نسختك مسبقاً وتلقَّ إشعاراً فورياً عند إرجاعها وجاهزيتها للاستلام بمكتب الإعارة.',
    },
  },
  {
    title: {
      en: 'Educational Programs and Events',
      so: 'Barnaamijyada Waxbarashada iyo Dhacdooyinka',
      ar: 'البرامج والفعاليات التعليمية',
    },
    body: {
      en: 'Join regular book discussions, youth reading marathons, literacy workshops, and Somali cultural heritage evenings.',
      so: 'Ka qayb qaado tababarrada akhriska, tartamada dhalinyarada, iyo habeenada suugaanta Soomaaliyeed.',
      ar: 'شارك في ورش محو الأمية، وماراثون القراءة للشباب، ولقاءات الكتاب، والأمسيات الثقافية.',
    },
  },
]

const welcome = {
  title: {
    en: 'Welcome to Garbaharey Public Library',
    so: 'Ku soo dhowow Maktabadda Dadweynaha ee Garbahaareey',
    ar: 'مرحباً بكم في مكتبة غاربحاري العامة',
  },
  body: {
    en: 'Our full collection is now cataloged online. Search titles, reserve copies, and explore new arrivals at Garbaharey Public Library.',
    so: 'Dhammaan buugaagteena hadda waxaa laga heli karaa online. Ka raadi buugaagta oo ku soo biir maktabadda.',
    ar: 'مجموعتنا الكاملة مفهرسة إلكترونياً الآن. ابحث في العناوين واحجز النسخ واستكشف أحدث الإضافات.',
  },
}

const defaultEvents = [
  {
    kind: 'event',
    title: {
      en: 'Garbaharey Annual Youth Reading Marathon',
      so: 'Tartanka Sanadlaha ah ee Akhriska Dhalinyarada',
      ar: 'ماراثون القراءة السنوي لشباب غاربحاري',
    },
    body: {
      en: 'A month-long celebration of reading for primary and secondary school students in Garbaharey. Participants log finished titles, discuss themes with peer mentors, and earn certificates of reading excellence.',
      so: 'Barnaamij bil soconaya oo loogu talagalay ardayda dugsiyada ee Garbahaareey si loo dhiirrigeliyo akhriska buugaagta.',
      ar: 'احتفالية تمتد لشهر كامل لتشجيع القراءة بين طلاب المدارس في غاربحاري مع حلقات نقاش وجوائز تقديرية.',
    },
    eventDate: new Date('2026-10-24T09:00:00Z'),
    featured: true,
    published: true,
    order: 1,
  },
  {
    kind: 'event',
    title: {
      en: 'Online Catalog & Digital Research Workshop',
      so: 'Tababarka Kaydka Buugaagta ee Online-ka ah',
      ar: 'ورشة عمل الفهرس الإلكتروني والبحث الرقمي',
    },
    body: {
      en: "Hands-on session for students and educators on navigating the library's computerized catalog, searching ISBNs, reserving checked-out titles, and finding verified reference materials.",
      so: 'Tababar ku saabsan sida loo isticmaalo buug-raadiyaha online-ka ah iyo helidda buugaagta waxbarashada.',
      ar: 'جلسة تدريبية عملية للطلاب والمعلمين للتعرف على كيفية استخدام الفهرس الآلي والبحث عن المراجع وحجز الكتب.',
    },
    eventDate: new Date('2026-10-29T14:00:00Z'),
    featured: true,
    published: true,
    order: 2,
  },
]

export async function ensureDefaultContent() {
  if (!(await Content.exists({ kind: 'service' }))) {
    await Content.insertMany(
      confirmedServices.map((item, index) => ({
        kind: 'service',
        title: item.title,
        body: item.body,
        order: index + 1,
        published: true,
      })),
    )
  }

  if (!(await Content.exists({ kind: 'news' }))) {
    await Content.create({
      kind: 'news',
      title: welcome.title,
      body: welcome.body,
      featured: true,
      published: true,
    })
  }

  if (!(await Content.exists({ kind: 'event' }))) {
    await Content.insertMany(defaultEvents)
  }
}
