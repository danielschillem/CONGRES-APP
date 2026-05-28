import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/inscription_provider.dart';

class InscriptionListScreen extends StatefulWidget {
  const InscriptionListScreen({super.key});

  @override
  State<InscriptionListScreen> createState() => _InscriptionListScreenState();
}

class _InscriptionListScreenState extends State<InscriptionListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InscriptionProvider>().loadMyInscriptions();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');

    return Scaffold(
      appBar: AppBar(title: const Text('Mes inscriptions')),
      body: Consumer<InscriptionProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(provider.error!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => provider.loadMyInscriptions(),
                    child: const Text('Reessayer'),
                  ),
                ],
              ),
            );
          }

          if (provider.inscriptions.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text("Vous n'avez pas encore d'inscriptions"),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadMyInscriptions(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.inscriptions.length,
              itemBuilder: (context, index) {
                final ins = provider.inscriptions[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                ins.fullName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: ins.isConfirmed
                                    ? Colors.green[50]
                                    : Colors.orange[50],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                ins.isConfirmed ? 'Confirme' : 'En attente',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: ins.isConfirmed
                                      ? Colors.green[700]
                                      : Colors.orange[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text('Facture: ${ins.numeroFacture}'),
                        Text('Montant: ${ins.montant.toStringAsFixed(0)} FCFA'),
                        Text('Date: ${dateFmt.format(ins.createdAt)}'),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
