import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/soumission.dart';
import 'status_badge.dart';

class SoumissionCard extends StatelessWidget {
  final Soumission soumission;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;

  const SoumissionCard({
    super.key,
    required this.soumission,
    this.onTap,
    this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dateFormat = DateFormat('dd/MM/yyyy', 'fr_FR');

    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        onLongPress: soumission.isEnAttente ? _showOptions(context) : null,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top row: type badge + date
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _TypeBadge(type: soumission.submissionType),
                  const Spacer(),
                  Text(
                    dateFormat.format(soumission.createdAt),
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Document title
              Text(
                soumission.documentTitle,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),

              // Author
              Row(
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      soumission.authorName,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

              // Theme
              if (soumission.theme.isNotEmpty) ...[
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(
                      Icons.label_outline,
                      size: 14,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        soumission.theme,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 12),

              // Bottom row: status badge + edit indicator
              Row(
                children: [
                  StatusBadge(statut: soumission.statut),
                  const Spacer(),
                  if (soumission.isEnAttente)
                    Icon(
                      Icons.edit_outlined,
                      size: 16,
                      color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  VoidCallback? _showOptions(BuildContext context) {
    if (!soumission.isEnAttente) return null;
    return () {
      showModalBottomSheet(
        context: context,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (ctx) => SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Modifier la soumission'),
                onTap: () {
                  Navigator.pop(ctx);
                  onEdit?.call();
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      );
    };
  }
}

class _TypeBadge extends StatelessWidget {
  final String type;

  const _TypeBadge({required this.type});

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(type);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: config.color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        type,
        style: TextStyle(
          color: config.color,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  _TypeConfig _getConfig(String type) {
    switch (type) {
      case 'Poster':
        return _TypeConfig(color: const Color(0xFF6366F1));
      case 'Communication':
        return _TypeConfig(color: const Color(0xFF10B981));
      default: // Abstract
        return _TypeConfig(color: const Color(0xFF3B82F6));
    }
  }
}

class _TypeConfig {
  final Color color;
  _TypeConfig({required this.color});
}
