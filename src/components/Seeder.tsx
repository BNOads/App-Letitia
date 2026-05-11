import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import notionDocuments from '@/data/notion_documents.json';

export function Seeder() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      seedData();
    }
  }, [user]);

  const seedData = async () => {
    try {
      // 0. Promoção de Admin
      if (user?.email === 'suporte@laetitiaeducacao.com') {
        await supabase
          .from('profiles')
          .update({ role: 'CEO' })
          .eq('id', user.id);
      }

      // 1. Limpeza de duplicatas existentes
      const { data: allLinks } = await supabase.from('links_uteis').select('id, titulo, url');
      if (allLinks && allLinks.length > 0) {
        const seen = new Set();
        const duplicates = [];
        for (const link of allLinks) {
          const key = `${link.titulo}-${link.url}`;
          if (seen.has(key)) {
            duplicates.push(link.id);
          } else {
            seen.add(key);
          }
        }
        if (duplicates.length > 0) {
          console.log(`Limpando ${duplicates.length} links duplicados...`);
          await supabase.from('links_uteis').delete().in('id', duplicates);
        }
      }

      // Verificar links existentes por título para evitar duplicatas
      const { data: currentLinks } = await supabase.from('links_uteis').select('titulo');
      const existingTitles = new Set(currentLinks?.map(l => l.titulo) || []);
      
      const initialLinks = [
        { titulo: "CRM HubSpot", url: "https://app.hubspot.com/global-home/50651326", categoria: "COMERCIAL", favorito: true, ordem: 1 },
        { titulo: "Tutorial HubSpot", url: "https://www.youtube.com/@HubSpot-CRM", categoria: "COMERCIAL", favorito: false, ordem: 2 },
        { titulo: "Onboarding", url: "https://www.notion.so/280db4551fa8809fa388f55eb9613f07?pvs=21", categoria: "COMERCIAL", favorito: false, ordem: 3 },
        { titulo: "Google Drive", url: "https://drive.google.com/drive/u/0/folders/13DrWpOos51490gB4JrYQLDhpz4B3cqr4", categoria: "COMERCIAL", favorito: true, ordem: 4 },
        { titulo: "Hotmart", url: "https://app.hotmart.com/", categoria: "COMERCIAL", favorito: false, ordem: 5 },
        { titulo: "WhatsApp Suporte", url: "https://wa.me/5521993568686", categoria: "COMERCIAL", favorito: true, ordem: 8 },
        { titulo: "Página Você Dirige", url: "https://leticiacazarre.com.br/voce-dirige/", categoria: "VENDAS", favorito: false, ordem: 9 },
        { titulo: "Planilha Leads The Way 1", url: "https://docs.google.com/spreadsheets/d/13GYRX7NDDo3K5uPVa_GRs9z7lepfFWMPJDDp2OmHwtk/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: false, ordem: 20 },
        { titulo: "Planilha Leads The Way 2", url: "https://docs.google.com/spreadsheets/d/1o0ZVeOd3fWfVZrdSurs2KxZNcYhYkHhZ9zVJpy1hQ9g/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: false, ordem: 21 },
        { titulo: "Planilha Leads THE WAY 3", url: "https://docs.google.com/spreadsheets/d/1kjGL8q6u2kcGUGVHcBQUxAwWAihHy9915DI4xbtUpLk/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: false, ordem: 22 },
        { titulo: "Planilha Leads The Way 4", url: "https://docs.google.com/spreadsheets/d/1jlhveyiI5SEY963FSS2uNz4K3wEZy4oy7WOVgoMk_Kc/edit?gid=1093795752#gid=1093795752", categoria: "PLANILHAS", favorito: false, ordem: 23 },
        { titulo: "Leads CRM (06/11)", url: "https://docs.google.com/spreadsheets/d/1q1IlL1ybpAkQ0bZxZbzVlrM30vA8MEq0qn2qNBKElRM/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: false, ordem: 24 },
        { titulo: "Planilha A Estrategista", url: "https://docs.google.com/spreadsheets/d/1XVqMYrF3c2M9lTHzxVJnB4MHkFf0mspaL1oX5Z02qTA/edit?resourcekey=&gid=1187714093#gid=1187714093", categoria: "PLANILHAS", favorito: false, ordem: 25 },
        { titulo: "Workbook Estrategista/VCN", url: "https://docs.google.com/spreadsheets/d/18sUMpw7h1d5zdxJ835j0csT_RuRKgkK0MQHZYXfgFI0/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: false, ordem: 26 },
        { titulo: "BD Integrada", url: "https://docs.google.com/spreadsheets/d/10v2X7rPe9IsCWeDseexkP4-DKst231539nrngiQRsF8/edit?gid=0#gid=0", categoria: "PLANILHAS", favorito: true, ordem: 27 },
        // FORMULÁRIOS
        { titulo: "Aplicação THE WAY", url: "https://leticiacazarre.com.br/thewaymentoria/", categoria: "FORMULÁRIOS", favorito: true, ordem: 30 },
        { titulo: "Aplicação A Estrategista", url: "https://leticiacazarre.com.br/aplicacao-a-estrategista/", categoria: "FORMULÁRIOS", favorito: false, ordem: 31 },
        // PÁGINAS DE VENDAS
        { titulo: "PV Você Dirige", url: "https://leticiacazarre.com.br/voce-dirige/", categoria: "VENDAS", favorito: false, ordem: 40 },
        { titulo: "PV Workshop Plano A", url: "https://leticiacazarre.com.br/workshop-plano-a/", categoria: "VENDAS", favorito: false, ordem: 41 },
        { titulo: "PV THE WAY 2026", url: "https://leticiacazarre.com.br/the-way-2026/", categoria: "VENDAS", favorito: false, ordem: 42 },
        { titulo: "PV A Estrategista (Gravado)", url: "https://letciacazarre.herospark.co/curso-a-estrategista?", categoria: "VENDAS", favorito: false, ordem: 43 },
        { titulo: "Livraria Cazarré", url: "https://livrariacazarre.com.br/", categoria: "VENDAS", favorito: false, ordem: 44 },
        // CHECKOUTS
        { titulo: "Checkout Você Dirige (Base)", url: "https://pay.herospark.com/voce-dirige-comercial-483681", categoria: "CHECKOUTS", favorito: false, ordem: 50 },
        { titulo: "Checkout Você Dirige (10%)", url: "https://pay.herospark.com/voce-dirige-10-comercial-483680", categoria: "CHECKOUTS", favorito: false, ordem: 51 },
        { titulo: "Checkout Você Dirige (20%)", url: "https://pay.herospark.com/voce-dirige-20-comercial-483683", categoria: "CHECKOUTS", favorito: false, ordem: 52 },
        { titulo: "Checkout Você Dirige (R$ 697)", url: "https://pay.herospark.com/voce-dirige-20-comercial-483683", categoria: "CHECKOUTS", favorito: false, ordem: 53 },
        { titulo: "Checkout Plano A (Base)", url: "https://pay.herospark.com/workshop-plano-a-comercial-483676", categoria: "CHECKOUTS", favorito: false, ordem: 54 },
        { titulo: "Checkout Plano A (10%)", url: "https://pay.herospark.com/workshop-plano-a-10-comercial-483677", categoria: "CHECKOUTS", favorito: false, ordem: 55 },
        { titulo: "Checkout Plano A (20%)", url: "https://pay.herospark.com/workshop-plano-a-20-comercial-483679", categoria: "CHECKOUTS", favorito: false, ordem: 56 },
        { titulo: "Checkout A Estrategista (20k)", url: "https://pay.herospark.com/a-estrategia-planejamento-anual-com-leticia-cazarre-505561", categoria: "CHECKOUTS", favorito: false, ordem: 57 },
        { titulo: "Checkout A Estrategista (18k)", url: "https://pay.herospark.com/a-estrategista-planejamento-anual-com-leticia-cazarre-505564", categoria: "CHECKOUTS", favorito: false, ordem: 58 },
        { titulo: "Checkout A Estrategista (Gravado)", url: "https://letciacazarre.herospark.co/curso-a-estrategista", categoria: "CHECKOUTS", favorito: false, ordem: 59 },
      ];

      const linksToInsert = initialLinks.filter(l => !existingTitles.has(l.titulo));

      if (linksToInsert.length > 0) {
        await supabase.from('links_uteis').insert(linksToInsert);
      }

      const productContent = `
# INFORMAÇÕES DE PRODUTO E PRECIFICAÇÃO

## THE WAY Mentoria
### THE WAY Anual
- **Valor Total:** 90k
- **À vista:** 72k
- **Parcelado:** 
  - Entrada 10k + 5x 16.000
  - Entrada 10k + 10x 8.000
  - Entrada 9k + 11x 7.365

---

## A ESTRATEGISTA (Negociação)
| Valor | Opções | Link | Parcelas |
| :--- | :--- | :--- | :--- |
| R$20.000,00 | Pix, Cartão, Inteligente | [Link](https://pay.herospark.com/a-estrategia-planejamento-anual-com-leticia-cazarre-comercial-505571) | 12x R$2.068,50 |
| R$18.000,00 | Pix, Cartão, Inteligente | [Link](https://pay.herospark.com/a-estrategista-planejamento-anual-com-leticia-cazarre-comercial-2-505570) | 12x R$1.861,60 |

---

## VIDA, CARREIRA E NEGÓCIOS
| Valor | Opções | Link | Parcelas |
| :--- | :--- | :--- | :--- |
| R$20.000,00 | Pix, Cartão | [Link](https://pay.herospark.com/vida-carreira-e-negocios-20k-comercial-513848) | 12x R$2.068,50 |
`;

      const organogramaContent = `
# ORGANOGRAMA DA EQUIPE

## 👑 FUNDADORA & CEO
**Letícia**
- Estratégia de Negócios
- Estratégia Digital
- Criação de Conteúdo
- Copywriting
- Criação e Entrega de Produtos

---

## ⚖️ GESTÃO, OPERAÇÕES & JURÍDICO
**Lidiane**
- Coordenação Geral
- Protocolos e Processos
- Advogada Responsável

### 👥 EQUIPE INTERNA (Lidiane)
**Andressa**
- Assistente
- Coordenação das Equipes de Conteúdo

---

## ⚙️ EQUIPE OPERACIONAL

### 📢 MARKETING & CONTEÚDO
**Agência Vero** (Miguel & Paulo)
- Marketing e Conteúdo

### 🎨 DESIGN
**Áurea Design** (Letícia Maragon)
- Design Gráfico
- Materiais Visuais
- Identidade e Diagramação

### 🎬 EDIÇÃO DE VÍDEO
**Vini**
- Edição de Vídeos
- Entregas de Conteúdo
- Controle de Backlog

### 📞 CX / ATENDIMENTO
**Carol**
- Suporte ao Aluno
- Atendimento e Pós-venda
- NPS (Net Promoter Score)

### 💰 FINANCEIRO
**Marília**
- Validação de Pagamentos
- Controle Financeiro
- **Equipe:** Jennifer & Lívia

### 📈 COMERCIAL / VENDAS
**Mônica**
- CRM e Gestão de Leads
- Plataforma e Suporte Comercial

### 💻 INFRAESTRUTURA / TECNOLOGIA
**Agência Vero** (Miguel & Paulo)
- Plataforma de Ensino
- Automações e Integrações Digitais
- Suporte Técnico

---
*Nota: Colaboradores externos e agências atuam como PJ. Andressa integra a equipe interna.*
`;

      // Verificar se já existem pastas/documentos
      const { data: currentDocs } = await supabase.from('documentos').select('titulo');
      const docTitles = new Set(currentDocs?.map(d => d.titulo) || []);

      const { data: existingPastas } = await supabase.from('pastas').select('id, nome').eq('nome', 'Processos').single();
      
      let pastaId = existingPastas?.id;

      if (!pastaId) {
        const { data: newPasta } = await supabase
          .from('pastas')
          .insert({ nome: 'Processos', favorita: true })
          .select()
          .single();
        pastaId = newPasta?.id;
      }

      if (pastaId) {
        const docsToInsert = [];
        if (!docTitles.has("Informações de Produto e Comercial")) {
          docsToInsert.push({
            titulo: "Informações de Produto e Comercial",
            conteudo: productContent,
            pasta_id: pastaId,
            favorito: true,
            publico: true
          });
        }
        if (!docTitles.has("Organograma da Equipe")) {
          docsToInsert.push({
            titulo: "Organograma da Equipe",
            conteudo: organogramaContent,
            pasta_id: pastaId,
            favorito: true,
            publico: true
          });
        }

        if (docsToInsert.length > 0) {
          console.log(`Seeding ${docsToInsert.length} new documents...`);
          await supabase.from('documentos').insert(docsToInsert);
        }
      }

      // 4. Seeding Senhas
      const { data: currentSenhas } = await supabase.from('senhas').select('servico');
      if (!currentSenhas || currentSenhas.length === 0) {
        console.log("Seeding initial passwords...");
        const initialSenhas = [
          { servico: "Meta Business Suite", categoria: "Ferramenta", usuario: "equipe@leticiacazarre.com.br", senha: "M3t@Bu$1n3ss!", url: "https://business.facebook.com" },
          { servico: "Instagram @leticiacazarre", categoria: "Rede Social", usuario: "equipe@leticiacazarre.com.br", senha: "Insta#2026Lc" },
          { servico: "Hotmart (Produtor)", categoria: "Ferramenta", usuario: "leticia@leticiacazarre.com.br", senha: "H0tm@rt!Pr0d", url: "https://app.hotmart.com" },
          { servico: "Supabase LaetitiAPP", categoria: "Ferramenta", usuario: "dev@leticiacazarre.com.br", senha: "Sup@b4s3!2026", url: "https://supabase.com" },
          { servico: "Google Workspace", categoria: "E-mail", usuario: "admin@leticiacazarre.com.br", senha: "G00gl3#Ws!", url: "https://admin.google.com" },
          { servico: "Asaas (Cobranças)", categoria: "Financeiro", usuario: "financeiro@leticiacazarre.com.br", senha: "As@@s#F1n!", url: "https://www.asaas.com" },
          { servico: "Canva Pro", categoria: "Ferramenta", usuario: "equipe@leticiacazarre.com.br", senha: "C@nv4#Pr0!", url: "https://canva.com" },
        ];
        await supabase.from('senhas').insert(initialSenhas);
      }

      // 5. Seeding de tarefas e eventos desativado para evitar retorno de itens apagados
      console.log("Seeding de tarefas e eventos desativado.");

      // 6. Seeding Notion Documents (Materiais LC)
      try {
        const { data: existingDocs } = await supabase.from('documentos').select('titulo');
        const existingDocTitles = new Set(existingDocs?.map(d => d.titulo) || []);

        // Get unique categories from notion documents
        const categories = [...new Set(notionDocuments.map((d: { categoria: string }) => d.categoria))];

        // Create or get pasta IDs for each category
        const pastaMap: Record<string, string> = {};
        for (const cat of categories) {
          const { data: existingPasta } = await supabase
            .from('pastas')
            .select('id')
            .eq('nome', cat)
            .single();
          
          if (existingPasta) {
            pastaMap[cat] = existingPasta.id;
          } else {
            const { data: newPasta } = await supabase
              .from('pastas')
              .insert({ nome: cat, favorita: false })
              .select('id')
              .single();
            if (newPasta) {
              pastaMap[cat] = newPasta.id;
            }
          }
        }

        // Insert documents that don't exist yet
        const notionDocsToInsert = notionDocuments
          .filter((d: { titulo: string }) => !existingDocTitles.has(d.titulo))
          .map((d: { titulo: string; conteudo: string; categoria: string; favorito: boolean; publico: boolean }) => ({
            titulo: d.titulo,
            conteudo: d.conteudo,
            pasta_id: pastaMap[d.categoria],
            favorito: d.favorito,
            publico: d.publico,
          }))
          .filter((d: { pasta_id?: string }) => d.pasta_id);

        if (notionDocsToInsert.length > 0) {
          console.log(`Seeding ${notionDocsToInsert.length} Notion documents...`);
          // Insert in batches to avoid payload limits
          const batchSize = 5;
          for (let i = 0; i < notionDocsToInsert.length; i += batchSize) {
            const batch = notionDocsToInsert.slice(i, i + batchSize);
            const { error } = await supabase.from('documentos').insert(batch);
            if (error) {
              console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
            }
          }
          console.log(`✅ Notion documents seeded successfully!`);
        } else {
          console.log("Notion documents already seeded, skipping.");
        }
      } catch (notionErr) {
        console.error("Notion documents seeding error:", notionErr);
      }
    } catch (e) {
      console.error("Seeding error:", e);
    }
  };

  return null;
}
