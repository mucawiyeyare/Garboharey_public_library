import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Award,
  Users,
  BookOpen,
  Plus,
  Search,
  Upload,
  Trash2,
  Edit3,
  CheckCircle2,
  Archive,
  Eye,
  EyeOff,
  Calendar,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { api, body } from '../../services/api'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { Modal } from '../../components/modals/Modal'
import { Loading } from '../../components/common/ui'
import './governance.css'

export default function LeadershipGovernancePage() {
  const { t } = useTranslation()
  const { tab = 'founders' } = useParams()
  const navigate = useNavigate()
  const client = useQueryClient()

  const currentTab = ['founders', 'board', 'director-message'].includes(tab) ? tab : 'founders'
  const setTab = (newTab) => navigate(`/staff/governance/${newTab}`)

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: FOUNDERS STATE & MUTATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const [founderSearch, setFounderSearch] = useState('')
  const [founderStatusFilter, setFounderStatusFilter] = useState('all')
  const [founderModalOpen, setFounderModalOpen] = useState(false)
  const [editingFounder, setEditingFounder] = useState(null)
  const [uploadingFounderPhoto, setUploadingFounderPhoto] = useState(false)

  const foundersQuery = useQuery({
    queryKey: ['staff-founders', founderStatusFilter, founderSearch],
    queryFn: () =>
      api(
        `/staff/governance/founders?status=${encodeURIComponent(founderStatusFilter)}&q=${encodeURIComponent(
          founderSearch,
        )}`,
      ),
  })

  const saveFounder = useMutation({
    mutationFn: (data) =>
      api(editingFounder?._id ? `/staff/governance/founders/${editingFounder._id}` : '/staff/governance/founders', {
        method: editingFounder?._id ? 'PUT' : 'POST',
        body: body(data),
      }),
    onSuccess: () => {
      toast.success(editingFounder?._id ? 'Founder updated successfully' : 'Founder profile created')
      setFounderModalOpen(false)
      setEditingFounder(null)
      void client.invalidateQueries({ queryKey: ['staff-founders'] })
      void client.invalidateQueries({ queryKey: ['public-founders'] })
    },
    onError: (err) => toast.error(err.message || 'Failed to save founder profile'),
  })

  const toggleFounderStatus = useMutation({
    mutationFn: ({ id, status }) =>
      api(`/staff/governance/founders/${id}/status`, {
        method: 'PATCH',
        body: body({ status }),
      }),
    onSuccess: (_, vars) => {
      toast.success(`Founder marked as ${vars.status}`)
      void client.invalidateQueries({ queryKey: ['staff-founders'] })
      void client.invalidateQueries({ queryKey: ['public-founders'] })
    },
    onError: (err) => toast.error(err.message || 'Status update failed'),
  })

  const archiveFounder = useMutation({
    mutationFn: (id) => api(`/staff/governance/founders/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Founder profile archived')
      void client.invalidateQueries({ queryKey: ['staff-founders'] })
      void client.invalidateQueries({ queryKey: ['public-founders'] })
    },
    onError: (err) => toast.error(err.message || 'Archive failed'),
  })

  const deleteFounder = useMutation({
    mutationFn: (id) => api(`/staff/governance/founders/${id}?hard=true`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Founder profile permanently deleted')
      setFounderModalOpen(false)
      setEditingFounder(null)
      void client.invalidateQueries({ queryKey: ['staff-founders'] })
      void client.invalidateQueries({ queryKey: ['public-founders'] })
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: BOARD OF DIRECTORS STATE & MUTATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const [boardSearch, setBoardSearch] = useState('')
  const [boardCurrentFilter, setBoardCurrentFilter] = useState('all') // all, true, false
  const [boardStatusFilter, setBoardStatusFilter] = useState('all')
  const [boardModalOpen, setBoardModalOpen] = useState(false)
  const [editingBoard, setEditingBoard] = useState(null)
  const [uploadingBoardPhoto, setUploadingBoardPhoto] = useState(false)

  const boardQuery = useQuery({
    queryKey: ['staff-board', boardCurrentFilter, boardStatusFilter, boardSearch],
    queryFn: () => {
      let url = `/staff/governance/board?status=${encodeURIComponent(boardStatusFilter)}&q=${encodeURIComponent(
        boardSearch,
      )}`
      if (boardCurrentFilter === 'current') url += '&isCurrent=true'
      if (boardCurrentFilter === 'former') url += '&isCurrent=false'
      return api(url)
    },
  })

  const saveBoardMember = useMutation({
    mutationFn: (data) =>
      api(editingBoard?._id ? `/staff/governance/board/${editingBoard._id}` : '/staff/governance/board', {
        method: editingBoard?._id ? 'PUT' : 'POST',
        body: body(data),
      }),
    onSuccess: () => {
      toast.success(editingBoard?._id ? 'Board member updated successfully' : 'Board member added')
      setBoardModalOpen(false)
      setEditingBoard(null)
      void client.invalidateQueries({ queryKey: ['staff-board'] })
      void client.invalidateQueries({ queryKey: ['public-board'] })
    },
    onError: (err) => toast.error(err.message || 'Failed to save board member'),
  })

  const toggleBoardStatus = useMutation({
    mutationFn: ({ id, patch }) =>
      api(`/staff/governance/board/${id}/status`, {
        method: 'PATCH',
        body: body(patch),
      }),
    onSuccess: () => {
      toast.success('Board member updated')
      void client.invalidateQueries({ queryKey: ['staff-board'] })
      void client.invalidateQueries({ queryKey: ['public-board'] })
    },
    onError: (err) => toast.error(err.message || 'Update failed'),
  })

  const archiveBoardMember = useMutation({
    mutationFn: (id) => api(`/staff/governance/board/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Board member archived')
      void client.invalidateQueries({ queryKey: ['staff-board'] })
      void client.invalidateQueries({ queryKey: ['public-board'] })
    },
    onError: (err) => toast.error(err.message || 'Archive failed'),
  })

  const deleteBoardMember = useMutation({
    mutationFn: (id) => api(`/staff/governance/board/${id}?hard=true`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Board member permanently deleted')
      setBoardModalOpen(false)
      setEditingBoard(null)
      void client.invalidateQueries({ queryKey: ['staff-board'] })
      void client.invalidateQueries({ queryKey: ['public-board'] })
    },
    onError: (err) => toast.error(err.message || 'Delete failed'),
  })

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: DIRECTOR'S MESSAGE STATE & MUTATION
  // ───────────────────────────────────────────────────────────────────────────
  const directorMsgQuery = useQuery({
    queryKey: ['director-message'],
    queryFn: () => api('/staff/governance/director-message'),
  })

  const [directorFormData, setDirectorFormData] = useState({
    title: '',
    quoteSomali: '',
    message: '',
    directorName: '',
    directorTitle: '',
    photo: '',
  })
  const [uploadingDirectorPhoto, setUploadingDirectorPhoto] = useState(false)

  useEffect(() => {
    if (directorMsgQuery.data) {
      setDirectorFormData({
        title: directorMsgQuery.data.title || '',
        quoteSomali: directorMsgQuery.data.quoteSomali || '',
        message: directorMsgQuery.data.message || '',
        directorName: directorMsgQuery.data.directorName || 'Library Director',
        directorTitle: directorMsgQuery.data.directorTitle || 'Garbaharey Public Library',
        photo: directorMsgQuery.data.photo || '/images/director-portrait.webp',
      })
    }
  }, [directorMsgQuery.data])

  const saveDirectorMsg = useMutation({
    mutationFn: (data) =>
      api('/staff/governance/director-message', {
        method: 'PUT',
        body: body(data),
      }),
    onSuccess: () => {
      toast.success("Director's Message updated and published!")
      void client.invalidateQueries({ queryKey: ['director-message'] });
      void client.invalidateQueries({ queryKey: ['public-director-message'] })
    },
    onError: (err) => toast.error(err.message || 'Failed to update message'),
  })

  // ───────────────────────────────────────────────────────────────────────────
  // PHOTO UPLOAD HELPER
  // ───────────────────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (file, onDone, setUploading) => {
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (JPG, PNG, WEBP, etc.)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Please select a photo under 10 MB.')
      return
    }

    setUploading(true)
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed to read image file'))
        reader.readAsDataURL(file)
      })

      // Try uploading to /staff/covers first, fallback to /staff/governance/upload-photo
      let res
      try {
        res = await api('/staff/covers', {
          method: 'POST',
          body: body({ data: base64Data, contentType: file.type }),
        })
      } catch (firstErr) {
        try {
          res = await api('/staff/governance/upload-photo', {
            method: 'POST',
            body: body({ data: base64Data, contentType: file.type }),
          })
        } catch {
          throw firstErr
        }
      }

      if (res?.coverId) {
        onDone(`/api/covers/${res.coverId}`)
        toast.success('Photo uploaded successfully')
      } else {
        throw new Error('Upload succeeded but server did not return image ID')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  // Founder Form State
  const [founderForm, setFounderForm] = useState({
    fullName: '',
    role: 'Confirmed founding role',
    photo: '',
    biography: '',
    displayOrder: 1,
    status: 'Published',
  })

  const openAddFounder = () => {
    const nextOrder = (foundersQuery.data?.items?.length || 0) + 1
    setEditingFounder(null)
    setFounderForm({
      fullName: '',
      role: 'Confirmed founding role',
      photo: '',
      biography: '',
      displayOrder: nextOrder,
      status: 'Published',
    })
    setFounderModalOpen(true)
  }

  const openEditFounder = (founder) => {
    setEditingFounder(founder)
    setFounderForm({
      fullName: founder.fullName,
      role: founder.role,
      photo: founder.photo || '',
      biography: founder.biography || '',
      displayOrder: founder.displayOrder ?? 1,
      status: founder.status || 'Published',
    })
    setFounderModalOpen(true)
  }

  // Board Form State
  const [boardForm, setBoardForm] = useState({
    fullName: '',
    role: '',
    photo: '',
    biography: '',
    termStartDate: '',
    termEndDate: '',
    isCurrent: true,
    displayOrder: 1,
    status: 'Published',
  })

  const openAddBoard = () => {
    const nextOrder = (boardQuery.data?.items?.length || 0) + 1
    setEditingBoard(null)
    setBoardForm({
      fullName: '',
      role: 'Board Member',
      photo: '',
      biography: '',
      termStartDate: '',
      termEndDate: '',
      isCurrent: true,
      displayOrder: nextOrder,
      status: 'Published',
    })
    setBoardModalOpen(true)
  }

  const openEditBoard = (member) => {
    setEditingBoard(member)
    setBoardForm({
      fullName: member.fullName,
      role: member.role,
      photo: member.photo || '',
      biography: member.biography || '',
      termStartDate: member.termStartDate ? String(member.termStartDate).slice(0, 10) : '',
      termEndDate: member.termEndDate ? String(member.termEndDate).slice(0, 10) : '',
      isCurrent: member.isCurrent !== false,
      displayOrder: member.displayOrder ?? 1,
      status: member.status || 'Published',
    })
    setBoardModalOpen(true)
  }

  return (
    <div className="container page governance-container">
      {/* Header */}
      <div className="governance-header">
        <div>
          <h1>{t('nav.leadershipGovernance', 'Leadership & Governance')}</h1>
          <p>
            Manage the library's founders, current Board of Directors, and the official Director's message displayed on
            the public About Us page.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="governance-tabs" role="tablist">
        <button
          type="button"
          className={`governance-tab-btn ${currentTab === 'founders' ? 'active' : ''}`}
          onClick={() => setTab('founders')}
        >
          <Award size={17} />
          {t('nav.ourFounders', 'Our Founders')}
          <span className="governance-tab-badge">{foundersQuery.data?.counts?.total ?? '8'}</span>
        </button>

        <button
          type="button"
          className={`governance-tab-btn ${currentTab === 'board' ? 'active' : ''}`}
          onClick={() => setTab('board')}
        >
          <Users size={17} />
          {t('nav.boardOfDirectors', 'Board of Directors')}
          <span className="governance-tab-badge">{boardQuery.data?.counts?.total ?? '12'}</span>
        </button>

        <button
          type="button"
          className={`governance-tab-btn ${currentTab === 'director-message' ? 'active' : ''}`}
          onClick={() => setTab('director-message')}
        >
          <BookOpen size={17} />
          {t('nav.directorsMessage', "Director's Message")}
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: OUR FOUNDERS */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {currentTab === 'founders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics */}
          <div className="governance-metrics-grid">
            <div className="governance-metric-card">
              <span className="governance-metric-label">Total Founders</span>
              <span className="governance-metric-val">{foundersQuery.data?.counts?.total ?? 8}</span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Published</span>
              <span className="governance-metric-val" style={{ color: '#10b981' }}>
                {foundersQuery.data?.counts?.published ?? 8}
              </span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Draft</span>
              <span className="governance-metric-val" style={{ color: '#f59e0b' }}>
                {foundersQuery.data?.counts?.draft ?? 0}
              </span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Archived</span>
              <span className="governance-metric-val" style={{ color: 'var(--muted)' }}>
                {foundersQuery.data?.counts?.archived ?? 0}
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="governance-toolbar">
            <div className="governance-toolbar-filters">
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }}
                />
                <Input
                  type="text"
                  placeholder="Search founders..."
                  style={{ paddingLeft: '32px' }}
                  value={founderSearch}
                  onChange={(e) => setFounderSearch(e.target.value)}
                />
              </div>

              <select
                className="input"
                style={{ width: 'auto' }}
                value={founderStatusFilter}
                onChange={(e) => setFounderStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published Only</option>
                <option value="Draft">Draft Only</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <Button type="button" onClick={openAddFounder} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              Add Founder
            </Button>
          </div>

          {/* Founders Grid */}
          {foundersQuery.isLoading ? (
            <Loading />
          ) : (
            <div className="governance-cards-grid">
              {foundersQuery.data?.items?.map((founder) => (
                <div key={founder._id} className="gov-person-card">
                  <div className="gov-card-top">
                    <div className="gov-avatar-box">
                      {founder.photo ? (
                        <img src={founder.photo} alt={founder.fullName} />
                      ) : (
                        <Award size={30} />
                      )}
                    </div>
                    <div className="gov-person-meta">
                      <h3>{founder.fullName}</h3>
                      <div className="gov-person-role">{founder.role}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`gov-badge gov-badge-${founder.status.toLowerCase()}`}>
                          {founder.status}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          Order: #{founder.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="gov-person-bio">{founder.biography || 'No biography recorded yet.'}</p>

                  <div className="gov-card-footer">
                    <div className="gov-card-actions">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditFounder(founder)}
                      >
                        <Edit3 size={13} style={{ marginRight: '4px' }} />
                        Edit
                      </Button>

                      {founder.status === 'Published' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Unpublish (Save as Draft)"
                          onClick={() => toggleFounderStatus.mutate({ id: founder._id, status: 'Draft' })}
                        >
                          <EyeOff size={13} style={{ marginRight: '4px' }} />
                          Draft
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Publish Profile"
                          onClick={() => toggleFounderStatus.mutate({ id: founder._id, status: 'Published' })}
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          Publish
                        </Button>
                      )}
                    </div>

                    {founder.status !== 'Archived' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--muted)' }}
                        title="Archive profile without deleting"
                        onClick={() => archiveFounder.mutate(founder._id)}
                      >
                        <Archive size={14} />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Restore to Published"
                        onClick={() => toggleFounderStatus.mutate({ id: founder._id, status: 'Published' })}
                      >
                        <RotateCcw size={14} />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--danger, #dc2626)' }}
                      title="Delete founder permanently"
                      disabled={deleteFounder.isPending}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete founder "${founder.name}"?`)) {
                          deleteFounder.mutate(founder._id)
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: BOARD OF DIRECTORS */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {currentTab === 'board' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metrics */}
          <div className="governance-metrics-grid">
            <div className="governance-metric-card">
              <span className="governance-metric-label">Total Board Members</span>
              <span className="governance-metric-val">{boardQuery.data?.counts?.total ?? 12}</span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Current Board</span>
              <span className="governance-metric-val" style={{ color: '#3b82f6' }}>
                {boardQuery.data?.counts?.current ?? 12}
              </span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Former Members</span>
              <span className="governance-metric-val" style={{ color: 'var(--muted)' }}>
                {boardQuery.data?.counts?.former ?? 0}
              </span>
            </div>
            <div className="governance-metric-card">
              <span className="governance-metric-label">Published</span>
              <span className="governance-metric-val" style={{ color: '#10b981' }}>
                {boardQuery.data?.counts?.published ?? 12}
              </span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="governance-toolbar">
            <div className="governance-toolbar-filters">
              <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--muted)' }}
                />
                <Input
                  type="text"
                  placeholder="Search board members..."
                  style={{ paddingLeft: '32px' }}
                  value={boardSearch}
                  onChange={(e) => setBoardSearch(e.target.value)}
                />
              </div>

              <select
                className="input"
                style={{ width: 'auto' }}
                value={boardCurrentFilter}
                onChange={(e) => setBoardCurrentFilter(e.target.value)}
              >
                <option value="all">All Members</option>
                <option value="current">Current Board Only</option>
                <option value="former">Former Members Only</option>
              </select>

              <select
                className="input"
                style={{ width: 'auto' }}
                value={boardStatusFilter}
                onChange={(e) => setBoardStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <Button type="button" onClick={openAddBoard} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              Add Board Member
            </Button>
          </div>

          {/* Board Members Grid */}
          {boardQuery.isLoading ? (
            <Loading />
          ) : (
            <div className="governance-cards-grid">
              {boardQuery.data?.items?.map((member) => (
                <div key={member._id} className="gov-person-card">
                  <div className="gov-card-top">
                    <div className="gov-avatar-box">
                      {member.photo ? (
                        <img src={member.photo} alt={member.fullName} />
                      ) : (
                        <Users size={30} />
                      )}
                    </div>
                    <div className="gov-person-meta">
                      <h3>{member.fullName}</h3>
                      <div className="gov-person-role">{member.role}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          className={`gov-badge ${
                            member.isCurrent ? 'gov-badge-current' : 'gov-badge-former'
                          }`}
                        >
                          {member.isCurrent ? 'Current Board' : 'Former Member'}
                        </span>
                        <span className={`gov-badge gov-badge-${member.status.toLowerCase()}`}>
                          {member.status}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          #{member.displayOrder}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(member.termStartDate || member.termEndDate) && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        color: 'var(--muted)',
                      }}
                    >
                      <Calendar size={13} />
                      <span>
                        Term: {member.termStartDate ? String(member.termStartDate).slice(0, 10) : '—'} to{' '}
                        {member.termEndDate ? String(member.termEndDate).slice(0, 10) : 'Present'}
                      </span>
                    </div>
                  )}

                  <p className="gov-person-bio">{member.biography || 'No biography recorded yet.'}</p>

                  <div className="gov-card-footer">
                    <div className="gov-card-actions">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditBoard(member)}
                      >
                        <Edit3 size={13} style={{ marginRight: '4px' }} />
                        Edit
                      </Button>

                      {member.status === 'Published' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Unpublish (Save as Draft)"
                          onClick={() =>
                            toggleBoardStatus.mutate({ id: member._id, patch: { status: 'Draft' } })
                          }
                        >
                          <EyeOff size={13} style={{ marginRight: '4px' }} />
                          Draft
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Publish Profile"
                          onClick={() =>
                            toggleBoardStatus.mutate({ id: member._id, patch: { status: 'Published' } })
                          }
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          Publish
                        </Button>
                      )}
                    </div>

                    {member.status !== 'Archived' ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        style={{ color: 'var(--muted)' }}
                        title="Archive profile"
                        onClick={() => archiveBoardMember.mutate(member._id)}
                      >
                        <Archive size={14} />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Restore to Published"
                        onClick={() =>
                          toggleBoardStatus.mutate({ id: member._id, patch: { status: 'Published' } })
                        }
                      >
                        <RotateCcw size={14} />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--danger, #dc2626)' }}
                      title="Delete board member permanently"
                      disabled={deleteBoardMember.isPending}
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete board member "${member.name}"?`)) {
                          deleteBoardMember.mutate(member._id)
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DIRECTOR'S MESSAGE */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {currentTab === 'director-message' && (
        <div className="gov-director-layout">
          {/* Editor Form */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
              Edit Director's Message
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 20px' }}>
              Update the message and welcoming text shown on the public About Us page.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveDirectorMsg.mutate(directorFormData)
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <label>
                <strong>Message Title</strong>
                <Input
                  type="text"
                  required
                  value={directorFormData.title}
                  onChange={(e) => setDirectorFormData({ ...directorFormData, title: e.target.value })}
                />
              </label>

              <label>
                <strong>Somali Quote / Translation</strong>
                <textarea
                  className="input"
                  rows={3}
                  value={directorFormData.quoteSomali}
                  onChange={(e) => setDirectorFormData({ ...directorFormData, quoteSomali: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </label>

              <label>
                <strong>Message Content (English)</strong>
                <textarea
                  className="input"
                  rows={6}
                  required
                  value={directorFormData.message}
                  onChange={(e) => setDirectorFormData({ ...directorFormData, message: e.target.value })}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label>
                  <strong>Director Name</strong>
                  <Input
                    type="text"
                    value={directorFormData.directorName}
                    onChange={(e) => setDirectorFormData({ ...directorFormData, directorName: e.target.value })}
                  />
                </label>

                <label>
                  <strong>Director Title</strong>
                  <Input
                    type="text"
                    value={directorFormData.directorTitle}
                    onChange={(e) => setDirectorFormData({ ...directorFormData, directorTitle: e.target.value })}
                  />
                </label>
              </div>

              {/* Photo Upload & Preview */}
              <div>
                <strong>Director / Banner Photo</strong>
                <div className="gov-photo-field" style={{ marginTop: '6px' }}>
                  <div className="gov-photo-preview">
                    {directorFormData.photo ? (
                      <img src={directorFormData.photo} alt="Director preview" />
                    ) : (
                      <BookOpen size={24} />
                    )}
                  </div>
                  <div className="gov-photo-controls">
                    <Input
                      type="text"
                      placeholder="Photo URL or upload below..."
                      value={directorFormData.photo}
                      onChange={(e) => setDirectorFormData({ ...directorFormData, photo: e.target.value })}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label
                        className="button secondary small"
                        style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload size={13} />
                        {uploadingDirectorPhoto ? 'Uploading...' : 'Upload Image'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onClick={(e) => {
                            e.currentTarget.value = ''
                          }}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                              handlePhotoUpload(
                                f,
                                (url) => setDirectorFormData({ ...directorFormData, photo: url }),
                                setUploadingDirectorPhoto,
                              )
                            }
                          }}
                          disabled={uploadingDirectorPhoto}
                        />
                      </label>
                      {directorFormData.photo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDirectorFormData({ ...directorFormData, photo: '' })}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button type="submit" disabled={saveDirectorMsg.isPending}>
                  {saveDirectorMsg.isPending ? 'Saving...' : 'Save & Publish Message'}
                </Button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="gov-director-preview-box">
            <div className="gov-preview-header">
              <Sparkles size={14} />
              Public About Us Page Preview
            </div>

            <div className="about-director-card" style={{ margin: 0 }}>
              <div className="director-portrait-container">
                <div className="director-portrait-card">
                  <div className="director-portrait-wrap" style={{ width: '180px', minHeight: '180px', maxHeight: '250px', height: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={directorFormData.photo || '/images/director-portrait.webp'}
                      alt="Preview"
                      onError={(e) => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = '/images/director-portrait.webp'
                      }}
                      style={{ maxWidth: '100%', maxHeight: '240px', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                  <div className="director-portrait-meta">
                    <h4 className="director-portrait-name" style={{ fontSize: '13px' }}>
                      {directorFormData.directorName || 'Library Director'}
                    </h4>
                    <p className="director-portrait-role" style={{ fontSize: '12px' }}>
                      {directorFormData.directorTitle || 'Garbaharey Public Library'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="director-message-content">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
                  {directorFormData.title || 'A Warm Welcome to Our Library'}
                </h3>
                {directorFormData.quoteSomali && (
                  <blockquote style={{ fontStyle: 'italic', color: 'var(--text)', fontSize: '13px' }}>
                    "{directorFormData.quoteSomali}"
                  </blockquote>
                )}
                <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{directorFormData.message}</p>
                <div className="director-signature" style={{ marginTop: '12px' }}>
                  <div className="director-name" style={{ fontWeight: 600 }}>
                    {directorFormData.directorName}
                  </div>
                  <div className="director-title" style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    {directorFormData.directorTitle}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT FOUNDER */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <Modal
        open={founderModalOpen}
        onOpenChange={setFounderModalOpen}
        title={editingFounder ? 'Edit Founder Profile' : 'Add Founder Profile'}
        description="Add or update founder details, founding contribution, and photograph."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveFounder.mutate(founderForm)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}
        >
          <label>
            <strong>Full Name *</strong>
            <Input
              type="text"
              required
              placeholder="e.g. Dr. Abdullahi Hassan"
              value={founderForm.fullName}
              onChange={(e) => setFounderForm({ ...founderForm, fullName: e.target.value })}
            />
          </label>

          <label>
            <strong>Founding Role *</strong>
            <Input
              type="text"
              required
              placeholder="e.g. Co-Founder / Community Organizer"
              value={founderForm.role}
              onChange={(e) => setFounderForm({ ...founderForm, role: e.target.value })}
            />
          </label>

          {/* Photo upload */}
          <div>
            <strong>Founder Photograph</strong>
            <div className="gov-photo-field" style={{ marginTop: '6px' }}>
              <div className="gov-photo-preview">
                {founderForm.photo ? <img src={founderForm.photo} alt="Preview" /> : <Award size={24} />}
              </div>
              <div className="gov-photo-controls">
                <Input
                  type="text"
                  placeholder="Photo URL or upload below..."
                  value={founderForm.photo}
                  onChange={(e) => setFounderForm({ ...founderForm, photo: e.target.value })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    className="button secondary small"
                    style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Upload size={13} />
                    {uploadingFounderPhoto ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onClick={(e) => {
                        e.currentTarget.value = ''
                      }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          handlePhotoUpload(
                            f,
                            (url) => setFounderForm({ ...founderForm, photo: url }),
                            setUploadingFounderPhoto,
                          )
                        }
                      }}
                      disabled={uploadingFounderPhoto}
                    />
                  </label>
                  {founderForm.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFounderForm({ ...founderForm, photo: '' })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <label>
            <strong>Short Biography</strong>
            <textarea
              className="input"
              rows={4}
              placeholder="Describe the founder's contribution to establishing Garbaharey Public Library..."
              value={founderForm.biography}
              onChange={(e) => setFounderForm({ ...founderForm, biography: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label>
              <strong>Display Order *</strong>
              <Input
                type="number"
                min={0}
                required
                value={founderForm.displayOrder}
                onChange={(e) => setFounderForm({ ...founderForm, displayOrder: Number(e.target.value) || 0 })}
              />
            </label>

            <label>
              <strong>Status *</strong>
              <select
                className="input"
                value={founderForm.status}
                onChange={(e) => setFounderForm({ ...founderForm, status: e.target.value })}
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
            {editingFounder?._id ? (
              <Button
                type="button"
                variant="outline"
                style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                disabled={deleteFounder.isPending}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete founder "${editingFounder.name}"?`)) {
                    deleteFounder.mutate(editingFounder._id)
                  }
                }}
              >
                <Trash2 size={14} />
                Delete Founder
              </Button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setFounderModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveFounder.isPending}>
                {saveFounder.isPending ? 'Saving...' : editingFounder ? 'Update Founder' : 'Add Founder'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT BOARD MEMBER */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      <Modal
        open={boardModalOpen}
        onOpenChange={setBoardModalOpen}
        title={editingBoard ? 'Edit Board Member' : 'Add Board Member'}
        description="Manage board member role, official title, term dates, and biography."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saveBoardMember.mutate(boardForm)
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}
        >
          <label>
            <strong>Full Name *</strong>
            <Input
              type="text"
              required
              placeholder="e.g. Maryan Ali"
              value={boardForm.fullName}
              onChange={(e) => setBoardForm({ ...boardForm, fullName: e.target.value })}
            />
          </label>

          <label>
            <strong>Official Title / Role *</strong>
            <Input
              type="text"
              required
              placeholder="e.g. Chairman / Education & Literacy Advisor"
              value={boardForm.role}
              onChange={(e) => setBoardForm({ ...boardForm, role: e.target.value })}
            />
          </label>

          {/* Photo upload */}
          <div>
            <strong>Member Photograph</strong>
            <div className="gov-photo-field" style={{ marginTop: '6px' }}>
              <div className="gov-photo-preview">
                {boardForm.photo ? <img src={boardForm.photo} alt="Preview" /> : <Users size={24} />}
              </div>
              <div className="gov-photo-controls">
                <Input
                  type="text"
                  placeholder="Photo URL or upload below..."
                  value={boardForm.photo}
                  onChange={(e) => setBoardForm({ ...boardForm, photo: e.target.value })}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label
                    className="button secondary small"
                    style={{ cursor: 'pointer', margin: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Upload size={13} />
                    {uploadingBoardPhoto ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onClick={(e) => {
                        e.currentTarget.value = ''
                      }}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) {
                          handlePhotoUpload(
                            f,
                            (url) => setBoardForm({ ...boardForm, photo: url }),
                            setUploadingBoardPhoto,
                          )
                        }
                      }}
                      disabled={uploadingBoardPhoto}
                    />
                  </label>
                  {boardForm.photo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setBoardForm({ ...boardForm, photo: '' })}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={boardForm.isCurrent}
              onChange={(e) => setBoardForm({ ...boardForm, isCurrent: e.target.checked })}
            />
            <span>
              <strong>Current Board Member</strong> (uncheck if former member)
            </span>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label>
              <span style={{ fontSize: '13px' }}>Term Start Date</span>
              <Input
                type="date"
                value={boardForm.termStartDate}
                onChange={(e) => setBoardForm({ ...boardForm, termStartDate: e.target.value })}
              />
            </label>

            <label>
              <span style={{ fontSize: '13px' }}>Term End Date</span>
              <Input
                type="date"
                value={boardForm.termEndDate}
                onChange={(e) => setBoardForm({ ...boardForm, termEndDate: e.target.value })}
              />
            </label>
          </div>

          <label>
            <strong>Short Biography</strong>
            <textarea
              className="input"
              rows={4}
              placeholder="Describe their governance role and contribution to library stewardship..."
              value={boardForm.biography}
              onChange={(e) => setBoardForm({ ...boardForm, biography: e.target.value })}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label>
              <strong>Display Order *</strong>
              <Input
                type="number"
                min={0}
                required
                value={boardForm.displayOrder}
                onChange={(e) => setBoardForm({ ...boardForm, displayOrder: Number(e.target.value) || 0 })}
              />
            </label>

            <label>
              <strong>Status *</strong>
              <select
                className="input"
                value={boardForm.status}
                onChange={(e) => setBoardForm({ ...boardForm, status: e.target.value })}
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '16px' }}>
            {editingBoard?._id ? (
              <Button
                type="button"
                variant="outline"
                style={{ color: 'var(--danger, #dc2626)', borderColor: 'var(--danger, #dc2626)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                disabled={deleteBoardMember.isPending}
                onClick={() => {
                  if (window.confirm(`Are you sure you want to permanently delete board member "${editingBoard.name}"?`)) {
                    deleteBoardMember.mutate(editingBoard._id)
                  }
                }}
              >
                <Trash2 size={14} />
                Delete Member
              </Button>
            ) : <span />}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button type="button" variant="outline" onClick={() => setBoardModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveBoardMember.isPending}>
                {saveBoardMember.isPending ? 'Saving...' : editingBoard ? 'Update Member' : 'Add Board Member'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
