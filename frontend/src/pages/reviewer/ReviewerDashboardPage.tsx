import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewerApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle2, Eye, Star, ClipboardList } from "lucide-react";
import type { Review, ReviewGrid, CriterionScore } from "@/types";

const statusLabels: Record<string, string> = {
    assigned: "Assigné",
    in_progress: "En cours",
    completed: "Terminé",
};

const statusColors: Record<string, string> = {
    assigned: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
};

export function ReviewerDashboardPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("");
    const [reviewStates, setReviewStates] = useState<
        Record<
            string,
            {
                scores: Record<string, number>;
                comment: string;
            }
        >
    >({});

    const { data: assignmentsData, isLoading } = useQuery({
        queryKey: ["reviewer-assignments", statusFilter],
        queryFn: () =>
            reviewerApi.getAssignments(
                statusFilter ? { status: statusFilter } : undefined,
            ),
    });

    // Load active review grid
    const { data: gridData } = useQuery({
        queryKey: ["reviewer-active-grid"],
        queryFn: async () =>
            (await reviewerApi.getActiveReviewGrid()).data
                .data as ReviewGrid | null,
    });

    const grid = gridData ?? null;

    const startReviewMutation = useMutation({
        mutationFn: (id: string) => reviewerApi.startReview(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reviewer-assignments"],
            });
        },
    });

    const submitReviewMutation = useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: {
                scores: { criterion_id: string; score: number }[];
                comment: string;
            };
        }) => reviewerApi.submitReview(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["reviewer-assignments"],
            });
        },
    });

    const assignments: Review[] = assignmentsData?.data?.data ?? [];

    const handleStartReview = (id: string) => {
        startReviewMutation.mutate(id);
    };

    const handleSubmitReview = (id: string) => {
        const state = reviewStates[id];
        if (!state) return;

        const scores =
            grid?.criteria?.map((c) => ({
                criterion_id: c.id,
                score: state.scores[c.id] ?? 0,
            })) ?? [];

        if (scores.length === 0 || !state.comment) return;
        submitReviewMutation.mutate({
            id,
            data: { scores, comment: state.comment },
        });
    };

    const initReviewState = (reviewId: string) => {
        if (!reviewStates[reviewId] && grid?.criteria) {
            const scores: Record<string, number> = {};
            grid.criteria.forEach((c) => {
                scores[c.id] = 0;
            });
            setReviewStates((prev) => ({
                ...prev,
                [reviewId]: { scores, comment: "" },
            }));
        }
    };

    const parseScores = (scores: unknown): CriterionScore[] => {
        if (!scores) return [];
        if (typeof scores === "string") {
            try {
                return JSON.parse(scores);
            } catch {
                return [];
            }
        }
        if (Array.isArray(scores)) return scores as CriterionScore[];
        return [];
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    Tableau de bord Reviewer
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Gérez vos évaluations de soumissions
                </p>
            </div>

            {/* Active grid info */}
            {grid && (
                <Card className="bg-primary-50 border-primary-200">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-sm text-primary-800">
                            <ClipboardList className="h-4 w-4" />
                            <span className="font-medium">
                                Grille active :
                            </span>{" "}
                            {grid.name}
                            <span className="text-primary-500">
                                ({grid.criteria?.length ?? 0} critères)
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {["", "assigned", "in_progress", "completed"].map((s) => (
                    <Button
                        key={s}
                        variant={statusFilter === s ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === "" ? "Tous" : statusLabels[s]}
                    </Button>
                ))}
            </div>

            {isLoading ? (
                <p className="text-gray-500">Chargement...</p>
            ) : assignments.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-gray-500">
                        <FileText className="mx-auto h-12 w-12 mb-4 opacity-40" />
                        <p>Aucune assignation pour le moment</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((review) => {
                        const state = reviewStates[review.id] ?? {
                            scores: {},
                            comment: "",
                        };
                        const isCompleted = review.status === "completed";
                        const reviewScores = parseScores(review.scores);

                        return (
                            <Card key={review.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base">
                                                {review.soumission
                                                    ?.document_title ??
                                                    "Soumission"}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>
                                                    {
                                                        review.soumission
                                                            ?.author_name
                                                    }
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {
                                                        review.soumission
                                                            ?.submission_type
                                                    }
                                                </span>
                                                <span>·</span>
                                                <span>
                                                    {review.soumission?.theme}
                                                </span>
                                            </div>
                                        </div>
                                        <Badge
                                            className={
                                                statusColors[review.status]
                                            }
                                        >
                                            {statusLabels[review.status]}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {isCompleted ? (
                                        <div className="space-y-3">
                                            {reviewScores.length > 0 ? (
                                                <div className="space-y-1">
                                                    {reviewScores.map(
                                                        (cs, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center gap-2 text-sm"
                                                            >
                                                                <span className="text-gray-600 w-40">
                                                                    {
                                                                        cs.criterion_name
                                                                    }
                                                                </span>
                                                                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                                                <span className="font-semibold">
                                                                    {cs.score}/
                                                                    {
                                                                        cs.max_score
                                                                    }
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                    <div className="flex items-center gap-2 text-sm pt-1 border-t border-gray-100 mt-1">
                                                        <span className="font-medium text-gray-700">
                                                            Note globale :
                                                        </span>
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-semibold">
                                                            {review.overall_score?.toFixed(
                                                                1,
                                                            ) ??
                                                                review.overall_score}
                                                            /10
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="font-semibold">
                                                        {review.overall_score}
                                                        /10
                                                    </span>
                                                </div>
                                            )}
                                            {review.comment && (
                                                <p className="text-gray-600 italic text-sm">
                                                    "{review.comment}"
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {review.status === "assigned" ? (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        handleStartReview(
                                                            review.id,
                                                        );
                                                        if (grid?.criteria)
                                                            initReviewState(
                                                                review.id,
                                                            );
                                                    }}
                                                    disabled={
                                                        startReviewMutation.isPending
                                                    }
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Commencer l'évaluation
                                                </Button>
                                            ) : (
                                                <>
                                                    {/* Per-criterion scoring */}
                                                    {grid?.criteria &&
                                                        grid.criteria.length >
                                                            0 && (
                                                            <div className="space-y-3">
                                                                <h4 className="text-sm font-semibold text-gray-700">
                                                                    Critères
                                                                    d'évaluation
                                                                </h4>
                                                                {grid.criteria.map(
                                                                    (
                                                                        criterion,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                criterion.id
                                                                            }
                                                                            className="grid grid-cols-[1fr_120px] gap-4 items-center max-w-md"
                                                                        >
                                                                            <div>
                                                                                <Label className="text-sm">
                                                                                    {
                                                                                        criterion.name
                                                                                    }
                                                                                </Label>
                                                                                {criterion.description && (
                                                                                    <p className="text-xs text-gray-400">
                                                                                        {
                                                                                            criterion.description
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <input
                                                                                    type="number"
                                                                                    min={
                                                                                        0
                                                                                    }
                                                                                    max={
                                                                                        criterion.max_score
                                                                                    }
                                                                                    className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                                                    value={
                                                                                        state
                                                                                            .scores[
                                                                                            criterion
                                                                                                .id
                                                                                        ] ??
                                                                                        0
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) => {
                                                                                        const val =
                                                                                            parseInt(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                            0;
                                                                                        setReviewStates(
                                                                                            (
                                                                                                prev,
                                                                                            ) => ({
                                                                                                ...prev,
                                                                                                [review.id]:
                                                                                                    {
                                                                                                        ...(prev[
                                                                                                            review
                                                                                                                .id
                                                                                                        ] ?? {
                                                                                                            scores: {},
                                                                                                            comment:
                                                                                                                "",
                                                                                                        }),
                                                                                                        scores: {
                                                                                                            ...(prev[
                                                                                                                review
                                                                                                                    .id
                                                                                                            ]
                                                                                                                ?.scores ??
                                                                                                                {}),
                                                                                                            [criterion.id]:
                                                                                                                Math.min(
                                                                                                                    val,
                                                                                                                    criterion.max_score,
                                                                                                                ),
                                                                                                        },
                                                                                                    },
                                                                                            }),
                                                                                        );
                                                                                    }}
                                                                                    title={`Score pour ${criterion.label}`}
                                                                                    placeholder={`Score (max ${criterion.max_score})`}
                                                                                />
                                                                                <span className="text-xs text-gray-400">
                                                                                    /{" "}
                                                                                    {
                                                                                        criterion.max_score
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}

                                                    {/* Overall score input (fallback if no grid) */}
                                                    {(!grid ||
                                                        !grid.criteria ||
                                                        grid.criteria.length ===
                                                            0) && (
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-sm font-medium">
                                                                Note /10 :
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={10}
                                                                className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
                                                                title="Note sur 10"
                                                                placeholder="Note sur 10"
                                                                value={
                                                                    state
                                                                        .scores[
                                                                        "overall"
                                                                    ] ?? 0
                                                                }
                                                                onChange={(e) =>
                                                                    setReviewStates(
                                                                        (
                                                                            prev,
                                                                        ) => ({
                                                                            ...prev,
                                                                            [review.id]:
                                                                                {
                                                                                    scores: {
                                                                                        overall:
                                                                                            parseInt(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                            0,
                                                                                    },
                                                                                    comment:
                                                                                        prev[
                                                                                            review
                                                                                                .id
                                                                                        ]
                                                                                            ?.comment ??
                                                                                        "",
                                                                                },
                                                                        }),
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Comment */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Commentaire :
                                                        </label>
                                                        <Textarea
                                                            placeholder="Votre évaluation détaillée..."
                                                            value={
                                                                state.comment
                                                            }
                                                            onChange={(e) =>
                                                                setReviewStates(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [review.id]:
                                                                            {
                                                                                ...(prev[
                                                                                    review
                                                                                        .id
                                                                                ] ?? {
                                                                                    scores: {},
                                                                                }),
                                                                                comment:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                    }),
                                                                )
                                                            }
                                                            rows={4}
                                                        />
                                                    </div>

                                                    {/* Submit */}
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleSubmitReview(
                                                                review.id,
                                                            )
                                                        }
                                                        disabled={
                                                            submitReviewMutation.isPending ||
                                                            !state.comment
                                                        }
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                                        Soumettre l'évaluation
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
