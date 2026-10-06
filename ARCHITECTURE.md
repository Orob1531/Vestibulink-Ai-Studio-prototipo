# VESTIBULINK — Documentação Técnica de Arquitetura (Fase 1.0)

## 1. Visão Geral e Conceito Oficial do Produto
O **Vestibulink** é uma plataforma de descoberta e acompanhamento de oportunidades de ingresso e seleção (vestibulares, universidades, concursos públicos, processos seletivos e cursos técnicos).
A plataforma atua como centralizador de prazos, taxas, isenções, editais e alertas programados, mantendo sempre a **instituição oficial** como autoridade primária sobre cada processo.

---

## 2. Arquitetura em Camadas
O projeto segue uma separação estrita em camadas para desacoplar a interface visual (UI) das regras de negócio, serviços e persistência:

```text
UI (React Components - Visual 100% Preservado)
   ↓
Services (Regras de Negócio, Filtragem por Fuso Horário, Auth, Admin, IA)
   ↓
Repositories (Abstração de Dados + Cache Local Síncrono + Sincronização API)
   ↓
Backend API (Express + Middlewares de Segurança, RBAC, Rate Limiting)
   ↓
Data Layer (Persistência em Disco .data/vestibulink-db.json pronta para migração SQL)
```

---

## 3. Estrutura de Pastas
```text
/
├── server.ts                              # Servidor Express + Rotas da API + Vite Middleware
├── server/
│   ├── data/
│   │   └── database.ts                    # Camada de persistência do servidor, seed e audit logs
│   ├── security/
│   │   └── auth.ts                        # Hash scrypt, tokens HMAC, RBAC, sanitização e rate limit
│   └── services/
│       ├── alertSchedulerService.ts       # Separação entre configuração de alerta e fila de envio
│       └── editalAiService.ts             # Extração auxiliar de editais com Gemini (revisão humana)
├── src/
│   ├── App.tsx                            # Orquestração da UI conectada aos repositórios e serviços
│   ├── types.ts                           # Tipos de compatibilidade da UI enriquecidos com metadados
│   ├── domain/
│   │   └── models.ts                      # Entidades canônicas da Fase 1.0
│   ├── repositories/
│   │   ├── opportunityRepository.ts       # Abstração de oportunidades, instituições e fontes
│   │   ├── alertRepository.ts             # Abstração de alertas e favoritos
│   │   └── preferencesRepository.ts       # Abstração de preferências do usuário
│   ├── services/
│   │   ├── apiClient.ts                   # Cliente HTTP centralizado com suporte a Bearer Token
│   │   ├── authService.ts                 # Cadastro, login, sessão, troca de senha e exclusão LGPD
│   │   ├── opportunityService.ts          # Filtragem, ordenação por fuso horário e chamada IA
│   │   └── adminService.ts                # Operações administrativas e canal de escolas
│   ├── components/                        # Componentes visuais oficiais (identidade preservada)
│   ├── data/
│   │   └── initialVestibulares.ts         # Dados iniciais classificados explicitamente como DEMO_SEED
│   └── utils/
│       └── dateUtils.ts                   # Cálculo de prazos com suporte a fusos horários regionais
└── .env.example                           # Variáveis de ambiente documentadas (sem secrets reais)
```

---

## 4. Entidades de Domínio (`src/domain/models.ts`)
1. **`User`**: `id`, `nome`, `email`, `telefone`, `role` (`USER`, `ADMIN`, `EDITOR`, `MODERATOR`, `DATA_REVIEWER`, `SCHOOL_ADMIN`, `PARTNER`), `status`, `emailVerificado`, `lgpdConsent`, `createdAt`, `updatedAt`, `lastLoginAt`.
2. **`UserPreferencesEntity`**: Preferências de estados, cidades, cursos, áreas, tipos de oportunidade, instituições e canais de notificação.
3. **`Institution`**: Universidade, instituto federal, órgão público ou banca examinadora responsável pela oportunidade.
4. **`Opportunity` / `ProcessoSeletivo`**: Modelo unificado para `VESTIBULAR`, `CONCURSO` e `PROCESSO_SELETIVO`, contendo `fusoHorario` (`America/Sao_Paulo`, `America/Cuiaba`, `America/Campo_Grande`, `America/Manaus`, etc.), `vestibularDetails` e `concursoDetails`.
5. **`OfficialSource`**: Fontes oficiais tipadas (`OFFICIAL_WEBSITE`, `NOTICE`, `REGISTRATION`, `RESULTS`, `SCHEDULE`, `OTHER`) com status de verificação (`VERIFIED_RECENTLY`, `VERIFIED_OLD`, `NEEDS_UPDATE`, `PENDING_VERIFICATION`).
6. **`Favorite`**: Vínculo entre usuário e oportunidade salva.
7. **`AlertEntity` & `ScheduledAlertJob`**: Separa a configuração do alerta (`alerta48h`, `alertaDiaFinal`, `alertaIsencao`) dos jobs agendados na fila de execução (`DEADLINE_48H`, `DEADLINE_FINAL_DAY`, `EXEMPTION_DEADLINE`).
8. **`NotificationRecord`**: Registro auditável das notificações geradas (`EMAIL`, `WHATSAPP`, `PUSH`, `SMS`).
9. **`EditalDocument`**: Metadados do documento de edital analisado pela IA com flag `requiresHumanReview: true`.
10. **`AuditLogEntry`**: Log de auditoria para segurança, administração e conformidade com a LGPD.

---

## 5. Autenticação, Segurança e LGPD
- **Senhas seguras**: Hash gerado exclusivamente no servidor utilizando `crypto.scryptSync` com salt aleatório de 16 bytes e comparação em tempo constante (`crypto.timingSafeEqual`).
- **Sessões**: Tokens assinados via HMAC-SHA256 (`SESSION_SECRET`).
- **Controle de Acesso (RBAC)**: Middleware `requireRole` protege rotas administrativas (`/api/admin/*`).
- **Proteção contra abuso**: Rate limiter por IP (`/api/*`), sanitização de strings contra injeção de scripts e tratamento de erros sem exposição de stack traces.
- **LGPD**: Coleta mínima de dados, registro de consentimento (`lgpdConsent`) e endpoint dedicado `DELETE /api/auth/account` para exclusão integral da conta e dados pessoais vinculados.

---

## 6. Confiabilidade de Fontes e Classificação de Dados
- Dados de demonstração iniciais possuem `dataOrigin: "DEMO_SEED"` e `statusVerificacao: "PENDING_VERIFICATION"`.
- Cadastros manuais recebem `dataOrigin: "MANUAL_CURATED"` e `verificadoManualmente: false` até aprovação por um revisor (`PATCH /api/admin/opportunities/:id/verify`).
- URLs vazias nunca são salvas como links oficiais falsos (`"#"`).

---

## 7. Alertas e Fila de Notificações
- Quando um usuário ativa um alerta, o `alertSchedulerService` calcula os horários exatos de disparo considerando o fuso horário da oportunidade (ex.: `America/Cuiaba` para UFMT/UNEMAT, `America/Campo_Grande` para UFMS, `America/Sao_Paulo` para UFG/UnB/FUVEST).
- Os jobs são persistidos em `scheduledJobs` com status `PENDING` e registrados em `notifications` como `SIMULATED_PROTOTYPE` enquanto provedores externos (`WHATSAPP_API_TOKEN` / `SMTP_HOST`) não estiverem configurados. Links `wa.me` no modal continuam disponíveis apenas como confirmação manual iniciada pelo usuário.

---

## 8. Integração com IA (Gemini)
- O serviço `server/services/editalAiService.ts` utiliza o SDK `@google/genai` (`gemini-3.8-flash`) exclusivamente no backend.
- Suporta documentos extensos (até 120.000 caracteres por requisição, sem o limite fixo anterior de 4.000 caracteres).
- Todo resultado extraído pela IA é classificado como `AI_EXTRACTED_DRAFT` com `requiresHumanReview: true`, impedindo que a IA altere dados oficiais publicados sem revisão humana.

---

## 9. Variáveis de Ambiente
Consulte `.env.example`:
- `GEMINI_API_KEY`: Chave da API Gemini (server-side).
- `APP_URL`: URL base da aplicação.
- `SESSION_SECRET`: Segredo para assinatura HMAC dos tokens de sessão.
- `WHATSAPP_API_TOKEN`: Token para provedor externo de WhatsApp (futura integração de disparo ativo).
- `SMTP_HOST` / `EMAIL_API_KEY`: Configuração para disparo ativo de e-mails.

---

## 10. Próximos Passos (Fase 1.1)
1. Conectar interface de autenticação (Login / Cadastro / Perfil LGPD) mantendo o padrão visual do Vestibulink.
2. Conectar interface de revisão do Painel Administrativo (`ADMIN` / `DATA_REVIEWER`) para aprovação de editais e verificação de fontes oficiais.
3. Integrar provedor transacional de e-mail/WhatsApp ao worker da fila `scheduledJobs`.
4. Migrar o adaptador de persistência de `.data/vestibulink-db.json` para banco relacional gerenciado (PostgreSQL / Cloud SQL) através dos repositórios já isolados.
