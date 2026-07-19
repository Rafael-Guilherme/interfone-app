/**
 * Máscaras de entrada.
 *
 * A de dinheiro trabalha em CENTAVOS, que é como a API guarda (`fee_cents`).
 * O usuário digita só dígitos e o valor preenche da direita para a esquerda —
 * assim não dá para digitar "50.0.0" nem ficar ambíguo entre vírgula e ponto,
 * que era o risco do campo decimal solto de antes.
 */

/** 5000 → "50,00" (sem o "R$", para caber em campos com prefixo próprio). */
export function centavosParaTexto(centavos: number): string {
  const s = Math.max(0, Math.round(centavos)).toString().padStart(3, '0');
  return `${s.slice(0, -2)},${s.slice(-2)}`;
}

/** Texto digitado → centavos. Ignora tudo que não é dígito. */
export function textoParaCentavos(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return 0;
  // Teto para não estourar o Int do banco com um dedo preso na tecla.
  return Math.min(parseInt(digitos, 10), 99_999_999);
}

/** onChangeText de um campo de dinheiro: reformata a cada tecla. */
export function mascaraDinheiro(texto: string): string {
  return centavosParaTexto(textoParaCentavos(texto));
}

/** 5000 → "R$ 50,00" — para exibição. */
export const formatarReais = (centavos: number): string => `R$ ${centavosParaTexto(centavos)}`;

/**
 * Máscara de telefone BR. Formata conforme o usuário digita:
 *   (11) 90000-0000  (celular, 11 dígitos)
 *   (11) 3000-0000   (fixo, 10 dígitos)
 * Aceita o país opcional (+55) no começo sem quebrar. Guarda-se o texto
 * mascarado; a API só precisa dos dígitos, então use `apenasDigitos` ao enviar.
 */
export function mascaraTelefone(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const apenasDigitos = (texto: string): string => texto.replace(/\D/g, '');

/**
 * Telefone OU ramal. Um contato interno pode ser um ramal curto ("1145") ou um
 * telefone completo. Só formata como (XX) XXXXX-XXXX a partir de 10 dígitos
 * (fixo/celular); abaixo disso devolve os dígitos crus, para não transformar um
 * ramal de 4 dígitos em "(11) 45".
 */
export function mascaraTelefoneOuRamal(texto: string): string {
  const d = texto.replace(/\D/g, '');
  return d.length >= 10 ? mascaraTelefone(d) : d;
}
