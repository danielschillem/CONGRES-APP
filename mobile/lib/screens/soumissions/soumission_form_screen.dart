import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../../config/app_config.dart';
import '../../models/soumission.dart';
import '../../providers/soumission_provider.dart';
import '../../utils/validators.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/loading_overlay.dart';

class SoumissionFormScreen extends StatefulWidget {
  final Soumission? soumission; // null = create mode, non-null = edit mode

  const SoumissionFormScreen({super.key, this.soumission});

  @override
  State<SoumissionFormScreen> createState() => _SoumissionFormScreenState();
}

class _SoumissionFormScreenState extends State<SoumissionFormScreen> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _themeController = TextEditingController();
  final _topicsController = TextEditingController();
  final _documentTitleController = TextEditingController();
  final _authorNameController = TextEditingController();
  final _resumeController = TextEditingController();
  final _keywordInputController = TextEditingController();

  // State
  String? _selectedType;
  List<String> _keywords = [];
  File? _selectedFile;
  String? _selectedFileName;
  bool _isUploading = false;

  bool get _isEditMode => widget.soumission != null;

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      _populateFields();
    }
  }

  void _populateFields() {
    final s = widget.soumission!;
    _selectedType = s.submissionType;
    _themeController.text = s.theme;
    _topicsController.text = s.topics;
    _documentTitleController.text = s.documentTitle;
    _authorNameController.text = s.authorName;
    _resumeController.text = s.resume;
    _keywords = List.from(s.keywords);
  }

  @override
  void dispose() {
    _themeController.dispose();
    _topicsController.dispose();
    _documentTitleController.dispose();
    _authorNameController.dispose();
    _resumeController.dispose();
    _keywordInputController.dispose();
    super.dispose();
  }

  Future<void> _pickPdfFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      allowMultiple: false,
    );

    if (result != null && result.files.single.path != null) {
      setState(() {
        _selectedFile = File(result.files.single.path!);
        _selectedFileName = result.files.single.name;
      });
    }
  }

  void _addKeyword() {
    final keyword = _keywordInputController.text.trim();
    if (keyword.isEmpty) return;
    if (_keywords.contains(keyword)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ce mot-clé existe déjà.')),
      );
      return;
    }
    if (_keywords.length >= AppConfig.maxKeywords) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Maximum ${AppConfig.maxKeywords} mots-clés autorisés.'),
        ),
      );
      return;
    }
    setState(() {
      _keywords.add(keyword);
      _keywordInputController.clear();
    });
  }

  void _removeKeyword(String keyword) {
    setState(() => _keywords.remove(keyword));
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_isEditMode && _selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez sélectionner un fichier PDF.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    if (_keywords.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Veuillez ajouter au moins un mot-clé.'),
          backgroundColor: Color(0xFFEF4444),
        ),
      );
      return;
    }

    setState(() => _isUploading = true);

    final provider = context.read<SoumissionProvider>();

    try {
      if (_isEditMode) {
        final updated = await provider.updateSoumission(
          id: widget.soumission!.id,
          submissionType: _selectedType!,
          theme: _themeController.text.trim(),
          topics: _topicsController.text.trim(),
          documentTitle: _documentTitleController.text.trim(),
          authorName: _authorNameController.text.trim(),
          resume: _resumeController.text.trim(),
          keywords: _keywords,
          pdfFile: _selectedFile,
        );

        if (!mounted) return;
        if (updated != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Soumission mise à jour avec succès.'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
          context.pop();
        } else {
          _showError(provider.errorMessage ?? 'Erreur lors de la mise à jour.');
        }
      } else {
        final created = await provider.createSoumission(
          submissionType: _selectedType!,
          theme: _themeController.text.trim(),
          topics: _topicsController.text.trim(),
          documentTitle: _documentTitleController.text.trim(),
          authorName: _authorNameController.text.trim(),
          resume: _resumeController.text.trim(),
          keywords: _keywords,
          pdfFile: _selectedFile!,
        );

        if (!mounted) return;
        if (created != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Soumission créée avec succès!'),
              backgroundColor: Color(0xFF10B981),
            ),
          );
          context.pop();
        } else {
          _showError(provider.errorMessage ?? 'Erreur lors de la création.');
        }
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFFEF4444),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return LoadingOverlay(
      isLoading: _isUploading,
      message: _isEditMode
          ? 'Mise à jour en cours...'
          : 'Envoi de la soumission...',
      child: Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => context.pop(),
          ),
          title: Text(
            _isEditMode ? 'Modifier la soumission' : 'Nouvelle soumission',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Section: Type et informations générales
                _SectionHeader(
                  icon: Icons.category_outlined,
                  title: 'Type de soumission',
                ),
                const SizedBox(height: 12),

                // Type dropdown
                DropdownButtonFormField<String>(
                  value: _selectedType,
                  decoration: InputDecoration(
                    labelText: 'Type de soumission *',
                    prefixIcon: const Icon(Icons.article_outlined),
                    filled: true,
                    fillColor: theme.colorScheme.surfaceContainerHighest
                        .withValues(alpha: 0.3),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.colorScheme.outline.withValues(alpha: 0.5),
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: theme.colorScheme.primary,
                        width: 2,
                      ),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                  items: AppConfig.submissionTypes
                      .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                      .toList(),
                  onChanged: (value) =>
                      setState(() => _selectedType = value),
                  validator: (value) =>
                      Validators.dropdown(value, 'le type de soumission'),
                ),
                const SizedBox(height: 20),

                // Section: Détails du document
                _SectionHeader(
                  icon: Icons.description_outlined,
                  title: 'Détails du document',
                ),
                const SizedBox(height: 12),

                CustomTextField(
                  controller: _documentTitleController,
                  label: 'Titre du document *',
                  hint: 'Titre complet de votre travail',
                  validator: Validators.minLength('Le titre', 5),
                  prefixIcon: const Icon(Icons.title),
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _authorNameController,
                  label: 'Nom de l\'auteur *',
                  hint: 'Prénom et Nom',
                  validator: Validators.nom,
                  prefixIcon: const Icon(Icons.person_outline),
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _themeController,
                  label: 'Thème *',
                  hint: 'Thème principal de votre soumission',
                  validator: Validators.minLength('Le thème', 3),
                  prefixIcon: const Icon(Icons.topic_outlined),
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 16),

                CustomTextField(
                  controller: _topicsController,
                  label: 'Topics / Sujets *',
                  hint: 'Sujets abordés dans votre travail',
                  validator: Validators.minLength('Les topics', 3),
                  prefixIcon: const Icon(Icons.tag),
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 20),

                // Section: Résumé
                _SectionHeader(
                  icon: Icons.summarize_outlined,
                  title: 'Résumé',
                ),
                const SizedBox(height: 12),

                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _resumeController,
                  builder: (context, value, _) {
                    final charCount = value.text.length;
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        CustomTextField(
                          controller: _resumeController,
                          label: 'Résumé *',
                          hint:
                              'Résumez votre travail en 1000 caractères maximum...',
                          maxLines: 6,
                          maxLength: AppConfig.maxResumeLength,
                          validator: Validators.resume,
                        ),
                        if (charCount > 800)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(
                              '$charCount/${AppConfig.maxResumeLength}',
                              style: TextStyle(
                                fontSize: 12,
                                color: charCount >= AppConfig.maxResumeLength
                                    ? const Color(0xFFEF4444)
                                    : const Color(0xFFF59E0B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Section: Mots-clés
                _SectionHeader(
                  icon: Icons.label_outline,
                  title: 'Mots-clés',
                ),
                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        controller: _keywordInputController,
                        label: 'Ajouter un mot-clé',
                        hint: 'Ex: intelligence artificielle',
                        prefixIcon: const Icon(Icons.add_circle_outline),
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _addKeyword(),
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      onPressed: _addKeyword,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Ajouter'),
                    ),
                  ],
                ),

                if (_keywords.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: _keywords.map((kw) {
                      return Chip(
                        label: Text(kw),
                        deleteIcon: const Icon(Icons.close, size: 16),
                        onDeleted: () => _removeKeyword(kw),
                        backgroundColor: theme.colorScheme.primary
                            .withValues(alpha: 0.1),
                        labelStyle: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                        deleteIconColor: theme.colorScheme.primary,
                        side: BorderSide(
                          color: theme.colorScheme.primary.withValues(alpha: 0.3),
                        ),
                      );
                    }).toList(),
                  ),
                ],

                if (_keywords.isEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    'Aucun mot-clé ajouté. Au moins un est requis.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
                const SizedBox(height: 20),

                // Section: Fichier PDF
                _SectionHeader(
                  icon: Icons.picture_as_pdf_outlined,
                  title: 'Fichier PDF',
                ),
                const SizedBox(height: 12),

                Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: theme.colorScheme.outline.withValues(alpha: 0.5),
                    ),
                    borderRadius: BorderRadius.circular(12),
                    color: theme.colorScheme.surfaceContainerHighest
                        .withValues(alpha: 0.2),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Current file in edit mode
                        if (_isEditMode && _selectedFile == null) ...[
                          Row(
                            children: [
                              const Icon(
                                Icons.check_circle,
                                color: Color(0xFF10B981),
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Fichier actuel',
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    Text(
                                      widget.soumission!.filePath
                                          .split('/')
                                          .last,
                                      style:
                                          theme.textTheme.bodyMedium?.copyWith(
                                        fontWeight: FontWeight.w500,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton.icon(
                            onPressed: _pickPdfFile,
                            icon: const Icon(Icons.upload_file_outlined),
                            label: const Text('Remplacer le fichier'),
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ] else ...[
                          // File picker button
                          if (_selectedFile == null)
                            OutlinedButton.icon(
                              onPressed: _pickPdfFile,
                              icon: const Icon(Icons.upload_file_outlined),
                              label: const Text('Sélectionner le fichier PDF'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            )
                          else
                            Row(
                              children: [
                                const Icon(
                                  Icons.picture_as_pdf,
                                  color: Color(0xFFEF4444),
                                  size: 24,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _selectedFileName ?? 'Fichier sélectionné',
                                        style: theme.textTheme.bodyMedium
                                            ?.copyWith(
                                          fontWeight: FontWeight.w500,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        'PDF sélectionné',
                                        style: theme.textTheme.bodySmall
                                            ?.copyWith(
                                          color: const Color(0xFF10B981),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: () => setState(() {
                                    _selectedFile = null;
                                    _selectedFileName = null;
                                  }),
                                  tooltip: 'Supprimer le fichier',
                                ),
                              ],
                            ),

                          if (_selectedFile != null) ...[
                            const SizedBox(height: 10),
                            TextButton.icon(
                              onPressed: _pickPdfFile,
                              icon: const Icon(Icons.swap_horiz, size: 18),
                              label: const Text('Changer de fichier'),
                            ),
                          ],
                        ],

                        if (!_isEditMode && _selectedFile == null) ...[
                          const SizedBox(height: 8),
                          Text(
                            'Format accepté: PDF uniquement. Taille max: 10 Mo.',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontStyle: FontStyle.italic,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Submit button
                Consumer<SoumissionProvider>(
                  builder: (context, provider, _) {
                    return CustomButton(
                      label: _isEditMode
                          ? 'Enregistrer les modifications'
                          : 'Soumettre le travail',
                      isLoading: _isUploading,
                      onPressed: _handleSubmit,
                      icon: _isEditMode
                          ? Icons.save_outlined
                          : Icons.send_outlined,
                    );
                  },
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String title;

  const _SectionHeader({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Divider(
            color: theme.colorScheme.primary.withValues(alpha: 0.3),
          ),
        ),
      ],
    );
  }
}
