import mongoose from 'mongoose'
import { config } from '../../backend/config/env.js'
import { Category } from '../../backend/models/Category.js'
import { Author, nameKey } from '../../backend/models/Author.js'
import { Book } from '../../backend/models/Book.js'
import { Copy } from '../../backend/models/BookCopy.js'

async function seed() {
  console.log(`Connecting to ${config.MONGODB_URI}...`)
  await mongoose.connect(config.MONGODB_URI)
  console.log('Connected to MongoDB.')

  // 1. Seed Categories
  const categoriesData = [
    {
      name: { en: 'Fiction', so: 'Khayaali', ar: 'خيال' },
      description: { en: 'Novels, short stories, and narrative literature', so: 'Sheekooyin iyo buugaag khayaali ah', ar: 'روايات وقصص وأدب سردي' },
      status: 'active',
    },
    {
      name: { en: 'History & Heritage', so: 'Taariikhda & Dhaxalka', ar: 'التاريخ والتراث' },
      description: { en: 'Historical accounts, biographies, and cultural heritage', so: 'Dhaqanka iyo taariikhda', ar: 'تاريخ وتراث وثقافات' },
      status: 'active',
    },
    {
      name: { en: 'Science & Technology', so: 'Sayniska & Teknolojiyadda', ar: 'العلوم والتكنولوجيا' },
      description: { en: 'Computing, science, engineering, and mathematics', so: 'Sayniska iyo farsamada casriga ah', ar: 'علوم وتكنولوجيا وهندسة' },
      status: 'active',
    },
    {
      name: { en: 'Personal Development', so: 'Horumarinta Shaqsiyadeed', ar: 'التنمية البشرية' },
      description: { en: 'Leadership, productivity, psychology, and self-help', so: 'Hoggaanka iyo dhisidda nafta', ar: 'القيادة وتطوير الذات' },
      status: 'active',
    },
    {
      name: { en: 'Children & Youth', so: 'Carruurta & Dhallinyarada', ar: 'الأطفال والشباب' },
      description: { en: 'Young adult literature, picture books, and education', so: 'Buugaagta carruurta iyo ardayda', ar: 'كتب الأطفال واليافعين' },
      status: 'active',
    },
    {
      name: { en: 'Islamic Studies', so: 'Daraasaadka Islaamka', ar: 'الدراسات الإسلامية' },
      description: { en: 'Islamic theology, jurisprudence, and history', so: 'Culuumta diinta Islaamka', ar: 'علوم الشريعة والتاريخ الإسلامي' },
      status: 'active',
    },
  ]

  const categoryMap = {}
  for (const cat of categoriesData) {
    const existing = await Category.findOneAndUpdate(
      { 'name.en': cat.name.en },
      { $set: cat },
      { upsert: true, returnDocument: 'after' },
    )
    categoryMap[cat.name.en] = existing._id
    console.log(`Category ready: ${cat.name.en} (${existing._id})`)
  }

  // 2. Seed 3 Featured Books with 50, 100, 150 copies
  const booksData = [
    {
      title: "Agaasimaha Guud (The Leader's Path)",
      author: 'Prof. Ahmed Ali',
      isbn: '978-0-123456-01-1',
      category: categoryMap['Personal Development'],
      genre: 'Personal Development',
      year: 2024,
      language: 'en',
      edition: '1st Edition',
      featured: true,
      description:
        'An inspiring and practical guide exploring modern leadership, emotional intelligence, and team management for emerging institutional leaders.',
      copyCount: 50,
      shelfPrefix: 'DEV',
    },
    {
      title: 'Taariikhda iyo Dhaqanka Soomaaliyeed (Somali History & Culture)',
      author: 'Dr. Maryan Yusuf',
      isbn: '978-0-123456-02-8',
      category: categoryMap['History & Heritage'],
      genre: 'History & Heritage',
      year: 2023,
      language: 'so',
      edition: '2nd Edition',
      featured: true,
      description:
        'A comprehensive exploration of the Somali heritage, poetry traditions, pastoral societies, and key historical milestones in East Africa.',
      copyCount: 100,
      shelfPrefix: 'HIS',
    },
    {
      title: 'Modern Computer Science & Artificial Intelligence',
      author: 'Eng. Farah Hassan',
      isbn: '978-0-123456-03-5',
      category: categoryMap['Science & Technology'],
      genre: 'Science & Technology',
      year: 2025,
      language: 'en',
      edition: '3rd Edition',
      featured: true,
      description:
        'An accessible handbook covering core data structures, algorithms, cloud platforms, modern machine learning, and emerging AI technologies.',
      copyCount: 150,
      shelfPrefix: 'SCI',
    },
  ]

  for (const b of booksData) {
    const { copyCount, shelfPrefix, ...bookFields } = b
    const book = await Book.findOneAndUpdate(
      { isbn: bookFields.isbn },
      { $set: { ...bookFields, archived: false } },
      { upsert: true, returnDocument: 'after' },
    )
    console.log(`Book ready: "${book.title}" (${book._id})`)

    // Create copies
    const existingCopies = await Copy.countDocuments({ book: book._id })
    const needed = Math.max(0, copyCount - existingCopies)
    if (needed > 0) {
      const copiesToInsert = []
      const idSuffix = String(book._id).slice(-4).toUpperCase()
      for (let i = 1; i <= needed; i++) {
        const copyNum = existingCopies + i
        copiesToInsert.push({
          book: book._id,
          barcode: `BIB-${shelfPrefix}-${idSuffix}-${String(copyNum).padStart(3, '0')}`,
          shelf: `${shelfPrefix} 01`,
          status: 'available',
        })
      }
      await Copy.insertMany(copiesToInsert)
      console.log(`Created ${needed} copies for "${book.title}" (Total: ${copyCount})`)
    } else {
      console.log(`Book "${book.title}" already has ${existingCopies} copies.`)
    }
  }

  const totalBooks = await Book.countDocuments({ archived: false })
  const totalCopies = await Copy.countDocuments({ status: 'available' })
  const totalCategories = await Category.countDocuments({ status: 'active' })

  console.log('----------------------------------------------------')
  console.log('Catalog Summary:')
  console.log(`Categories:       ${totalCategories}`)
  console.log(`Active Books:     ${totalBooks}`)
  console.log(`Available Copies: ${totalCopies}`)
  console.log('----------------------------------------------------')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
