import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String statut;
  final bool large;

  const StatusBadge({
    super.key,
    required this.statut,
    this.large = false,
  });

  @override
  Widget build(BuildContext context) {
    final config = _getConfig(statut);

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: large ? 14 : 10,
        vertical: large ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: config.backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: config.borderColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            config.icon,
            size: large ? 16 : 12,
            color: config.textColor,
          ),
          const SizedBox(width: 4),
          Text(
            statut,
            style: TextStyle(
              color: config.textColor,
              fontSize: large ? 13 : 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.3,
            ),
          ),
        ],
      ),
    );
  }

  _StatusConfig _getConfig(String statut) {
    switch (statut) {
      case 'Approuvée':
        return _StatusConfig(
          backgroundColor: const Color(0xFFD1FAE5),
          borderColor: const Color(0xFF10B981),
          textColor: const Color(0xFF065F46),
          icon: Icons.check_circle_outline,
        );
      case 'Rejetée':
        return _StatusConfig(
          backgroundColor: const Color(0xFFFEE2E2),
          borderColor: const Color(0xFFEF4444),
          textColor: const Color(0xFF991B1B),
          icon: Icons.cancel_outlined,
        );
      default: // En attente
        return _StatusConfig(
          backgroundColor: const Color(0xFFFEF3C7),
          borderColor: const Color(0xFFF59E0B),
          textColor: const Color(0xFF92400E),
          icon: Icons.schedule_outlined,
        );
    }
  }
}

class _StatusConfig {
  final Color backgroundColor;
  final Color borderColor;
  final Color textColor;
  final IconData icon;

  _StatusConfig({
    required this.backgroundColor,
    required this.borderColor,
    required this.textColor,
    required this.icon,
  });
}
