import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../../lib/api'
import { usePagedList } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import {
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeading,
} from '../../components/common/ui'
import BookForm from './components/BookForm'
import CopyManager from './components/CopyManager'
import ViewCopiesModal from '../../features/catalog/ViewCopiesModal'

export default function InventoryPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState(null)
  const [viewCopiesBook, setViewCopiesBook] = useState(null)

  const books = usePagedList('inventory', '/staff/books', `q=${encodeURIComponent(search)}`)
  const filtered = books.data

  const deleteBookMutation = useMutation({
    mutationFn: (bookId) => api(`/staff/books/${bookId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Book and associated copies deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['copies'] })
      queryClient.invalidateQueries({ queryKey: ['staff-books-all'] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete book')
    },
  })

  const handleDeleteBook = (book) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${book.title}"?\nThis will remove all associated copies and records. This action cannot be undone.`
      )
    ) {
      deleteBookMutation.mutate(book._id)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={t('ui.inventory.eyebrow')}
        title={t('ui.inventory.title', 'Books & physical copies')}
        description={t('ui.inventory.intro')}
      >
        <Button className="button" onClick={() => setEditor('new')}>
          <Plus size={18} />
          {t('ui.inventory.addTitle', 'Add title')}
        </Button>
      </PageHeading>

      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={18} />
            <Input
              aria-label={t('ui.inventory.search')}
              placeholder={t('ui.inventory.searchPlaceholder', 'Search title, author, or ISBN')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="muted">{t('ui.inventory.count', { count: books.total })}</span>
        </div>

        {books.isPending ? (
          <Loading />
        ) : books.error ? (
          <ErrorState error={books.error} />
        ) : filtered.length ? (
          <div className="table-scroll inventory-scroll">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th className="num" title="Total copies">Total</th>
                  <th className="num" title="Borrowed">Out</th>
                  <th className="num" title="Available now">Avail.</th>
                  <th className="num" title="Reserved / pending">Res.</th>
                  <th className="actions">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((book) => {
                  const total = book.copies?.total ?? 0
                  const borrowed = book.copies?.borrowed ?? 0
                  const reserved = book.copies?.reserved ?? 0
                  const available =
                    book.copies?.available ?? Math.max(0, total - borrowed - reserved)
                  return (
                    <tr key={book._id}>
                      <td className="title">
                        <strong>{book.title}</strong>
                        {book.author && <small>{book.author}</small>}
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          className="inventory-total"
                          onClick={() => setViewCopiesBook(book)}
                          title="View book and copy details"
                        >
                          {total}
                        </button>
                      </td>
                      <td className="num">
                        <span className="copy-stat-badge badge-borrowed">{borrowed}</span>
                      </td>
                      <td className="num">
                        <span className="copy-stat-badge badge-available">{available}</span>
                      </td>
                      <td className="num">
                        <span className="copy-stat-badge badge-reserved">{reserved}</span>
                      </td>
                      <td className="actions">
                        <div className="inventory-actions">
                          <button
                            type="button"
                            className="inventory-action"
                            onClick={() => setViewCopiesBook(book)}
                            aria-label={`View ${book.title}`}
                            title="View"
                          >
                            <Eye size={15} aria-hidden="true" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="inventory-action edit"
                            onClick={() => setEditor(book)}
                            aria-label={`Edit ${book.title}`}
                            title="Edit details and copies"
                          >
                            <Pencil size={15} aria-hidden="true" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="inventory-action delete"
                            onClick={() => handleDeleteBook(book)}
                            disabled={deleteBookMutation.isPending}
                            aria-label={`Delete ${book.title}`}
                            title="Delete"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={search ? t('ui.inventory.noMatch') : t('ui.inventory.empty')}>
            <p className="muted">{t('ui.inventory.emptyHint')}</p>
          </Empty>
        )}

        <Pagination
          page={books.page}
          pages={books.pages}
          total={books.total}
          setPage={books.setPage}
        />
      </section>

      {/* Edit Title / Book Form Modal */}
      <Modal
        title={editor === 'new' ? t('ui.inventory.addTitleDialog') : t('ui.inventory.editTitle')}
        description={t('ui.inventory.dialogIntro')}
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null)
        }}
      >
        {editor && editor !== 'new' && (
          <section className="edit-copies-section">
            <h3 className="subheading">Copies</h3>
            <CopyManager book={editor} />
          </section>
        )}
        {editor && (
          <BookForm
            key={editor === 'new' ? 'new' : editor._id}
            book={editor === 'new' ? undefined : editor}
            onSaved={() => setEditor(null)}
          />
        )}
      </Modal>


      {/* View Whole Book Data & Copies Modal */}
      <ViewCopiesModal
        book={viewCopiesBook}
        open={!!viewCopiesBook}
        onOpenChange={(open) => {
          if (!open) setViewCopiesBook(null)
        }}
        onEditCopies={(b) => setEditor(b)}
        onEditBook={(b) => setEditor(b)}
      />
    </>
  )
}
