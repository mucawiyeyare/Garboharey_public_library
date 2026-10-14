import { useTranslation } from 'react-i18next'
import {
  Pencil,
  BookOpen,
  CheckCircle,
  Clock,
  BookMarked,
  Layers,
  X,
  Edit,
  Hash,
  Globe,
  Calendar,
  Building,
  Bookmark,
  FileText,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Button } from '../../components/common/primitives/button'
import { BookCover } from './BookCover'

export default function ViewCopiesModal({
  book,
  open,
  onOpenChange,
  onEditCopies,
  onEditBook,
}) {
  const { t } = useTranslation()

  // Query latest full book details
  const bookDetailQuery = useQuery({
    queryKey: ['staff-book-detail', book?._id],
    queryFn: () => api(`/staff/books/${book._id}`),
    enabled: !!(open && book?._id),
  })

  if (!book) return null

  const fullBook = bookDetailQuery.data || book
  const total = fullBook.copies?.total ?? book.copies?.total ?? 0
  const borrowed = fullBook.copies?.borrowed ?? book.copies?.borrowed ?? 0
  const reserved = fullBook.copies?.reserved ?? book.copies?.reserved ?? 0
  const available = fullBook.copies?.available ?? book.copies?.available ?? Math.max(0, total - borrowed - reserved)

  const publisherName =
    typeof fullBook.publisher === 'object' && fullBook.publisher?.name
      ? fullBook.publisher.name
      : typeof fullBook.publisher === 'string'
      ? fullBook.publisher
      : null

  const categoryName =
    fullBook.categoryName ||
    (typeof fullBook.category === 'object'
      ? fullBook.category?.name?.en || fullBook.category?.name?.so || fullBook.category?.name?.ar || fullBook.category?.name
      : fullBook.category) ||
    fullBook.genre ||
    'General'

  const languageLabel =
    fullBook.language === 'en'
      ? 'English'
      : fullBook.language === 'so'
      ? 'Somali'
      : fullBook.language === 'ar'
      ? 'Arabic'
      : fullBook.language || 'English'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content view-book-full-modal">
          {/* Header */}
          <div className="modal-header pb-3 border-b">
            <div>
              <div className="flex items-center gap-2">
                <span className="badge-tag uppercase tracking-wider text-[11px] font-bold">
                  Book Information
                </span>
                {fullBook.archived ? (
                  <span className="badge-tag text-red-500 bg-red-500/10 border-red-500/20">Archived</span>
                ) : (
                  <span className="badge-tag text-emerald-600 bg-emerald-500/10 border-emerald-500/20">Active</span>
                )}
                {fullBook.featured && (
                  <span className="badge-tag text-amber-600 bg-amber-500/10 border-amber-500/20">Featured</span>
                )}
              </div>
              <Dialog.Title className="text-xl md:text-2xl font-bold mt-1.5 flex items-center gap-2 text-foreground">
                <BookOpen size={24} className="text-accent shrink-0" />
                <span>{fullBook.title}</span>
              </Dialog.Title>
              <Dialog.Description className="muted text-sm mt-0.5">
                Complete catalog entry, metadata, copy statistics & physical barcodes.
              </Dialog.Description>
            </div>
            <Dialog.Close className="icon-button modal-close" aria-label={t('ui.common.closeDialog', 'Close')}>
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="modal-body space-y-6 pt-4">
            {/* Top Overview: Cover & Comprehensive Metadata */}
            <div className="book-full-overview grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl bg-card border shadow-sm">
              <div className="md:col-span-3 flex justify-center items-start">
                <div className="book-cover-wrap shadow-md rounded overflow-hidden max-w-[140px] w-full aspect-[2/3]">
                  <BookCover book={fullBook} large />
                </div>
              </div>

              <div className="md:col-span-9 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground leading-tight">{fullBook.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">By {fullBook.author}</p>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t text-xs">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Hash size={12} /> ISBN
                      </span>
                      <strong className="font-mono text-foreground block text-[13px]">{fullBook.isbn || '—'}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Bookmark size={12} /> Category
                      </span>
                      <strong className="text-foreground block text-[13px]">{categoryName}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Calendar size={12} /> Publication Year
                      </span>
                      <strong className="text-foreground block text-[13px]">{fullBook.year || '—'}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Globe size={12} /> Language
                      </span>
                      <strong className="text-foreground block text-[13px]">{languageLabel}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Building size={12} /> Publisher
                      </span>
                      <strong className="text-foreground block text-[13px]">{publisherName || '—'}</strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <FileText size={12} /> Edition
                      </span>
                      <strong className="text-foreground block text-[13px]">{fullBook.edition || 'Standard'}</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Edit button inside the metadata card */}
                {onEditBook && (
                  <div className="mt-3 pt-2.5 border-t flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="button secondary small"
                      onClick={() => {
                        onOpenChange(false)
                        onEditBook(fullBook)
                      }}
                    >
                      <Edit size={13} className="mr-1.5" />
                      Edit Book Details
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Description / Summary Section */}
            <div className="p-4 rounded-xl border bg-muted/20">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <FileText size={14} /> Description & Summary
              </h4>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {fullBook.description?.trim() ? fullBook.description : (
                  <span className="italic text-muted-foreground">No description provided for this title yet.</span>
                )}
              </p>
            </div>

            {/* 4 Copy KPI Stat Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers size={14} /> Copy Status & Availability
                </h4>
                {onEditCopies && (
                  <Button
                    size="sm"
                    className="button secondary small highlight-action"
                    onClick={() => {
                      onOpenChange(false)
                      onEditCopies(fullBook)
                    }}
                  >
                    <Pencil size={13} className="mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg border bg-blue-500/10 border-blue-500/20 shadow-sm text-center">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                    <Layers size={13} className="text-blue-500" />
                    <span>Total Copies</span>
                  </div>
                  <div className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">{total}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Added to system</div>
                </div>

                <div className="p-3.5 rounded-lg border bg-amber-500/10 border-amber-500/20 shadow-sm text-center">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                    <BookMarked size={13} className="text-amber-500" />
                    <span>Borrowed</span>
                  </div>
                  <div className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{borrowed}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Currently on loan</div>
                </div>

                <div className="p-3.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 shadow-sm text-center">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle size={13} className="text-emerald-500" />
                    <span>Available Now</span>
                  </div>
                  <div className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{available}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Ready for loan</div>
                </div>

                <div className="p-3.5 rounded-lg border bg-sky-500/10 border-sky-500/20 shadow-sm text-center">
                  <div className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                    <Clock size={13} className="text-sky-500" />
                    <span>Reserved/Pending</span>
                  </div>
                  <div className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{reserved}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Waiting for pickup</div>
                </div>
              </div>

              {/* Copy Calculation Formula Banner */}
              <div className="mt-2.5 p-2.5 rounded-lg bg-card border text-xs text-muted-foreground font-mono flex items-center justify-between">
                <span>
                  <strong>Calculation:</strong> Available Now ({available}) = Total ({total}) − Borrowed ({borrowed}) − Reserved ({reserved})
                </span>
              </div>
            </div>

          </div>

          {/* Modal Actions Footer */}
          <div className="modal-actions pt-4 mt-6 border-t flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {onEditBook && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onEditBook(fullBook)
                  }}
                >
                  <Edit size={14} className="mr-1" />
                  Edit Details
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
