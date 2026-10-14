import { useTranslation } from 'react-i18next'
import { useAction } from '../../hooks/useAction'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { useState } from 'react'
import { toast } from 'sonner'
import { PasswordInput } from '../auth/PasswordInput'
import { MutationFeedback } from '../../components/common/ui'
import { useAuth } from '../../context/AuthProvider'
import { isAdmin } from '../../utils/roles'

export default function MemberForm({ member, onSaved, team = false }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState(member?.status ?? 'active')
  const [role, setRole] = useState(member?.role ?? (team ? 'librarian' : 'member'))

  const action = useAction(
    member ? `/staff/members/${member._id}` : '/staff/members',
    member ? 'PATCH' : 'POST',
    onSaved,
  )

  return (
    <form
      className="form-stack"
      onSubmit={(event) => {
        event.preventDefault()
        if (!member && password !== confirmPassword) {
          toast.error(t('auth.mismatch'))
          return
        }
        if (member && password && password !== confirmPassword) {
          toast.error(t('auth.mismatch'))
          return
        }
        action.mutate(
          member
            ? { name, email, status, role, ...(password ? { password } : {}) }
            : { name, email, password, ...(team ? { role } : {}) },
        )
      }}
    >
      {/* Member ID — shown when editing an existing record */}
      {member && (
        <label>
          {t('ui.members.memberId', 'Member ID')}
          <Input
            value={member._id}
            readOnly
            aria-readonly="true"
            style={{ fontFamily: 'monospace', fontSize: '0.85em' }}
          />
          <small className="muted">
            {t('ui.members.memberIdHint', 'System identifier — read only')}
          </small>
        </label>
      )}

      <label>
        {t('auth.fullName')}
        <Input
          required
          minLength={2}
          maxLength={100}
          placeholder={t('auth.fullNamePlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <label>
        {t('auth.email')}
        <Input
          required
          type="email"
          placeholder={team ? 'staff@example.com' : 'member@example.com'}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      {/* Password — required on create, optional on edit */}
      <label>
        {member
          ? t('ui.members.newPassword', 'New Password (leave blank to keep current)')
          : t('ui.members.initialPassword')}
        <PasswordInput
          aria-label={t('ui.members.initialPassword')}
          placeholder={
            member
              ? t('ui.members.passwordOptional', 'Leave blank to keep current password')
              : t('auth.newPasswordPlaceholder')
          }
          type="password"
          required={!member}
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <small className="muted">{t('ui.members.passwordHint')}</small>
      </label>

      {(!member || password) && (
        <label>
          {t('auth.confirmPassword')}
          <PasswordInput
            aria-label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPlaceholder')}
            autoComplete="new-password"
            required={!member || !!password}
            minLength={12}
            maxLength={128}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
      )}

      {!member && team && (
        <label>
          {t('ui.members.role')}
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="librarian">{t('ui.roles.librarian')}</option>
            <option value="director">{t('ui.roles.director')}</option>
            {isAdmin(user) && <option value="admin">{t('ui.roles.admin')}</option>}
          </select>
        </label>
      )}

      {member && (
        <>
          <label>
            {t('ui.members.status')}
            <select
              disabled={user?.role === 'librarian'}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="active">{t('taxonomy.active')}</option>
              <option value="suspended">{t('ui.members.suspended')}</option>
            </select>
            {user?.role === 'librarian' && (
              <small className="muted">{t('ui.members.librarianStatusNote', 'Librarians have limited edit permissions. Contact Director or Administrator to suspend accounts.')}</small>
            )}
          </label>
          <label>
            {t('ui.members.role')}
            <select
              disabled={!isAdmin(user)}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              <option value="member">{t('ui.roles.member')}</option>
              <option value="librarian">{t('ui.roles.librarian')}</option>
              <option value="director">{t('ui.roles.director')}</option>
              {isAdmin(user) && <option value="admin">{t('ui.roles.admin')}</option>}
            </select>
          </label>
        </>
      )}

      <MutationFeedback error={action.error} />
      <Button className="button" disabled={action.isPending}>
        {action.isPending
          ? t('staffContent.saving')
          : member
            ? t('ui.members.save')
            : team
              ? t('ui.members.createStaff')
              : t('ui.members.register')}
      </Button>
    </form>
  )
}
