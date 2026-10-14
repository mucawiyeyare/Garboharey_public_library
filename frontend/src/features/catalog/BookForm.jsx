import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bookSchema } from '../../utils/validators'
import { MutationFeedback } from '../../components/common/ui'

export const categoryName = (category) =>
  category.name?.en || category.name?.so || category.name?.ar || category.name || ''
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

// Turns the typed text into an id: an existing entry with that name, or a newly created one.
export async function resolveTaxonomy(text, items, nameOf, path, body) {
  const name = text.trim()
  if (!name) return null
  const match = items.find((item) =>
    [nameOf(item), item.name?.en, item.name?.so, item.name?.ar]
      .filter((value) => typeof value === 'string' && value)
      .some((value) => sameName(value, name)),
  )
  if (match) return match._id
  const created = await api(path, { method: 'POST', body: JSON.stringify(body(name)) })
  return created._id
}

export default function BookForm({ book, onSaved }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const categories = useQuery({
    queryKey: ['staff-categories-all'],
    queryFn: () => api('/staff/categories'),
  })
  const publishers = useQuery({
    queryKey: ['staff-publishers-all'],
    queryFn: () => api('/staff/publishers'),
  })
  const [coverFile, setCoverFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [uploading, setUploading] = useState(false)
  // Shelf for the new copies (sent with a new title only)
  const [shelf, setShelf] = useState('')
  // Free text for the category / publisher fields: pick a suggestion or type a new name.
  const [categoryText, setCategoryText] = useState(null)
  const [publisherText, setPublisherText] = useState(null)
  const categoryList = Array.isArray(categories.data) ? categories.data : []
  const publisherList = Array.isArray(publishers.data) ? publishers.data : []
  useEffect(() => {
    if (categoryText !== null || !categories.data) return
    const id = book?.category?._id ?? book?.category
    const current = categoryList.find((item) => item._id === id)
    setCategoryText(current ? categoryName(current) : (book?.categoryName ?? ''))
  }, [categories.data]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (publisherText !== null || !publishers.data) return
    const id = book?.publisher?._id ?? book?.publisher
    const current = publisherList.find((item) => item._id === id)
    setPublisherText(current ? current.name : (book?.publisherName ?? ''))
  }, [publishers.data]) // eslint-disable-line react-hooks/exhaustive-deps
  const form = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: book
      ? {
          ...book,
          category: book.category?._id ?? book.category ?? '',
          publisher: book.publisher?._id ?? book.publisher ?? '',
          language: book.language ?? 'en',
          edition: book.edition ?? '',
          featured: book.featured ?? false,
          initialCopies: 0,
        }
      : {
          title: '',
          author: '',
          isbn: '',
          category: '',
          publisher: '',
          language: 'en',
          edition: '',
          year: new Date().getFullYear(),
          description: '',
          archived: false,
          featured: true,
          initialCopies: 50,
        },
  })
  const action = useAction(
    book ? `/staff/books/${book._id}` : '/staff/books',
    book ? 'PATCH' : 'POST',
    onSaved,
  )
  return (
    <form
      className="form-stack"
      onSubmit={form.handleSubmit(
        async (values) => {
          setUploadError(null)
          setUploading(true)
          try {
            values.category = await resolveTaxonomy(
              categoryText ?? '',
              categoryList,
              categoryName,
              '/staff/categories',
              (name) => ({ name: { en: name, so: name, ar: name } }),
            )
            values.publisher = await resolveTaxonomy(
              publisherText ?? '',
              publisherList,
              (item) => item.name,
              '/staff/publishers',
              (name) => ({ name }),
            )
            // New names may have been added: refresh the suggestion lists.
            void client.invalidateQueries({ queryKey: ['staff-categories-all'] })
            void client.invalidateQueries({ queryKey: ['staff-publishers-all'] })
            if (coverFile) {
              const uploaded = await api('/staff/covers', {
                method: 'POST',
                body: coverFile,
                headers: { 'Content-Type': coverFile.type },
              })
              values.coverId = uploaded.coverId
            }
            action.mutate(book ? values : { ...values, shelf: shelf.trim() || undefined })
          } catch (error) {
            setUploadError(error)
          } finally {
            setUploading(false)
          }
        },
        // Never fail silently: show the first problem, even for fields without an inline message.
        (errors) => toast.error(Object.values(errors)[0]?.message ?? t('ui.common.checkForm')),
      )}
    >
      <div className="form-grid">
        {[
          { key: 'title', label: t('reports.cols.title'), placeholder: t('bookForm.titleHint') },
          { key: 'author', label: t('bookForm.authors'), placeholder: t('bookForm.authorsHint') },
          {
            key: 'isbn',
            label: t('bookForm.isbn'),
            placeholder: 'e.g. 9780385474542 / CAT-0001',
          },
          { key: 'year', label: t('bookForm.year'), placeholder: '2024' },
          { key: 'edition', label: t('bookForm.edition'), placeholder: '' },
        ].map(({ key, label, placeholder }) => (
          <label key={key}>
            {label}
            <Input
              placeholder={placeholder}
              type={key === 'year' ? 'number' : 'text'}
              {...form.register(key)}
            />
            {form.formState.errors[key] && (
              <span className="form-error">{form.formState.errors[key]?.message}</span>
            )}
          </label>
        ))}
        <label>
          {t('bookForm.category')}
          <Input
            list="book-form-categories"
            autoComplete="off"
            maxLength={100}
            placeholder={t('bookForm.categoryHint', 'Choose or type a new category')}
            value={categoryText ?? ''}
            onChange={(event) => setCategoryText(event.target.value)}
          />
          <datalist id="book-form-categories">
            {categoryList.map((category) => (
              <option key={category._id} value={categoryName(category)} />
            ))}
          </datalist>
          {form.formState.errors.category && (
            <span className="form-error">{form.formState.errors.category.message}</span>
          )}
        </label>
        <label>
          {t('bookForm.publisher')}
          <Input
            list="book-form-publishers"
            autoComplete="off"
            maxLength={100}
            placeholder={t('bookForm.publisherHint', 'Choose or type a new publisher')}
            value={publisherText ?? ''}
            onChange={(event) => setPublisherText(event.target.value)}
          />
          <datalist id="book-form-publishers">
            {publisherList.map((publisher) => (
              <option key={publisher._id} value={publisher.name} />
            ))}
          </datalist>
        </label>
        <label>
          {t('bookForm.language')}
          <select {...form.register('language')}>
            {['en', 'so', 'ar', 'other'].map((language) => (
              <option key={language} value={language}>
                {t(`catalog.languages.${language}`)}
              </option>
            ))}
          </select>
        </label>
        {!book && (
          <label style={{ gridColumn: '1 / -1' }}>
            {t('ui.copies.shelf', 'Shelf')}
            <Input
              maxLength={80}
              placeholder={t('ui.copies.shelfHint', 'e.g. FIC A-01')}
              value={shelf}
              onChange={(event) => setShelf(event.target.value)}
            />
          </label>
        )}
        {!book && (
          <label style={{ gridColumn: '1 / -1' }}>
            <strong>{t('ui.inventory.copies', 'Number of copies')}</strong>
            <Input
              type="number"
              min="1"
              max="1000"
              placeholder="e.g. 50"
              {...form.register('initialCopies', { valueAsNumber: true })}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[1, 10, 50, 100, 150].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="button secondary small"
                  style={{
                    padding: '4px 12px',
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    fontWeight: '600',
                    border: form.watch('initialCopies') === num ? '2px solid var(--accent, #0284c7)' : '1px solid var(--line, #cbd5e1)',
                    background: form.watch('initialCopies') === num ? 'var(--accent-subtle, #e0f2fe)' : 'transparent',
                  }}
                  onClick={() => form.setValue('initialCopies', num)}
                >
                  {num} copies
                </button>
              ))}
            </div>
            {form.formState.errors.initialCopies && (
              <span className="form-error">{form.formState.errors.initialCopies.message}</span>
            )}
          </label>
        )}
      </div>
      <label>
        {t('bookForm.cover')}
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null
            if (
              file &&
              (file.size > 5 * 1024 * 1024 ||
                !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
            ) {
              setUploadError(new Error(t('bookForm.coverInvalid')))
              event.target.value = ''
              setCoverFile(null)
            } else {
              setUploadError(null)
              setCoverFile(file)
            }
          }}
        />
        <small className="muted">{t('bookForm.coverHint')}</small>
      </label>
      {form.watch('coverId') && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.setValue('coverId', null)
            setCoverFile(null)
          }}
        >
          {t('bookForm.plainCover')}
        </Button>
      )}
      <label>
        {t('taxonomy.description')}
        <textarea
          placeholder={t('bookForm.descriptionHint')}
          rows={4}
          {...form.register('description')}
        />
      </label>
      <label className="checkbox-label">
        <Input type="checkbox" {...form.register('featured')} />
        {t('bookForm.featured')}
      </label>
      {book && (
        <label className="checkbox-label">
          <Input type="checkbox" {...form.register('archived')} />
          {t('bookForm.archive')}
        </label>
      )}
      <MutationFeedback error={uploadError ?? action.error} />
      <Button className="button" disabled={action.isPending || uploading}>
        {action.isPending || uploading
          ? t('staffContent.saving')
          : book
            ? t('bookForm.saveChanges')
            : t('ui.inventory.addTitle')}
      </Button>
    </form>
  )
}
