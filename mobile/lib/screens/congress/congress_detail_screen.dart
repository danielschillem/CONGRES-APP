import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/congress_provider.dart';

class CongressDetailScreen extends StatefulWidget {
  final String congressId;

  const CongressDetailScreen({super.key, required this.congressId});

  @override
  State<CongressDetailScreen> createState() => _CongressDetailScreenState();
}

class _CongressDetailScreenState extends State<CongressDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CongressProvider>().selectCongress(widget.congressId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd/MM/yyyy');

    return Scaffold(
      appBar: AppBar(title: const Text('Details du congres')),
      body: Consumer<CongressProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final congress = provider.selectedCongress;
          if (congress == null) {
            return const Center(child: Text('Congres introuvable'));
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  congress.title,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                if (congress.subtitle != null && congress.subtitle!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      congress.subtitle!,
                      style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                    ),
                  ),
                if (congress.edition != null && congress.edition!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      'Edition ${congress.edition}',
                      style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                    ),
                  ),
                const SizedBox(height: 16),

                _infoRow(Icons.calendar_today, 'Dates', congress.dateRange),
                const SizedBox(height: 8),
                _infoRow(Icons.location_on, 'Lieu', congress.fullLocation),
                const SizedBox(height: 8),
                _infoRow(
                  Icons.info_outline,
                  'Statut',
                  congress.status == 'active' ? 'Actif' : congress.status,
                ),
                const SizedBox(height: 16),

                if (congress.description != null && congress.description!.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Description',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        congress.description!,
                        style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                      ),
                    ],
                  ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.pushNamed(
                      context,
                      '/inscription',
                      arguments: congress.id,
                    ),
                    icon: const Icon(Icons.fact_check),
                    label: const Text("S'inscrire"),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.pushNamed(
                      context,
                      '/congress/program',
                      arguments: congress.id,
                    ),
                    icon: const Icon(Icons.schedule),
                    label: const Text('Voir le programme'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(fontWeight: FontWeight.w500)),
        Expanded(child: Text(value)),
      ],
    );
  }
}
