import '../models/congress.dart';
import 'api_service.dart';

class CongressService {
  Future<List<Congress>> getActiveCongresses() async {
    final data = await ApiService.get('/congresses');
    if (data is List) {
      return data.map((e) => Congress.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<Congress> getCongress(String id) async {
    final data = await ApiService.get('/congresses/$id');
    return Congress.fromJson(data as Map<String, dynamic>);
  }
}
