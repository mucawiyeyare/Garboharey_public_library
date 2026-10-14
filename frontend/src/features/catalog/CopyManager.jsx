import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Minus, Plus } from 'lucide-react'
import { api } from '../../lib/api'
import { useAction } from '../../hooks/useAction'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { MutationFeedback } from '../../components/common/ui'

const plural = (n) => `${n} cop${n === 1 ? 'y' : 'ies'}`

// Add new copies of a title, or remove copies that are on the shelf.
export default function CopyManager({ book }) {
  const [mode, setMode] = useState('add')
  const [quantity, setQuantity] = useState(1)
  const [shelf, setShelf] = useState('')
  const detail = useQuery({
    queryKey: ['staff-book-detail', book._id],
    queryFn: () => api(`/staff/books/${book._id}`),
  })
  const counts = detail.data?.copies ?? book.copies ?? {}
  const total = counts.total ?? 0
  const available = counts.available ?? 0
  const reset = () => setQuantity(1)
  const add = useAction(`/staff/books/${book._id}/copies`, 'POST', reset)
  const remove = useAction(`/staff/books/${book._id}/copies/remove`, 'POST', reset)
  const action = mode === 'add' ? add : remove
  const qty = Math.max(1, Number(quantity) || 1)
  const max = mode === 'add' ? 500 : available
  const tooMany = mode === 'remove' && qty > available
  const newTotal = mode === 'add' ? total + qty : total - Math.min(qty, available)

  return (
    <form
      className="copy-adjuster"
      onSubmit={(event) => {
        event.preventDefault()
        if (tooMany) return
        action.mutate(
          mode === 'add' ? { quantity: qty, shelf: shelf.trim() || undefined } : { quantity: qty },
        )
      }}
    >
      <div className="copy-adjuster-stats">
        <span>
          Total <strong>{total}</strong>
        </span>
        <span>
          On shelf <strong>{available}</strong>
        </span>
        <span>
          After <strong className={mode === 'add' ? 'up' : 'down'}>{newTotal}</strong>
        </span>
      </div>

      <div className="segmented copy-adjuster-mode" role="group" aria-label="Add or remove copies">
        <button type="button" aria-pressed={mode === 'add'} onClick={() => setMode('add')}>
          <Plus size={15} aria-hidden="true" /> Add
        </button>
        <button type="button" aria-pressed={mode === 'remove'} onClick={() => setMode('remove')}>
          <Minus size={15} aria-hidden="true" /> Remove
        </button>
      </div>

      {mode === 'add' && (
        <label className="copy-adjuster-shelf">
          Shelf
          <Input
            maxLength={80}
            placeholder="e.g. FIC A-01"
            value={shelf}
            onChange={(event) => setShelf(event.target.value)}
          />
        </label>
      )}

      <div className="copy-adjuster-row">
        <button
          type="button"
          className="icon-button"
          aria-label="Decrease"
          onClick={() => setQuantity(Math.max(1, qty - 1))}
        >
          <Minus size={16} />
        </button>
        <Input
          type="number"
          min="1"
          max={Math.max(1, max)}
          aria-label="Number of copies"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <button
          type="button"
          className="icon-button"
          aria-label="Increase"
          onClick={() => setQuantity(Math.min(Math.max(1, max), qty + 1))}
        >
          <Plus size={16} />
        </button>
        <Button
          className={`button${mode === 'remove' ? ' danger' : ''}`}
          disabled={action.isPending || tooMany || (mode === 'add' && book.archived)}
        >
          {action.isPending ? 'Saving…' : `${mode === 'add' ? 'Add' : 'Remove'} ${plural(qty)}`}
        </Button>
      </div>

      {mode === 'remove' && (
        <small className={tooMany ? 'danger-text' : 'muted'}>
          {tooMany
            ? `Only ${plural(available)} on the shelf can be removed.`
            : 'Only copies on the shelf are removed; borrowed or reserved copies stay.'}
        </small>
      )}
      <MutationFeedback error={action.error} />
    </form>
  )
}
