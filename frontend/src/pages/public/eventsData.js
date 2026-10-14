// Confirmed library activities, reading programs, announcements and past events for Garbaharey Public Library

export const CONFIRMED_EVENTS = [
  // ── Upcoming Events ──
  {
    _id: 'youth-reading-marathon-2026',
    title: 'Garbaharey Annual Youth Reading Marathon',
    category: 'Reading Programs',
    eventDate: '2026-10-24T09:00:00Z',
    time: '9:00 AM – 1:00 PM',
    location: 'Main Reading Hall & Courtyard',
    image: '/images/hero-reading-hall.webp',
    shortDesc:
      'A month-long celebration of reading for primary and secondary school students in Garbaharey. Participants log finished titles, discuss themes with peer mentors, and earn reading medals.',
    fullBody:
      'Garbaharey Public Library invites all school students and youth across Garbaharey and surrounding Gedo communities to our 2026 Annual Youth Reading Marathon. Over four weeks, students will select books from our curated reading lists across Somali literature, world science, and history.\n\nEvery Saturday, students gather in the Main Reading Hall for guided book discussions, reading mentor reviews, and group vocabulary games. Certificates of Achievement and book prizes will be awarded at the grand closing ceremony.',
    agenda: [
      '9:00 AM – 9:30 AM: Registration & Reading Journal Distribution',
      '9:30 AM – 11:00 AM: Quiet Silent Reading Session in Stacks',
      '11:15 AM – 12:30 PM: Peer Discussion & Book Review Presentations',
      '12:30 PM – 1:00 PM: Mentor Q&A and Next Week Book Selection',
    ],
    audience: 'Primary & Secondary School Students, Educators, Parents',
    admission: 'Free admission. Official library card recommended.',
    status: 'upcoming',
  },
  {
    _id: 'digital-catalog-literacy-workshop',
    title: 'Online Catalog & Digital Research Workshop',
    category: 'Workshops',
    eventDate: '2026-10-29T14:00:00Z',
    time: '2:00 PM – 4:30 PM',
    location: 'Study Room B & Digital Lab',
    image: '/images/hero-bookshelves.webp',
    shortDesc:
      "Hands-on session for students and educators on navigating the library's computerized catalog, searching ISBNs, reserving checked-out titles, and finding verified reference materials.",
    fullBody:
      'Learn how to unlock the full potential of Garbaharey Public Library from your phone, tablet, or home computer. In this interactive computer lab workshop, our library staff will walk participants through the digital catalog system.\n\nParticipants will learn how to perform advanced topic searches, check physical copy availability across shelves, place online reservations, and use citation tools for school research papers.',
    agenda: [
      '2:00 PM – 2:30 PM: Overview of the Online OPAC Catalog',
      '2:30 PM – 3:30 PM: Hands-on Practice: Keyword, Author & ISBN Searches',
      '3:30 PM – 4:00 PM: Placing Holds & Managing Your Member Account',
      '4:00 PM – 4:30 PM: Q&A and Practical Research Tips',
    ],
    audience: 'High School Students, University Scholars, Teachers, General Public',
    admission: 'Free admission. Bring your smartphone, tablet, or use library workstations.',
    status: 'upcoming',
  },
  {
    _id: 'somali-oral-poetry-evening',
    title: 'Somali Oral Literature & Heritage Evening',
    category: 'Community & Culture',
    eventDate: '2026-11-05T16:30:00Z',
    time: '4:30 PM – 7:00 PM',
    location: 'Community Hall, Garbaharey Public Library',
    image: '/images/hero-library.webp',
    shortDesc:
      'An evening celebrating classical Somali poetry (Gabay and Geeraar), oral storytelling traditions, and regional history with local elders and cultural custodians.',
    fullBody:
      'Somalia is renowned worldwide as the Nation of Bards. Garbaharey Public Library is proud to host an enriching cultural evening dedicated to preserving and celebrating traditional Somali oral poetry and Gedo regional folklore.\n\nRespected elders, poets, and teachers will share recitations, explain historical contexts of legendary Somali verses, and engage youth in questions about preserving the beauty of the Somali language.',
    agenda: [
      '4:30 PM – 5:00 PM: Welcoming Address & Somali Tea Reception',
      '5:00 PM – 6:00 PM: Traditional Poetry Recitations (Gabay, Geeraar & Jiifto)',
      '6:00 PM – 6:45 PM: Panel Discussion: Preserving Somali Language in the Digital Era',
      '6:45 PM – 7:00 PM: Open Floor Q&A and Closing Reflections',
    ],
    audience: 'General Public, Cultural Enthusiasts, Youth, Elders',
    admission: 'Free and open to the entire Garbaharey community.',
    status: 'upcoming',
  },
  {
    _id: 'weekend-children-story-hour',
    title: "Children's Weekend Story Hour & Picture Books",
    category: 'Reading Programs',
    eventDate: '2026-11-12T10:00:00Z',
    time: '10:00 AM – 11:30 AM',
    location: "Children's Reading Room",
    image: '/images/hero-reading-hall.webp',
    shortDesc:
      'Fun, engaging storytelling sessions for young children aged 5–11. Includes illustrated Somali folktales, interactive read-alouds, and literacy drawing games.',
    fullBody:
      "Introduce your children to the joy of reading! Every alternate weekend, our children's librarian hosts an interactive storytelling hour featuring beloved Somali children's tales and colorful illustrated picture books.\n\nChildren listen to exciting stories, practice vocabulary, participate in puppet roleplay, and borrow their favorite storybooks to take home.",
    agenda: [
      '10:00 AM – 10:15 AM: Welcome Song & Children’s Icebreaker',
      '10:15 AM – 10:50 AM: Interactive Illustrated Storytelling',
      '10:50 AM – 11:20 AM: Literacy Drawing & Craft Activity',
      '11:20 AM – 11:30 AM: Book Checkout for Children',
    ],
    audience: 'Children aged 5–11 and their parents or guardians',
    admission: 'Free admission. Walk-ins welcome.',
    status: 'upcoming',
  },

  // ── Past Events Archive ──
  {
    _id: 'inaugural-community-book-drive',
    title: 'Inaugural Community Book Drive & Exhibition',
    category: 'Community & Culture',
    eventDate: '2026-08-15T09:00:00Z',
    time: '9:00 AM – 4:00 PM',
    location: 'Garbaharey Public Library Grounds',
    image: '/images/hero-library.webp',
    shortDesc:
      'Civic community gathering marking the expansion of library collections with over 1,500 new volumes contributed by educators, families, and partner institutions.',
    fullBody:
      'The community book drive brought together local educators, diaspora supporters, and district leaders to inaugurate the expanded collections at Garbaharey Public Library.\n\nOver 1,500 physical books across secondary education, Arabic sciences, mathematics, and Somali literature were formally accessioned into the permanent library catalog.',
    agenda: [
      'Book donation sorting and accessioning exhibition',
      'Remarks by district educational leaders and community elders',
      'Tours of new physical stacks and reading carrels',
    ],
    audience: 'Community, Educators, Donors',
    admission: 'Archived Community Event',
    status: 'past',
  },
  {
    _id: 'high-school-national-exam-prep',
    title: 'Secondary School National Exam Study Circles',
    category: 'Reading Programs',
    eventDate: '2026-07-20T08:30:00Z',
    time: '8:30 AM – 12:30 PM',
    location: 'Quiet Study Hall',
    image: '/images/hero-reading-hall.webp',
    shortDesc:
      'A two-week revision program for Grade 12 students preparing for Somali National Examinations with access to reference materials and teacher mentorship.',
    fullBody:
      'To assist Grade 12 students across Garbaharey secondary schools in their national examination preparations, the library hosted daily intensive revision circles.\n\nStudents utilized curated past examination papers, mathematics guides, and science textbooks with peer study groups under the mentorship of volunteer secondary school teachers.',
    agenda: [
      'Subject-specific revision modules: Mathematics, Physics, Biology',
      'Exam strategy and time-management workshops',
      'Group study reviews and practice quizzes',
    ],
    audience: 'Grade 12 Students',
    admission: 'Archived Academic Program',
    status: 'past',
  },
  {
    _id: 'library-opac-digital-launch',
    title: 'Official Launch of the Digital OPAC System',
    category: 'Announcements',
    eventDate: '2026-06-10T10:00:00Z',
    time: '10:00 AM – 1:00 PM',
    location: 'Main Reading Room',
    image: '/images/hero-bookshelves.webp',
    shortDesc:
      "Public announcement and community demonstration of the library's computerized catalog, member portal, and digital reservation system.",
    fullBody:
      'Garbaharey Public Library officially unveiled its modern automated library management system, bringing computerized book cataloging and digital reservation tracking to the community.\n\nStaff demonstrated how readers can search for titles, check availability, and manage memberships online.',
    agenda: [
      'Demonstration of computerized search terminal',
      'Issuance of initial digital member accounts',
      'Staff orientation for patrons',
    ],
    audience: 'All Patrons & Community',
    admission: 'Archived Announcement',
    status: 'past',
  },
]
