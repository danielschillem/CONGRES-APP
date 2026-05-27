import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { programApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit3, Clock, MapPin } from 'lucide-react'
import type { ProgramSlot, Soumission } from '@/types'
import { EmptyState, LoadingState, PageHeader } from '@/components/Interface'

const sessionTypeLabels: Record<string, string> = {
  plenary: 'Plénière',
  parallel: 'Parallèle',
  poster: 'Poster',
  workshop: 'Atelier',
  presentation: 'Présentation',
}

const sessionTypeColors: Record<string, string> = {
  plenary: 'bg-purple-100 text-purple-800',
  parallel: 'bg-blue-100 text-blue-800',
  poster: 'bg-orange-100 text-orange-800',
  workshop: 'bg-green-100 text-green-800',
  presentation: 'bg-gray-100 text-gray-800',
}

function SlotFormDialog({
  open,
  onOpenChange,
  slot,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  slot?: ProgramSlot | null
}) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(slot?.title ?? '')
  const [date, setDate] = useState(slot?.date ?? '')
  const [startTime, setStartTime] = useState(slot?.start_time ?? '')
  const [endTime, setEndTime] = useState(slot?.end_time ?? '')
  const [location, setLocation] = useState(slot?.location ?? '')
  const [sessionType, setSessionType] = useState<string>(slot?.session_type ?? 'presentation')
  const [soumissionId, setSoumissionId] = useState(slot?.soumission_id ?? 'none')
  const [order, setOrder] = useState(slot?.order ?? 0)

  const { data: availableData } = useQuery({
    queryKey: ['available-soumissions'],
    queryFn: () => programApi.adminListAvailableSoumissions(),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      slot
        ? programApi.adminUpdateSlot(slot.id, data)
        : programApi.adminCreateSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-program-slots'] })
      onOpenChange(false)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      location,
      session_type: sessionType,
      soumission_id: soumissionId === 'none' ? undefined : soumissionId,
      order,
    })
  }

  const availableSoumissions: Soumission[] = availableData?.data?.data ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{slot ? 'Modifier le créneau' : 'Nouveau créneau'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select value={sessionType} onValueChange={setSessionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(sessionTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lieu / Salle</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Communication associée</label>
            <Select value={soumissionId} onValueChange={setSoumissionId}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune</SelectItem>
                {availableSoumissions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.document_title} - {s.author_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
            <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {slot ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminProgramPage() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<ProgramSlot | null>(null)
  const [dateFilter, setDateFilter] = useState('')

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['admin-program-slots', dateFilter],
    queryFn: () => programApi.adminListSlots(),
  })

  const { data: datesData } = useQuery({
    queryKey: ['admin-program-dates'],
    queryFn: () => programApi.adminListDates(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programApi.adminDeleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-program-slots'] })
      queryClient.invalidateQueries({ queryKey: ['admin-program-dates'] })
    },
  })

  const slots: ProgramSlot[] = slotsData?.data?.data ?? []
  const dates: string[] = datesData?.data?.data ?? []

  const filteredSlots = dateFilter
    ? slots.filter((s) => s.date === dateFilter)
    : slots

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Programme scientifique"
        title="Programmation"
        description="Structurez les sessions, associez les communications acceptées et publiez un agenda lisible pour les participants."
        actions={
        <Button onClick={() => { setEditingSlot(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" />
          Nouveau créneau
        </Button>
        }
      />

      {dates.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={dateFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('')}
          >
            Tous
          </Button>
          {dates.map((d) => (
            <Button
              key={d}
              variant={dateFilter === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter(d)}
            >
              {d}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <LoadingState />
      ) : filteredSlots.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-7 w-7" />}
          title="Aucun créneau programmé"
          description="Créez les premières sessions pour construire l'agenda public du congrès."
        />
      ) : (
        <div className="space-y-3">
          {filteredSlots.map((slot) => (
            <Card key={slot.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center bg-primary-50 rounded-lg px-3 py-1.5 min-w-[60px]">
                      <span className="text-xs text-gray-500">{slot.date}</span>
                      <span className="text-sm font-bold text-primary-700">{slot.start_time}</span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{slot.title}</CardTitle>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.start_time} - {slot.end_time}
                        </span>
                        {slot.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {slot.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={sessionTypeColors[slot.session_type]}>
                      {sessionTypeLabels[slot.session_type]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingSlot(slot); setDialogOpen(true) }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => deleteMutation.mutate(slot.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {slot.soumission && (
                <CardContent className="pt-0 pb-3">
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-2">
                    <span className="font-medium">{slot.soumission.document_title}</span>
                    <span className="mx-2">·</span>
                    <span>{slot.soumission.author_name}</span>
                    <span className="mx-2">·</span>
                    <Badge variant="outline" className="text-xs">{slot.soumission.submission_type}</Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <SlotFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        slot={editingSlot}
      />
    </div>
  )
}
