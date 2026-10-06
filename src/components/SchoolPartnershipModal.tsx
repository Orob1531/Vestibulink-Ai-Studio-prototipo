import React, { useState, FormEvent } from "react";
import { X, School, CheckCircle2, Send, Sparkles, MapPin, Users } from "lucide-react";
import { adminService } from "../services/adminService";

interface SchoolPartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SchoolPartnershipModal({
  isOpen,
  onClose,
}: SchoolPartnershipModalProps) {
  if (!isOpen) return null;

  const [nomeEscola, setNomeEscola] = useState("");
  const [cidadeEstado, setCidadeEstado] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cargo, setCargo] = useState("Coordenador Pedagógico");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adminService.submitSchoolPartnership({
      nomeEscola,
      cidadeEstado,
      nomeResponsavel,
      cargo,
      whatsapp,
      email,
    });
    setEnviado(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-lg bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <School className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Canal de Parceria com Escolas
              </h3>
              <p className="text-xs text-slate-500">
                Estratégia de Aquisição Diferenciada (Páginas 9 e 12 do PDF)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6">
          {!enviado ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 leading-relaxed">
                <strong>O canal inexplorado pela concorrência:</strong> leve o Vestibulink para as turmas de 3º ano do Ensino Médio da sua escola em Mato Grosso, Goiás, MS ou DF com mural personalizado de prazos e alertas para os pais e alunos.
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nome do Colégio / Escola de Ensino Médio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Colégio Estadual ou Particular de MT/GO"
                  value={nomeEscola}
                  onChange={(e) => setNomeEscola(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cidade / Estado
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Cuiabá - MT ou Goiânia - GO"
                    value={cidadeEstado}
                    onChange={(e) => setCidadeEstado(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cargo / Função
                  </label>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs bg-white"
                  >
                    <option value="Coordenador Pedagógico">Coordenador Pedagógico</option>
                    <option value="Orientador Educacional">Orientador Educacional</option>
                    <option value="Diretor / Gestor">Diretor / Gestor</option>
                    <option value="Professor de 3º Ano">Professor de 3º Ano</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nome do Responsável
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Prof. ou Coordenador"
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    WhatsApp para Contato
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(65) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  E-mail institucional
                </label>
                <input
                  type="email"
                  required
                  placeholder="coordenacao@escola.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-98"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Cadastrar Escola Parceira</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center text-center py-6 gap-3 animate-in fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">
                Contato Registrado!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs">
                Nossa equipe entrará em contato com a escola <strong>{nomeEscola}</strong> para apresentar o mural de vestibulares e a lista de alertas para os concluintes do Ensino Médio.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl bg-slate-900 text-white px-5 py-2 text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
