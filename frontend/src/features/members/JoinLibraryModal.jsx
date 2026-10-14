import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { CheckCircle2, UserPlus } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { api, body } from '../../services/api'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import MembershipRequirements, { RequirementsAgreement } from './MembershipRequirements'

export default function JoinLibraryModal({ open, onOpenChange }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [submittedData, setSubmittedData] = useState(null)

  const applyMutation = useMutation({
    mutationFn: (values) =>
      api('/library/applications', {
        method: 'POST',
        body: body(values),
      }),
    onSuccess: (data) => {
      setSubmittedData(data)
      void queryClient.invalidateQueries({ queryKey: ['applications'] })
      toast.success(
        t('join.confirmation', 'Your application has been received. Please wait for approval.'),
      )
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit application', {
        id: error.message,
        duration: 7000,
      })
    },
  })

  const handleClose = () => {
    onOpenChange(false)
    // Reset after animation
    setTimeout(() => {
      setSubmittedData(null)
      applyMutation.reset()
    }, 250)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const values = {
      fullName: formData.get('fullName')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      email: formData.get('email')?.toString().trim() || '',
      address: formData.get('address')?.toString().trim() || '',
      dateOfBirth: formData.get('dateOfBirth')?.toString() || null,
      preferredContact: formData.get('preferredContact')?.toString() || 'phone',
      lang: i18n.language || 'en',
    }

    applyMutation.mutate(values)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content join-library-modal-content">
          <div className="modal-header">
            <div className="flex items-center gap-2">
              <UserPlus className="text-accent" size={24} />
              <Dialog.Title className="text-xl font-bold">
                {submittedData
                  ? t('join.statusLabel', 'Application Received')
                  : t('join.title', 'Join the Library')}
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="icon-button modal-close"
              aria-label={t('ui.common.closeDialog', 'Close')}
            >
              <X size={20} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="muted mb-4">
            {submittedData
              ? t(
                  'join.confirmation',
                  'Your membership application was received and is waiting for review by library staff.',
                )
              : t(
                  'join.intro',
                  'Fill in the form to apply for membership. The Admin or Director will review and approve your application.',
                )}
          </Dialog.Description>

          {submittedData ? (
            <div className="join-status text-center py-4 space-y-4">
              <div className="flex justify-center my-2">
                <CheckCircle2 size={54} color="#10b981" />
              </div>
              <h3 className="text-lg font-semibold">
                {t('join.statusLabel', 'Status')}:{' '}
                <span className="badge badge-pending text-amber-600 font-bold">
                  {t('join.pending', 'PENDING')}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground px-2">
                {t(
                  'join.waitApproval',
                  'Your application has been submitted to the Admin and Director for approval. Once approved, you will officially become a library member.',
                )}
              </p>
              <div className="p-3 bg-muted/40 rounded-lg text-sm border font-mono">
                {t('join.reference', 'Reference Code')}:{' '}
                <strong>{submittedData.reference || submittedData._id}</strong>
              </div>
              <div className="pt-4">
                <Button type="button" className="w-full" onClick={handleClose}>
                  {t('ui.common.done', 'Done')}
                </Button>
              </div>
            </div>
          ) : (
            <form className="form-stack join-form space-y-3" onSubmit={handleSubmit}>
              <MembershipRequirements sticky />
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('join.fullName', 'Full Name')} <span className="text-red-500">*</span>
                </label>
                <Input
                  name="fullName"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('join.phone', 'Telephone Number')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={5}
                    maxLength={30}
                    placeholder="e.g. +252 61 234 5678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('join.email', 'Email Address (optional)')}
                  </label>
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    placeholder="e.g. member@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('join.address', 'Home Address / City (optional)')}
                </label>
                <Input
                  name="address"
                  autoComplete="street-address"
                  maxLength={200}
                  placeholder="e.g. Garbaharey, Main District"
                />
              </div>

              <div className="form-grid grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('join.dob', 'Date of Birth (optional)')}
                  </label>
                  <Input name="dateOfBirth" type="date" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('join.contact', 'Preferred Contact Method')}
                  </label>
                  <select
                    name="preferredContact"
                    defaultValue="phone"
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                  >
                    <option value="phone">{t('join.byPhone', 'Phone')}</option>
                    <option value="email">{t('join.byEmail', 'Email')}</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                {t(
                  'join.privacy',
                  'Privacy notice: We only ask for information needed to manage your library membership. Details are kept confidential.',
                )}
              </p>

              <RequirementsAgreement />

              <div className="modal-actions pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('staffContent.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending
                    ? t('join.sending', 'Submitting...')
                    : t('join.submit', 'Submit Application')}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
