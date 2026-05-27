import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2, Check, ClipboardList } from 'lucide-react'
import { reviewGridApi } from '@/lib/api'
import { ReviewGrid, ReviewCriterion } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdminReviewGridsPage() {
  const queryClient = useQueryClient()
  const [newGridName, setNewGridName] = useState('')
  const [editingGrid, setEditingGrid] = useState<string | null>(null)
  const [criteriaInputs, setCriteriaInputs] = useState<Record<string, { name: string; max_score: number; weight: number; sort_order: number }[]>>({})

  const { data: gridsData, isLoading } = useQuery({
    queryKey: ['admin-review-grids'],
    queryFn: async () => (await reviewGridApi.list()).data.data as ReviewGrid[],
  })

  const grids = gridsData ?? []

  const createGrid = useMutation({
    mutationFn: (data: { name: string }) => reviewGridApi.create(data),
    onSuccess: () => {
      setNewGridName('')
      queryClient.invalidateQueries({ queryKey: ['admin-review-grids'] })
    },
  })

  const deleteGrid = useMutation({
    mutationFn: (id: string) => reviewGridApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-review-grids'] }),
  })

  const activateGrid = useMutation({
    mutationFn: (id: string) => reviewGridApi.update(id, { is_active: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-review-grids'] }),
  })

  const addCriterion = useMutation({
    mutationFn: ({ gridId, data }: { gridId: string; data: Record<string, unknown> }) =>
      reviewGridApi.createCriterion(gridId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-review-grids'] }),
  })

  const deleteCriterion = useMutation({
    mutationFn: ({ gridId, criterionId }: { gridId: string; criterionId: string }) =>
      reviewGridApi.deleteCriterion(gridId, criterionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-review-grids'] }),
  })

  const toggleEditGrid = (gridId: string, criteria?: ReviewCriterion[]) => {
    if (editingGrid === gridId) {
      setEditingGrid(null)
      return
    }
    setEditingGrid(gridId)
    setCriteriaInputs((prev) => ({
      ...prev,
      [gridId]: criteria?.map((c) => ({
        name: c.name,
        max_score: c.max_score,
        weight: c.weight,
        sort_order: c.sort_order,
      })) ?? [],
    }))
  }

  const addCriterionInput = (gridId: string) => {
    setCriteriaInputs((prev) => ({
      ...prev,
      [gridId]: [...(prev[gridId] ?? []), { name: '', max_score: 10, weight: 1.0, sort_order: (prev[gridId]?.length ?? 0) + 1 }],
    }))
  }

  const updateCriterionInput = (gridId: string, index: number, field: string, value: unknown) => {
    setCriteriaInputs((prev) => {
      const list = [...(prev[gridId] ?? [])]
      list[index] = { ...list[index], [field]: value }
      return { ...prev, [gridId]: list }
    })
  }

  const saveCriteria = (gridId: string) => {
    const inputs = criteriaInputs[gridId] ?? []
    inputs.forEach((input, i) => {
      if (input.name.trim()) {
        addCriterion.mutate({
          gridId,
          data: { name: input.name.trim(), max_score: input.max_score, weight: input.weight, sort_order: i + 1 },
        })
      }
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-16 text-gray-400">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grilles de relecture</h1>
        <p className="text-gray-500 text-sm mt-1">Créez et gérez les grilles d'évaluation pour les relecteurs</p>
      </div>

      {/* Create Grid */}
      <div className="flex items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 space-y-1.5">
          <Label>Nouvelle grille</Label>
          <Input
            value={newGridName}
            onChange={(e) => setNewGridName(e.target.value)}
            placeholder="Ex: Grille d'évaluation standard"
          />
        </div>
        <Button onClick={() => createGrid.mutate({ name: newGridName })} disabled={!newGridName.trim()}>
          <Plus className="h-4 w-4 mr-2" /> Créer
        </Button>
      </div>

      {/* Grids List */}
      {grids.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune grille de relecture créée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grids.map((grid) => (
            <div key={grid.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Grid Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{grid.name}</h3>
                  <Badge variant={grid.is_active ? 'success' : 'secondary'}>
                    {grid.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!grid.is_active && (
                    <Button size="sm" variant="outline" onClick={() => activateGrid.mutate(grid.id)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Activer
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => toggleEditGrid(grid.id, grid.criteria)}>
                    <ClipboardList className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteGrid.mutate(grid.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Criteria List */}
              {editingGrid === grid.id && (
                <div className="p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700">Critères d'évaluation</h4>

                  {grid.criteria && grid.criteria.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Critère</TableHead>
                          <TableHead>Note max</TableHead>
                          <TableHead>Coefficient</TableHead>
                          <TableHead className="w-20">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grid.criteria.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>{c.max_score}</TableCell>
                            <TableCell>{c.weight}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="ghost" className="text-red-500"
                                onClick={() => deleteCriterion.mutate({ gridId: grid.id, criterionId: c.id })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Add criteria inputs */}
                  <div className="space-y-2">
                    {(criteriaInputs[grid.id] ?? []).map((input, i) => (
                      <div key={i} className="grid grid-cols-[1fr_120px_100px_40px] gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">Critère</Label>
                          <Input value={input.name} onChange={(e) => updateCriterionInput(grid.id, i, 'name', e.target.value)} placeholder="Ex: Pertinence" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Note max</Label>
                          <Input type="number" value={input.max_score} onChange={(e) => updateCriterionInput(grid.id, i, 'max_score', parseInt(e.target.value) || 10)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Coef.</Label>
                          <Input type="number" step="0.1" value={input.weight} onChange={(e) => updateCriterionInput(grid.id, i, 'weight', parseFloat(e.target.value) || 1)} />
                        </div>
                        <Button size="sm" variant="ghost" className="text-red-500"
                          onClick={() => {
                            const list = criteriaInputs[grid.id]?.filter((_, idx) => idx !== i) ?? []
                            setCriteriaInputs((prev) => ({ ...prev, [grid.id]: list }))
                          }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => addCriterionInput(grid.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un critère
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => saveCriteria(grid.id)}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Enregistrer les critères
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
