import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Mail, Send, UserPlus, RefreshCw, XCircle, Users, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { reviewerInvitationApi } from '@/lib/api'
import { ReviewerInvitation, ReviewerStat } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function AdminReviewerInvitationsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNom, setInviteNom] = useState('')
  const [invitePrenom, setInvitePrenom] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ['admin-reviewer-invitations', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : undefined
      return (await reviewerInvitationApi.list(params)).data.data as ReviewerInvitation[]
    },
  })

  const { data: reviewersData } = useQuery({
    queryKey: ['admin-reviewers-stats'],
    queryFn: async () => (await reviewerInvitationApi.getReviewersStats()).data.data as ReviewerStat[],
  })

  const invitations = invitationsData ?? []
  const reviewers = reviewersData ?? []

  const inviteMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => reviewerInvitationApi.invite(data),
    onSuccess: () => {
      setShowForm(false)
      setInviteEmail('')
      setInviteNom('')
      setInvitePrenom('')
      setInviteMessage('')
      setResultMsg('Invitation envoyée avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-reviewer-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['admin-reviewers-stats'] })
      setTimeout(() => setResultMsg(null), 3000)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } }
      setResultMsg(error?.response?.data?.error ?? "Erreur lors de l'envoi")
    },
  })

  const resendMutation = useMutation({
    mutationFn: (id: string) => reviewerInvitationApi.resend(id),
    onSuccess: () => {
      setResultMsg('Invitation renvoyée')
      setTimeout(() => setResultMsg(null), 3000)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => reviewerInvitationApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviewer-invitations'] })
      setResultMsg('Invitation annulée')
      setTimeout(() => setResultMsg(null), 3000)
    },
  })

  const remindersMutation = useMutation({
    mutationFn: () => reviewerInvitationApi.sendReminders(),
    onSuccess: (res) => {
      const data = res.data.data as { message: string }
      setResultMsg(data.message)
      setTimeout(() => setResultMsg(null), 5000)
    },
  })

  const statusBadge = (status: string) => {
    const map: Record<string, React.ReactNode> = {
      pending: <Badge variant="warning"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>,
      accepted: <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Acceptée</Badge>,
      declined: <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Refusée</Badge>,
      expired: <Badge variant="secondary"><AlertTriangle className="h-3 w-3 mr-1" /> Expirée</Badge>,
    }
    return map[status] ?? <Badge>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des relecteurs</h1>
          <p className="text-gray-500 text-sm mt-1">Invitations, relances et suivi des relecteurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => remindersMutation.mutate()}>
            <Send className="h-4 w-4 mr-2" /> Relancer tous
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus className="h-4 w-4 mr-2" /> Inviter
          </Button>
        </div>
      </div>

      {resultMsg && (
        <div className="rounded-lg bg-primary-50 border border-primary-200 p-3 text-sm text-primary-800">
          {resultMsg}
        </div>
      )}

      {/* Invite form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Nouvelle invitation</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input value={invitePrenom} onChange={(e) => setInvitePrenom(e.target.value)} placeholder="Prénom" />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={inviteNom} onChange={(e) => setInviteNom(e.target.value)} placeholder="Nom" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Message personnalisé (optionnel)</Label>
            <Textarea rows={3} value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} placeholder="Message d'invitation..." />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => inviteMutation.mutate({
              email: inviteEmail,
              nom: inviteNom,
              prenom: invitePrenom,
              message: inviteMessage,
            })} disabled={!inviteEmail.trim()}>
              <Mail className="h-4 w-4 mr-2" /> Envoyer l'invitation
            </Button>
          </div>
        </div>
      )}

      {/* Reviewers stats */}
      {reviewers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Relecteurs actifs</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Relecteur</TableHead>
                <TableHead>Assignées</TableHead>
                <TableHead>En cours</TableHead>
                <TableHead>Terminées</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviewers.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium text-sm">{r.prenom} {r.nom}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </TableCell>
                  <TableCell><Badge variant="warning">{r.assigned_count}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{r.in_progress_count}</Badge></TableCell>
                  <TableCell><Badge variant="success">{r.completed_count}</Badge></TableCell>
                  <TableCell>{r.total_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Invitations list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="font-semibold text-gray-900">Invitations envoyées</h3>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="accepted">Acceptées</SelectItem>
                <SelectItem value="declined">Refusées</SelectItem>
                <SelectItem value="expired">Expirées</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Chargement...
            </div>
          ) : invitations.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <Users className="h-12 w-12 mb-3 text-gray-300" />
              <p>Aucune invitation trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Invité le</TableHead>
                  <TableHead>Relances</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>{inv.prenom} {inv.nom}</TableCell>
                    <TableCell>{statusBadge(inv.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(inv.invited_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{inv.reminder_count}</TableCell>
                    <TableCell className="text-right">
                      {inv.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => resendMutation.mutate(inv.id)}>
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500"
                            onClick={() => cancelMutation.mutate(inv.id)}>
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
