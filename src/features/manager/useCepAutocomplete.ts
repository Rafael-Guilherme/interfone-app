import { useEffect, useRef, useState } from 'react';
import { lookupCep, CepAddress } from './cep';

/**
 * Autocomplete de endereço por CEP. Dispara SOZINHO quando o CEP chega a 8
 * dígitos — antes só rodava no `onBlur`, então o endereço só aparecia depois de
 * o usuário sair do campo (ou nunca, no teclado numérico sem "próximo").
 *
 * Devolve `buscando` para feedback e chama `onResolvido` com o endereço. Evita
 * refazer a busca para um CEP que já foi resolvido.
 */
export function useCepAutocomplete(cepMascarado: string, onResolvido: (a: CepAddress) => void) {
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ultimoBuscado = useRef<string>('');
  // Mantém o callback atual sem reprovocar o efeito a cada render.
  const cb = useRef(onResolvido);
  cb.current = onResolvido;

  const digitos = cepMascarado.replace(/\D/g, '');

  useEffect(() => {
    if (digitos.length !== 8) {
      setErro(null);
      return;
    }
    if (digitos === ultimoBuscado.current) return; // já resolvido
    ultimoBuscado.current = digitos;

    let cancelado = false;
    setBuscando(true);
    setErro(null);
    lookupCep(digitos)
      .then((a) => { if (!cancelado) cb.current(a); })
      .catch((e) => {
        if (!cancelado) {
          ultimoBuscado.current = ''; // permite tentar de novo
          setErro(e?.message ?? 'Não foi possível buscar o CEP.');
        }
      })
      .finally(() => { if (!cancelado) setBuscando(false); });

    return () => { cancelado = true; };
  }, [digitos]);

  return { buscando, erro };
}
