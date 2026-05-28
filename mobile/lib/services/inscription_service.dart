import '../models/inscription.dart';
import 'api_service.dart';

class InscriptionService {
  Future<Inscription> create(Map<String, dynamic> data) async {
    final response = await ApiService.post('/inscriptions', data);
    return Inscription.fromJson(response as Map<String, dynamic>);
  }

  Future<List<Inscription>> listMyInscriptions({String? congressId}) async {
    final params = <String, String>{};
    if (congressId != null) params['congress_id'] = congressId;
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final endpoint = '/inscriptions${query.isNotEmpty ? '?$query' : ''}';
    final data = await ApiService.get(endpoint);
    if (data is List) {
      return data.map((e) => Inscription.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Inscription?> getMyInscription({String? congressId}) async {
    final params = <String, String>{};
    if (congressId != null) params['congress_id'] = congressId;
    final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
    final endpoint = '/inscriptions/me${query.isNotEmpty ? '?$query' : ''}';
    final data = await ApiService.get(endpoint);
    if (data == null) return null;
    return Inscription.fromJson(data as Map<String, dynamic>);
  }
}
