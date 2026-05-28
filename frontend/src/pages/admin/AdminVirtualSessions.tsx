import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    CalendarDays,
    Eye,
    MoreHorizontal,
    Play,
    Plus,
    Square,
    Trash2,
    Video,
} from "lucide-react";
import { virtualApi } from "@/lib/api";
import {
    CreateSessionPayload,
    VirtualAttendance,
    VirtualSession,
} from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";

const typeLabels: Record<string, string> = {
    plenary: "Plénière",
    workshop: "Atelier",
    presentation: "Présentation",
    breakout: "Breakout",
};

const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    live: "bg-green-100 text-green-700",
    ended: "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
    scheduled: "Planifiée",
    live: "En direct",
    ended: "Terminée",
    cancelled: "Annulée",
};

interface SessionFormProps {
    initial?: Partial<CreateSessionPayload>;
    onSubmit: (data: CreateSessionPayload) => void;
    onCancel: () => void;
}

function SessionForm({ initial, onSubmit, onCancel }: SessionFormProps) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [sessionType, setSessionType] = useState(
        initial?.session_type ?? "presentation",
    );
    const [startTime, setStartTime] = useState(initial?.start_time ?? "");
    const [endTime, setEndTime] = useState(initial?.end_time ?? "");
    const [password, setPassword] = useState(initial?.password ?? "");
    const [maxParticipants, setMaxParticipants] = useState(
        initial?.max_participants ?? 50,
    );
    const [recordingEnabled, setRecordingEnabled] = useState(
        initial?.recording_enabled ?? false,
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            session_type: sessionType,
            start_time: startTime,
            end_time: endTime,
            password: password || undefined,
            max_participants: maxParticipants,
            recording_enabled: recordingEnabled,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="title">Titre</Label>
                <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <div>
                <Label htmlFor="type">Type</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="plenary">Plénière</SelectItem>
                        <SelectItem value="workshop">Atelier</SelectItem>
                        <SelectItem value="presentation">
                            Présentation
                        </SelectItem>
                        <SelectItem value="breakout">Breakout</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="start">Début</Label>
                    <Input
                        id="start"
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="end">Fin</Label>
                    <Input
                        id="end"
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="password">Mot de passe (optionnel)</Label>
                    <Input
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="max">Participants max</Label>
                    <Input
                        id="max"
                        type="number"
                        value={maxParticipants}
                        onChange={(e) =>
                            setMaxParticipants(Number(e.target.value))
                        }
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="recording"
                    checked={recordingEnabled}
                    onChange={(e) => setRecordingEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                    title="Activer l'enregistrement de la session"
                />
                <Label htmlFor="recording" className="mb-0">
                    Activer l'enregistrement
                </Label>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Annuler
                </Button>
                <Button type="submit">{initial ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
        </form>
    );
}

function AttendanceDialog({
    sessionId,
    open,
    onClose,
}: {
    sessionId: string;
    open: boolean;
    onClose: () => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ["attendance", sessionId],
        queryFn: () => virtualApi.adminGetAttendance(sessionId),
        enabled: open,
    });

    const attendance: VirtualAttendance[] = data?.data?.data ?? [];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Présences</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-4 border-primary-600 border-t-transparent rounded-full" />
                    </div>
                ) : attendance.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        Aucune présence enregistrée
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Utilisateur</TableHead>
                                <TableHead>Arrivée</TableHead>
                                <TableHead>Départ</TableHead>
                                <TableHead>Durée (s)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attendance.map((a) => (
                                <TableRow key={a.id}>
                                    <TableCell>
                                        {a.user
                                            ? `${a.user.prenom} ${a.user.nom}`
                                            : a.user_id}
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(a.join_time)}
                                    </TableCell>
                                    <TableCell>
                                        {a.leave_time
                                            ? formatDate(a.leave_time)
                                            : "-"}
                                    </TableCell>
                                    <TableCell>{a.duration}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function AdminVirtualSessions() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [editSession, setEditSession] = useState<VirtualSession | null>(null);
    const [attendanceSessionId, setAttendanceSessionId] = useState<
        string | null
    >(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-virtual-sessions"],
        queryFn: () => virtualApi.adminListSessions(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateSessionPayload) =>
            virtualApi.adminCreateSession(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["admin-virtual-sessions"],
            });
            setShowCreate(false);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: object }) =>
            virtualApi.adminUpdateSession(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["admin-virtual-sessions"],
            });
            setEditSession(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => virtualApi.adminDeleteSession(id),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ["admin-virtual-sessions"],
            }),
    });

    const startMutation = useMutation({
        mutationFn: (id: string) => virtualApi.adminStartSession(id),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ["admin-virtual-sessions"],
            }),
    });

    const endMutation = useMutation({
        mutationFn: (id: string) => virtualApi.adminEndSession(id),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: ["admin-virtual-sessions"],
            }),
    });

    const sessions: VirtualSession[] = data?.data?.data ?? [];

    const handleCreate = (data: CreateSessionPayload) => {
        createMutation.mutate(data);
    };

    const handleUpdate = (data: CreateSessionPayload) => {
        if (!editSession) return;
        updateMutation.mutate({ id: editSession.id, data });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Sessions virtuelles
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Gérez les sessions de visioconférence
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Nouvelle session
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Toutes les sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
                        </div>
                    ) : sessions.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-gray-400">
                            <Video className="h-12 w-12 mb-4" />
                            <p>Aucune session créée</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Titre</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Début</TableHead>
                                    <TableHead>Fin</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead className="w-20">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sessions.map((s) => (
                                    <TableRow key={s.id}>
                                        <TableCell className="font-medium">
                                            {s.title}
                                        </TableCell>
                                        <TableCell>
                                            {typeLabels[s.session_type] ||
                                                s.session_type}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    statusColors[s.status]
                                                }
                                            >
                                                {statusLabels[s.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(s.start_time)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDate(s.end_time)}
                                        </TableCell>
                                        <TableCell>
                                            {s.max_participants}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setEditSession(s)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />{" "}
                                                        Modifier
                                                    </DropdownMenuItem>
                                                    {s.status ===
                                                        "scheduled" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                startMutation.mutate(
                                                                    s.id,
                                                                )
                                                            }
                                                        >
                                                            <Play className="h-4 w-4 mr-2" />{" "}
                                                            Démarrer
                                                        </DropdownMenuItem>
                                                    )}
                                                    {s.status === "live" && (
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                endMutation.mutate(
                                                                    s.id,
                                                                )
                                                            }
                                                        >
                                                            <Square className="h-4 w-4 mr-2" />{" "}
                                                            Terminer
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            setAttendanceSessionId(
                                                                s.id,
                                                            )
                                                        }
                                                    >
                                                        <CalendarDays className="h-4 w-4 mr-2" />{" "}
                                                        Présences
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => {
                                                            if (
                                                                confirm(
                                                                    "Supprimer cette session ?",
                                                                )
                                                            ) {
                                                                deleteMutation.mutate(
                                                                    s.id,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />{" "}
                                                        Supprimer
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nouvelle session virtuelle</DialogTitle>
                    </DialogHeader>
                    <SessionForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={!!editSession}
                onOpenChange={(o) => {
                    if (!o) setEditSession(null);
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier la session</DialogTitle>
                    </DialogHeader>
                    {editSession && (
                        <SessionForm
                            initial={{
                                title: editSession.title,
                                description: editSession.description,
                                session_type: editSession.session_type,
                                start_time: editSession.start_time,
                                end_time: editSession.end_time,
                                password: editSession.password,
                                max_participants: editSession.max_participants,
                                recording_enabled:
                                    editSession.recording_enabled,
                            }}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditSession(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Attendance Dialog */}
            {attendanceSessionId && (
                <AttendanceDialog
                    sessionId={attendanceSessionId}
                    open={!!attendanceSessionId}
                    onClose={() => setAttendanceSessionId(null)}
                />
            )}
        </div>
    );
}
