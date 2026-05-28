import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Info, Users } from "lucide-react";
import { virtualApi } from "@/lib/api";
import { VirtualSession } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useRef, useEffect } from "react";

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || "meet.jit.si";

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

function JitsiIframe({
    session,
    userName,
}: {
    session: VirtualSession;
    userName: string;
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const roomName = encodeURIComponent(session.room_name);
    const config = encodeURIComponent(
        JSON.stringify({
            subject: session.title,
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
            startWithVideoMuted: true,
        }),
    );
    const interfaceConfig = encodeURIComponent(
        JSON.stringify({
            filmStripOnly: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_ALWAYS_VISIBLE: true,
        }),
    );

    const iframeUrl =
        `https://${JITSI_DOMAIN}/${roomName}` +
        `#config.subject=${config}` +
        `&userInfo.displayName="${encodeURIComponent(userName)}"` +
        `&config=${config}` +
        `&interfaceConfig=${interfaceConfig}`;

    return (
        <iframe
            ref={iframeRef}
            src={iframeUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0 rounded-lg min-h-[500px]"
            title="Salle virtuelle vidéo"
        />
    );
}

export function VirtualRoom() {
    const { id: sessionId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const user = useAuthStore((s) => s.user);

    const { data: sessionData, isLoading } = useQuery({
        queryKey: ["virtual-session", sessionId],
        queryFn: () => virtualApi.getSession(sessionId!),
        enabled: !!sessionId,
    });

    const joinMutation = useMutation({
        mutationFn: () => virtualApi.joinSession(sessionId!),
    });

    const leaveMutation = useMutation({
        mutationFn: () => virtualApi.leaveSession(sessionId!),
    });

    const session: VirtualSession | undefined = sessionData?.data?.data;

    useEffect(() => {
        if (session?.status === "live" || session?.status === "scheduled") {
            joinMutation.mutate();
        }
    }, [session?.id]);

    const handleLeave = () => {
        leaveMutation.mutate();
        navigate(-1);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-gray-500">Session introuvable</p>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Retour
                </Button>
            </div>
        );
    }

    const isLive = session.status === "live";
    const userName = user ? `${user.prenom} ${user.nom}` : "Invité";

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-white shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="font-semibold text-gray-900">
                            {session.title}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {formatDate(session.start_time)} -{" "}
                            {session.status === "live"
                                ? "En direct"
                                : "Planifié"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge className={statusColors[session.status]}>
                        {statusLabels[session.status]}
                    </Badge>
                    {isLive && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleLeave}
                        >
                            Quitter
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex gap-4 p-4 min-h-0">
                <div className="flex-1 min-w-0 bg-gray-900 rounded-lg overflow-hidden">
                    <JitsiIframe session={session} userName={userName} />
                </div>

                <Card className="w-72 shrink-0 hidden lg:block">
                    <CardContent className="p-4 space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" /> Détails
                            </h3>
                            <p className="text-sm text-gray-600">
                                {session.description || "Aucune description"}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(session.start_time)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                                <Users className="h-4 w-4" />
                                <span>
                                    Max {session.max_participants} participants
                                </span>
                            </div>
                        </div>

                        {session.password && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-xs font-medium text-amber-800">
                                    Mot de passe requis
                                </p>
                                <p className="text-sm font-mono text-amber-700 mt-1">
                                    {session.password}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
