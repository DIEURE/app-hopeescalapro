import dayjs from "dayjs";

/**
 * Utilitários centralizados de data para o Hope Escala Pro
 */

/**
 * Retorna true se já passou das 17:00:00 da data marcada para a reunião/votação.
 * Se a data for anterior a hoje, já retorna true.
 * Se a data for hoje e for 17:01, retorna true.
 * Se a data for futura, retorna false.
 */
export function isVotacaoExpirada(dataMarcada: string | null | undefined): boolean {
  if (!dataMarcada) return false;

  // Monta a data limite exatamente às 17:00:00 do dia marcado
  const limite = dayjs(dataMarcada).hour(17).minute(0).second(0);
  return dayjs().isAfter(limite);
}
// Verifica se a data é estritamente anterior ao dia de hoje (00:00:00)
export function isDataPassada(dataString: string | null | undefined): boolean {
  if (!dataString) return false;
  return dayjs(dataString).isBefore(dayjs().startOf("day"));
}

// Formata string YYYY-MM-DD ou ISO para DD/MM/YYYY
export function formatarDataBr(dataString: string | null | undefined): string {
  if (!dataString) return "—";
  return dayjs(dataString).format("DD/MM/YYYY");
}

// Formata hora "HH:mm:ss" para "HH:mm"
export function formatarHoraBr(hora: string | null | undefined): string {
  if (!hora) return "—";
  return hora.substring(0, 5);
}

// Retorna o mês em dois dígitos ("01", "02", ...)
export function extrairMes(dataString: string | null | undefined): string {
  if (!dataString) return "";
  return dayjs(dataString).format("MM");
}