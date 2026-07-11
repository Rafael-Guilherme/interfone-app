/** Consulta de CEP via ViaCEP (público, sem chave). Preenche o endereço. */
export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

export async function lookupCep(rawCep: string): Promise<CepAddress> {
  const cep = rawCep.replace(/\D/g, '');
  if (cep.length !== 8) throw new Error('CEP deve ter 8 dígitos.');
  const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!res.ok) throw new Error('Falha ao consultar o CEP.');
  const data = await res.json();
  if (data.erro) throw new Error('CEP não encontrado.');
  return {
    street: data.logradouro ?? '',
    district: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
  };
}

export function formatCep(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
