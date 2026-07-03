import type { PostgrestError } from "@supabase/supabase-js";

export function friendlyDatabaseError(error: PostgrestError) {
  switch (error.code) {
    case "42501":
      return "Você não tem permissão para essa ação. Confira se o proprietário está configurado corretamente no Supabase (owner_setup.sql).";
    case "23505":
      return "Já existe um registro com esses dados.";
    case "23503":
      return "Essa ação não é possível porque há outros lançamentos vinculados a esse registro.";
    case "23514":
      return "Dados inválidos: verifique os valores informados.";
    case "PGRST116":
      return "Registro não encontrado.";
  }
  return error.message;
}
