import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/congress_provider.dart';
import '../../providers/inscription_provider.dart';
import '../../models/congress.dart';

class InscriptionFormScreen extends StatefulWidget {
  final String? congressId;

  const InscriptionFormScreen({super.key, this.congressId});

  @override
  State<InscriptionFormScreen> createState() => _InscriptionFormScreenState();
}

class _InscriptionFormScreenState extends State<InscriptionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nomCtrl = TextEditingController();
  final _prenomCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _telCtrl = TextEditingController();
  final _organismeCtrl = TextEditingController();
  final _paysCtrl = TextEditingController();
  String _participationType = 'Presentiel';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nomCtrl.dispose();
    _prenomCtrl.dispose();
    _emailCtrl.dispose();
    _telCtrl.dispose();
    _organismeCtrl.dispose();
    _paysCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final congressProvider = context.read<CongressProvider>();
    final congress = congressProvider.selectedCongress;
    if (congress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Aucun congres selectionne')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final data = {
      'nom': _nomCtrl.text,
      'prenom': _prenomCtrl.text,
      'email': _emailCtrl.text,
      'telephone': _telCtrl.text,
      'organisme': _organismeCtrl.text,
      'pays': _paysCtrl.text,
      'tariff_label': 'Standard',
      'participation_type': _participationType,
      'montant': _participationType == 'Presentiel' ? 50000 : 25000,
      'methode_paiement': 'orange_money',
      'code_otp': '0000',
      'congress_id': congress.id,
    };

    final provider = context.read<InscriptionProvider>();
    final result = await provider.createInscription(data);

    setState(() => _isSubmitting = false);

    if (result != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Inscription reussie!')),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Erreur lors de l\'inscription')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inscription')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Inscription au congres',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Consumer<CongressProvider>(
                builder: (context, provider, _) {
                  final congress = provider.selectedCongress;
                  if (congress != null) {
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          congress.title,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
              const SizedBox(height: 20),

              TextFormField(
                controller: _nomCtrl,
                decoration: const InputDecoration(labelText: 'Nom'),
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _prenomCtrl,
                decoration: const InputDecoration(labelText: 'Prenom'),
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _telCtrl,
                decoration: const InputDecoration(labelText: 'Telephone'),
                keyboardType: TextInputType.phone,
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _organismeCtrl,
                decoration: const InputDecoration(labelText: 'Organisme'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _paysCtrl,
                decoration: const InputDecoration(labelText: 'Pays'),
                validator: (v) => v?.isEmpty == true ? 'Requis' : null,
              ),
              const SizedBox(height: 16),

              DropdownButtonFormField<String>(
                value: _participationType,
                decoration: const InputDecoration(labelText: 'Type de participation'),
                items: const [
                  DropdownMenuItem(value: 'Presentiel', child: Text('Presentiel')),
                  DropdownMenuItem(value: 'En ligne', child: Text('En ligne')),
                ],
                onChanged: (v) => setState(() => _participationType = v!),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text("S'inscrire"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
