import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/soumission.dart';
import '../../providers/soumission_provider.dart';
import '../../widgets/status_badge.dart';
import 'soumission_form_screen.dart';

class SoumissionDetailScreen extends StatefulWidget {
  final String soumissionId;

  const SoumissionDetailScreen({super.key, required this.soumissionId});

  @override
  State<SoumissionDetailScreen> createState() => _SoumissionDetailScreenState();
}

class _SoumissionDetailScreenState extends State<SoumissionDetailScreen> {
  Soumission? _soumission;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSoumission();
  }

  void _loadSoumission() {
    final provider = context.read<SoumissionProvider>();
    final found = provider.soumissions.where((s) => s.id == widget.soumissionId);
    if (found.isNotEmpty) {
      setState(() {
        _soumission = found.first;
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  void _navigateToEdit() {
    if (_soumission == null) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => SoumissionFormScreen(soumission: _soumission),
      ),
    ).then((_) {
      // Refresh after edit
      final provider = context.read<SoumissionProvider>();
      final updated = provider.soumissions
          .where((s) => s.id == widget.soumissionId);
      if (updated.isNotEmpty) {
        setState(() => _soumission = updated.first);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateFormat = DateFormat('dd MMMM yyyy à HH:mm', 'fr_FR');

    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_soumission == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Soumission')),
        body: const Center(
          child: Text('Soumission introuvable.'),
        ),
      );
    }

    final s = _soumission!;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Détails de la soumission',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        actions: [
          if (s.isEnAttente)
            TextButton.icon(
              onPressed: _navigateToEdit,
              icon: const Icon(Icons.edit_outlined, size: 18),
              label: const Text('Modifier'),
              style: TextButton.styleFrom(
                foregroundColor: theme.colorScheme.primary,
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header card with status
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _TypeBadge(type: s.submissionType),
                            const SizedBox(height: 10),
                            Text(
                              s.documentTitle,
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Icon(
                                  Icons.person_outline,
                                  size: 16,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  s.authorName,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      StatusBadge(statut: s.statut, large: true),
                      const Spacer(),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Soumis le',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                          Text(
                            dateFormat.format(s.createdAt),
                            style: theme.textTheme.bodySmall?.copyWith(
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Rejection reason box
            if (s.isRejetee && s.raisonRejet != null && s.raisonRejet!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFEF4444)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.cancel_outlined,
                          color: Color(0xFFEF4444),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Motif du rejet',
                          style: theme.textTheme.titleSmall?.copyWith(
                            color: const Color(0xFF991B1B),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      s.raisonRejet!,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: const Color(0xFF991B1B),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // Details section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _DetailCard(
                    children: [
                      _DetailRow(
                        icon: Icons.label_outline,
                        label: 'Thème',
                        value: s.theme,
                      ),
                      _DetailRow(
                        icon: Icons.tag,
                        label: 'Topics',
                        value: s.topics,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Résumé
                  _DetailCard(
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.summarize_outlined,
                            size: 18,
                            color: theme.colorScheme.primary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Résumé',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        s.resume,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          height: 1.6,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Keywords
                  if (s.keywords.isNotEmpty) ...[
                    _DetailCard(
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.local_offer_outlined,
                              size: 18,
                              color: theme.colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Mots-clés',
                              style: theme.textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: theme.colorScheme.primary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: s.keywords.map((kw) {
                            return Chip(
                              label: Text(kw),
                              backgroundColor: theme.colorScheme.primary
                                  .withValues(alpha: 0.1),
                              labelStyle: TextStyle(
                                color: theme.colorScheme.primary,
                                fontWeight: FontWeight.w500,
                                fontSize: 12,
                              ),
                              side: BorderSide(
                                color: theme.colorScheme.primary
                                    .withValues(alpha: 0.3),
                              ),
                              visualDensity: VisualDensity.compact,
                            );
                          }).toList(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],

                  // File info
                  _DetailCard(
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.picture_as_pdf_outlined,
                            size: 18,
                            color: Color(0xFFEF4444),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Fichier soumis',
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        s.filePath.split('/').last.isNotEmpty
                            ? s.filePath.split('/').last
                            : s.filePath,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: const Color(0xFFEF4444),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),

                  if (s.updatedAt != null) ...[
                    const SizedBox(height: 12),
                    Center(
                      child: Text(
                        'Dernière modification: ${dateFormat.format(s.updatedAt!)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: s.isEnAttente
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: ElevatedButton.icon(
                  onPressed: _navigateToEdit,
                  icon: const Icon(Icons.edit_outlined),
                  label: const Text('Modifier cette soumission'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    minimumSize: const Size(double.infinity, 50),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}

class _TypeBadge extends StatelessWidget {
  final String type;
  const _TypeBadge({required this.type});

  @override
  Widget build(BuildContext context) {
    final Map<String, Color> colors = {
      'Poster': const Color(0xFF6366F1),
      'Communication': const Color(0xFF10B981),
      'Abstract': const Color(0xFF3B82F6),
    };
    final color = colors[type] ?? const Color(0xFF3B82F6);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        type,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  final List<Widget> children;
  const _DetailCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: children,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
