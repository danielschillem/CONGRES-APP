import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, Tag, ArrowLeft } from "lucide-react";
import { soumissionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_RESUME_LENGTH = 1000;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const soumissionSchema = z.object({
    submission_type: z.enum(["Abstract", "Poster", "Communication"], {
        required_error: "Le type de soumission est requis",
    }),
    theme: z.string().min(3, "Le thème doit comporter au moins 3 caractères"),
    topics: z
        .string()
        .min(3, "Les sujets doivent comporter au moins 3 caractères"),
    document_title: z
        .string()
        .min(5, "Le titre doit comporter au moins 5 caractères"),
    author_name: z.string().min(3, "Le nom de l'auteur est requis"),
    resume: z
        .string()
        .min(50, "Le résumé doit comporter au moins 50 caractères")
        .max(
            MAX_RESUME_LENGTH,
            `Le résumé ne peut pas dépasser ${MAX_RESUME_LENGTH} caractères`,
        ),
});

type SoumissionFormData = z.infer<typeof soumissionSchema>;

export function SoumissionFormPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams<{ id: string }>();
    const isEditMode =
        Boolean(id) && !window.location.pathname.includes("nouveau");
    const editId = isEditMode ? id : undefined;

    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load existing data in edit mode
    const { data: existingData, isLoading: loadingExisting } = useQuery({
        queryKey: ["soumission", editId],
        queryFn: async () => {
            const response = await soumissionsApi.getOne(editId!);
            return response.data.data;
        },
        enabled: Boolean(editId),
    });

    const {
        register,
        handleSubmit,
        control,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SoumissionFormData>({
        resolver: zodResolver(soumissionSchema),
    });

    const resumeValue = watch("resume", "");

    useEffect(() => {
        if (existingData) {
            reset({
                submission_type: existingData.submission_type,
                theme: existingData.theme,
                topics: existingData.topics,
                document_title: existingData.document_title,
                author_name: existingData.author_name,
                resume: existingData.resume,
            });
            setKeywords(
                Array.isArray(existingData.keywords)
                    ? existingData.keywords
                    : JSON.parse(existingData.keywords || "[]"),
            );
        }
    }, [existingData, reset]);

    const createMutation = useMutation({
        mutationFn: (formData: FormData) => soumissionsApi.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-soumissions"] });
            navigate("/dashboard");
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            setServerError(
                error?.response?.data?.message ||
                    "Erreur lors de la soumission.",
            );
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
            soumissionsApi.update(id, formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["my-soumissions"] });
            queryClient.invalidateQueries({ queryKey: ["soumission", editId] });
            navigate("/dashboard");
        },
        onError: (err: unknown) => {
            const error = err as { response?: { data?: { message?: string } } };
            setServerError(
                error?.response?.data?.message ||
                    "Erreur lors de la mise à jour.",
            );
        },
    });

    const handleKeywordKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const trimmed = keywordInput.trim().replace(/,$/, "");
            if (trimmed && !keywords.includes(trimmed)) {
                setKeywords([...keywords, trimmed]);
            }
            setKeywordInput("");
        }
        if (
            e.key === "Backspace" &&
            keywordInput === "" &&
            keywords.length > 0
        ) {
            setKeywords(keywords.slice(0, -1));
        }
    };

    const removeKeyword = (kw: string) => {
        setKeywords(keywords.filter((k) => k !== kw));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        setFileError(null);
        if (!selected) return;
        if (selected.type !== "application/pdf") {
            setFileError("Seuls les fichiers PDF sont acceptés.");
            return;
        }
        if (selected.size > MAX_FILE_SIZE) {
            setFileError("Le fichier ne doit pas dépasser 50 Mo.");
            return;
        }
        setFile(selected);
    };

    const onSubmit = async (data: SoumissionFormData) => {
        setServerError(null);
        if (!editId && !file) {
            setFileError("Le fichier PDF est requis.");
            return;
        }

        const formData = new FormData();
        formData.append("submission_type", data.submission_type);
        formData.append("theme", data.theme);
        formData.append("topics", data.topics);
        formData.append("document_title", data.document_title);
        formData.append("author_name", data.author_name);
        formData.append("resume", data.resume);
        formData.append("keywords", JSON.stringify(keywords));
        if (file) formData.append("file", file);

        if (editId) {
            updateMutation.mutate({ id: editId, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    if (loadingExisting) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-400">
                Chargement...
            </div>
        );
    }

    const isPending =
        isSubmitting || createMutation.isPending || updateMutation.isPending;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {editId
                            ? "Modifier la soumission"
                            : "Nouvelle soumission"}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {editId
                            ? "Modifiez les informations de votre soumission"
                            : "Remplissez le formulaire pour soumettre votre travail"}
                    </p>
                </div>
            </div>

            {serverError && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
                    {serverError}
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-6"
                noValidate
            >
                {/* Type + Thème */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Informations générales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Type de soumission *</Label>
                            <Controller
                                name="submission_type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <SelectTrigger
                                            error={
                                                errors.submission_type?.message
                                            }
                                        >
                                            <SelectValue placeholder="Sélectionner un type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Abstract">
                                                Abstract
                                            </SelectItem>
                                            <SelectItem value="Poster">
                                                Poster
                                            </SelectItem>
                                            <SelectItem value="Communication">
                                                Communication
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="theme">Thème *</Label>
                            <Input
                                id="theme"
                                placeholder="Ex: Intelligence Artificielle en médecine"
                                error={errors.theme?.message}
                                {...register("theme")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="topics">Sujets / Topics *</Label>
                            <Input
                                id="topics"
                                placeholder="Ex: Machine Learning, Deep Learning, NLP"
                                error={errors.topics?.message}
                                {...register("topics")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Titre + Auteur */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Document</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="document_title">
                                Titre du document *
                            </Label>
                            <Input
                                id="document_title"
                                placeholder="Titre complet de votre soumission"
                                error={errors.document_title?.message}
                                {...register("document_title")}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="author_name">
                                Nom de l'auteur *
                            </Label>
                            <Input
                                id="author_name"
                                placeholder="Prénom Nom"
                                error={errors.author_name?.message}
                                {...register("author_name")}
                            />
                        </div>

                        {/* Résumé */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="resume">Résumé *</Label>
                                <span
                                    className={`text-xs ${
                                        (resumeValue?.length ?? 0) >
                                        MAX_RESUME_LENGTH
                                            ? "text-red-500"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {resumeValue?.length ?? 0} /{" "}
                                    {MAX_RESUME_LENGTH}
                                </span>
                            </div>
                            <Textarea
                                id="resume"
                                placeholder="Résumé de votre travail (max 1000 caractères)..."
                                rows={6}
                                error={errors.resume?.message}
                                {...register("resume")}
                            />
                        </div>

                        {/* Mots-clés */}
                        <div className="space-y-1.5">
                            <Label>Mots-clés</Label>
                            <div className="flex min-h-[42px] flex-wrap gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2">
                                {keywords.map((kw) => (
                                    <span
                                        key={kw}
                                        className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {kw}
                                        <button
                                            type="button"
                                            title="Supprimer le mot-clé"
                                            onClick={() => removeKeyword(kw)}
                                            className="ml-0.5 text-primary-500 hover:text-primary-700"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                                <label
                                    htmlFor="keyword-input"
                                    className="sr-only"
                                >
                                    Ajouter un mot-clé
                                </label>
                                <input
                                    id="keyword-input"
                                    type="text"
                                    value={keywordInput}
                                    onChange={(e) =>
                                        setKeywordInput(e.target.value)
                                    }
                                    onKeyDown={handleKeywordKeyDown}
                                    placeholder={
                                        keywords.length === 0
                                            ? "Tapez un mot-clé et appuyez sur Entrée..."
                                            : ""
                                    }
                                    title="Ajouter un mot-clé"
                                    className="flex-1 min-w-[150px] border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                Appuyez sur Entrée ou virgule pour ajouter un
                                mot-clé
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Fichier */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fichier PDF</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div
                            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 text-gray-400" />
                            {file ? (
                                <div className="text-center">
                                    <div className="flex items-center gap-2 text-sm font-medium text-primary-600">
                                        <FileText className="h-4 w-4" />
                                        {file.name}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {(file.size / 1024 / 1024).toFixed(2)}{" "}
                                        Mo
                                    </p>
                                </div>
                            ) : editId && existingData?.file_path ? (
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        Fichier actuel
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {existingData.file_path
                                            .split("/")
                                            .pop()}
                                    </p>
                                    <p className="text-xs text-primary-500 mt-1">
                                        Cliquez pour remplacer
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm font-medium text-gray-700">
                                        Glissez votre fichier ici ou cliquez
                                        pour parcourir
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        PDF uniquement - max 50 Mo
                                    </p>
                                </div>
                            )}
                            <label htmlFor="file-upload" className="sr-only">
                                Sélectionner un fichier PDF
                            </label>
                            <input
                                id="file-upload"
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                title="Sélectionner un fichier PDF"
                            />
                        </div>
                        {fileError && (
                            <p className="mt-2 text-xs text-red-500">
                                {fileError}
                            </p>
                        )}
                        {!editId && (
                            <p className="mt-1.5 text-xs text-gray-400">
                                * Le fichier PDF est obligatoire pour une
                                nouvelle soumission.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                    >
                        Annuler
                    </Button>
                    <Button type="submit" loading={isPending}>
                        {isPending
                            ? editId
                                ? "Enregistrement..."
                                : "Soumission en cours..."
                            : editId
                              ? "Enregistrer les modifications"
                              : "Soumettre"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
