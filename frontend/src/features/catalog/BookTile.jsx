import { BookCover } from './BookCover'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { bookPath, useArea } from '../../hooks/useArea'
export function BookTile({ book }) {
  const { t } = useTranslation()
  const to = bookPath(useArea(), book._id)
  return (
    <article className="book-tile">
      <Link to={to} aria-label={book.title}>
        <BookCover book={book} />
      </Link>
      <div className="book-meta">
        <span className="eyebrow">{book.categoryName ?? book.genre}</span>
        <h3>
          <Link to={to}>{book.title}</Link>
        </h3>
        <p className="muted">{book.author}</p>
        <div className="book-meta-bottom">
          <span className={`availability ${book.copies?.available ? 'available' : ''}`}>
            {book.copies?.available
              ? t('catalog.available', { count: book.copies.available })
              : t('catalog.none')}
          </span>
          <Link to={to} className="reserve-now-btn">
            {t('book.reserveNow', 'Reserve Now')}
          </Link>
        </div>
      </div>
    </article>
  )
}
