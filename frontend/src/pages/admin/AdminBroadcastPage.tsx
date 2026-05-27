import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, Megaphone, Trash2, CheckCircle2, X, RefreshCw } from 'lucide-react'
import { broadcastApi } from '@/lib/api'
import { BroadcastMessage, BroadcastTarget } from '@/types'
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

export function AdminBroadcastPage() {
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [targetType, setTargetType] = useState('all_inscrits')
  const [showForm, setShowForm] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['admin-broadcasts'],
    queryFn: async () => (await broadcastApi.list()).data.data as BroadcastMessage[],
  })

  const { data: targetsData } = useQuery({
    queryKey: ['admin-broadcast-targets'],
    queryFn: async () => (await broadcastApi.getTargets()).data.data as BroadcastTarget[],
  })

  const messages = messagesData ?? []
  const targets = targetsData ?? []

  const sendMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => broadcastApi.createAndSend(data),
    onSuccess: () => {
      setShowForm(false)
      setSubject('')
      setBody('')
      setTargetType('all_inscrits')
      setResultMsg('Message envoyé avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
      setTimeout(() => setResultMsg(null), 3000)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: string } } }
      setResultMsg(error?.response?.data?.error ?? "Erreur lors de l'envoi")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => broadcastApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-broadcasts'] })
    },
  })

  const targetLabel = (key: string) => {
    const found = targets.find((t) => t.key === key)
    return found ? found.label : key
  }

  const getTargetCount = (key: string) => {
    const found = targets.find((t) => t.key === key)
    return found?.count ?? 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diffuser une information</h1>
          <p className="text-gray-500 text-sm mt-1">Envoyez des communications aux participants</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Megaphone className="h-4 w-4 mr-2" /> Nouvelle diffusion
        </Button>
      </div>

      {resultMsg && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {resultMsg}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Nouveau message</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Destinataires *</Label>
            <Select value={targetType} onValueChange={setTargetType}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label} ({t.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              ~{getTargetCount(targetType)} destinataire(s) pour cette cible
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Objet *</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Objet du message" maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label>Message *</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre message..." />
          </div>

          <div className="flex items-center justify-end gap-3">
            <p className="text-xs text-gray-400">Le message sera envoyé par email et notification in-app</p>
            <Button onClick={() => sendMutation.mutate({ subject, body, target_type: targetType })}
              disabled={!subject.trim() || !body.trim()}>
              <Send className="h-4 w-4 mr-2" /> Envoyer
            </Button>
          </div>
        </div>
      )}

      {/* Sent messages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Messages envoyés</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Chargement...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Megaphone className="h-12 w-12 mb-3 text-gray-300" />
            <p>Aucun message envoyé</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Objet</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçus/Lus</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium max-w-[250px] truncate">{msg.subject}</TableCell>
                  <TableCell>{targetLabel(msg.target_type)}</TableCell>
                  <TableCell>
                    {msg.sent_at ? (
                      <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" /> Envoyé</Badge>
                    ) : (
                      <Badge variant="warning">Brouillon</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {msg.recipient_count ?? 0} / {msg.read_count ?? 0}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {msg.sent_at ? new Date(msg.sent_at).toLocaleDateString('fr-FR') : '-'}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-red-500"
                      onClick={() => deleteMutation.mutate(msg.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
