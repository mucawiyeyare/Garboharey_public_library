import { useTranslation } from 'react-i18next'
import { usePagedList } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { useState } from 'react'
import { Plus, Search, Users, UserCheck, Clock, UserX, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../../services/api'
import {
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeading,
  Status,
} from '../../components/common/ui'
import MemberForm from './components/MemberForm'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { isAdmin } from '../../utils/roles'

export default function MembersPage({ team = false }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState(null)
  const members = usePagedList(
    team ? 'team' : 'members',
    '/staff/members',
    `group=${team ? 'team' : 'members'}&q=${encodeURIComponent(search)}`,
  )
  const filtered = members.data
  if (team && !isAdmin(user)) return <Navigate to="/staff" replace />

  // Permissions:
  // Register member: Director: Yes | Administrator: Yes | Librarian: No
  const canRegister = team ? isAdmin(user) : isAdmin(user) || user?.role === 'director'
  const canDelete = team ? isAdmin(user) : isAdmin(user) || user?.role === 'director'

  const deleteMutation = useMutation({
    mutationFn: (id) => api(`/staff/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(team ? t('ui.members.userDeleted', 'User account deleted.') : t('ui.members.memberDeleted', 'Member deleted.'))
      members.refetch?.()
    },
    onError: (err) => toast.error(err.message || 'Failed to delete'),
  })

  // Summary counts from the paginated response (members group only)
  const summary = members.raw?.summary

  return (
    <>
      <PageHeading
        eyebrow={team ? t('ui.members.teamEyebrow', 'STAFF MANAGEMENT') : t('ui.members.eyebrow', 'Dashboard')}
        title={team ? t('nav.users', 'Users') : t('nav.members', 'Members')}
        description={
          team
            ? t('ui.members.teamIntro', 'Manage staff accounts and permissions.')
            : t('ui.members.intro', 'Manage reader memberships and account access.')
        }
      >
        {canRegister && (
          <Button className="button" onClick={() => setEditor('new')}>
            <Plus size={18} />
            {team ? t('ui.members.createStaff', 'Create Staff Account') : t('ui.members.register', 'Register New Member')}
          </Button>
        )}
      </PageHeading>

      {/* Recommended Members Dashboard Summary Cards — Staff workspace */}
      {!team && summary && (
        <div
          className="metrics-grid"
          style={{
            marginBottom: '1.25rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <div className="metric">
            <div>
              <span>{t('ui.members.statTotal', 'Total members')}</span>
              <Users size={18} aria-hidden="true" />
            </div>
            <strong>{summary.total ?? '—'}</strong>
            <small className="muted">{t('ui.members.statTotalSub', 'All registered accounts')}</small>
          </div>

          <div className="metric">
            <div>
              <span>{t('ui.members.statActive', 'Active members')}</span>
              <UserCheck size={18} aria-hidden="true" />
            </div>
            <strong>{summary.active ?? '—'}</strong>
            <small className="muted">{t('ui.members.statActiveSub', 'Approved memberships')}</small>
          </div>

          <div className="metric">
            <div>
              <span>{t('ui.members.statPending', 'Pending')}</span>
              <Clock size={18} aria-hidden="true" />
            </div>
            <strong>{summary.pending ?? '—'}</strong>
            <small className="muted">{t('ui.members.statPendingSub', 'Awaiting approval')}</small>
          </div>

          <div className="metric">
            <div>
              <span>{t('ui.members.statSuspended', 'Suspended')}</span>
              <UserX size={18} aria-hidden="true" />
            </div>
            <strong>{summary.suspended ?? '—'}</strong>
            <small className="muted">{t('ui.members.statSuspendedSub', 'Suspended accounts')}</small>
          </div>
        </div>
      )}

      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={18} />
            <Input
              aria-label={t('ui.members.search', 'Search')}
              placeholder={t('reports.searchPlaceholder', 'Search members by name or email...')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <span className="muted">{t('ui.members.count', { count: members.total })}</span>
        </div>
        {members.isPending ? (
          <Loading />
        ) : members.error ? (
          <ErrorState error={members.error} />
        ) : filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t('ui.members.memberId', 'ID / Member #')}</th>
                  <th>{t('ui.issue.member', 'Name')}</th>
                  <th>{t('home.email', 'Email')}</th>
                  <th>{t('ui.members.role', 'Role')}</th>
                  <th>{t('member.status', 'Status')}</th>
                  <th>{t('member.actions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((member) => (
                  <tr key={member._id}>
                    <td>
                      <code style={{ fontSize: '0.82em', opacity: 0.85, fontFamily: 'monospace' }}>
                        {String(member._id).slice(-8).toUpperCase()}
                      </code>
                    </td>
                    <td>
                      <div className="member-cell">
                        <span className="avatar">{member.name.slice(0, 2).toUpperCase()}</span>
                        <strong>{member.name}</strong>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>{t(`ui.roles.${member.role}`, member.role)}</td>
                    <td>
                      <Status value={member.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Button className="button secondary small" onClick={() => setEditor(member)}>
                          {t('ui.members.manage', 'Edit / View')}
                        </Button>
                        {canDelete && member._id !== user?._id && (
                          <Button
                            type="button"
                            variant="outline"
                            className="small"
                            style={{
                              color: 'var(--danger, #dc2626)',
                              borderColor: 'var(--danger, #dc2626)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              const confirmText = team
                                ? t('ui.members.confirmDeleteUser', `Are you sure you want to delete user "${member.name}"? This action cannot be undone.`)
                                : t('ui.members.confirmDeleteMember', `Are you sure you want to delete member "${member.name}"?`)
                              if (window.confirm(confirmText)) {
                                deleteMutation.mutate(member._id)
                              }
                            }}
                          >
                            <Trash2 size={13} />
                            {t('common.delete', 'Delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={t('ui.members.empty', 'No members found')} />
        )}
        <Pagination
          page={members.page}
          pages={members.pages}
          total={members.total}
          setPage={members.setPage}
        />
      </section>

      <Modal
        title={
          team
            ? editor === 'new'
              ? t('ui.members.createStaff', 'Create Staff Account')
              : t('ui.members.manageStaff', 'Manage Staff User')
            : editor === 'new'
              ? t('ui.members.registerTitle', 'Register New Member')
              : t('ui.members.manageMember', 'Member Details & Access')
        }
        description={t('ui.members.dialogIntro', 'View and update member account information, credentials, and access.')}
        open={!!editor}
        onOpenChange={(open) => {
          if (!open) setEditor(null)
        }}
      >
        {editor && (
          <MemberForm
            team={team}
            key={editor === 'new' ? 'new' : editor._id}
            member={editor === 'new' ? undefined : editor}
            onSaved={() => {
              setEditor(null)
              members.refetch?.()
            }}
          />
        )}
      </Modal>
    </>
  )
}
