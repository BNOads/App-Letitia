const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://saoysiaolrogzfmzbsko.supabase.co';
const supabaseKey = 'sb_publishable_jVm-K3e2e73bNnK2XlBqAw_3feXCv4o'; // Usando a chave anon que você forneceu

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  },
  realtime: {
    enabled: false
  }
});

const links = [
  { titulo: "CRM HubSpot", url: "https://app.hubspot.com/global-home/50651326", categoria: "COMERCIAL", favorito: true, ordem: 1 },
  { titulo: "Tutorial HubSpot", url: "https://www.youtube.com/@HubSpot-CRM", categoria: "COMERCIAL", favorito: false, ordem: 2 },
  { titulo: "Onboarding", url: "https://www.notion.so/280db4551fa8809fa388f55eb9613f07?pvs=21", categoria: "COMERCIAL", favorito: false, ordem: 3 },
  { titulo: "Google Drive", url: "https://drive.google.com/drive/u/0/folders/13DrWpOos51490gB4JrYQLDhpz4B3cqr4", categoria: "COMERCIAL", favorito: true, ordem: 4 },
  { titulo: "Hotmart", url: "https://app.hotmart.com/", categoria: "COMERCIAL", favorito: false, ordem: 5 },
  { titulo: "Curseduca", url: "https://curseduca.com/", categoria: "COMERCIAL", favorito: false, ordem: 6 },
  { titulo: "HeroSpark", url: "https://herospark.com/area-de-membros", categoria: "COMERCIAL", favorito: false, ordem: 7 },
  { titulo: "WhatsApp Suporte", url: "https://wa.me/5521993568686", categoria: "COMERCIAL", favorito: true, ordem: 8 },
  { titulo: "Página Você Dirige", url: "https://leticiacazarre.com.br/voce-dirige/", categoria: "VENDAS", favorito: false, ordem: 9 },
  { titulo: "Workshop Plano A", url: "https://leticiacazarre.com.br/workshop-plano-a/", categoria: "VENDAS", favorito: false, ordem: 10 },
  { titulo: "Aplicação THE WAY", url: "https://leticiacazarre.com.br/thewaymentoria/", categoria: "VENDAS", favorito: true, ordem: 11 },
  { titulo: "Aplicação A Estrategista", url: "https://leticiacazarre.com.br/aplicacao-a-estrategista/", categoria: "VENDAS", favorito: false, ordem: 12 },
];

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

### THE WAY Semestral
- **Valor Total:** 50k
- **À vista:** 40k
- **Parcelado:**
  - Entrada 5k + 5x 9.000
  - Entrada 5k + 10x 4.500

---

## A ESTRATEGISTA (Negociação)
| Valor | Opções | Link | Parcelas |
| :--- | :--- | :--- | :--- |
| R$20.000,00 | Pix, Cartão, Inteligente | [Link](https://pay.herospark.com/a-estrategia-planejamento-anual-com-leticia-cazarre-comercial-505571) | 12x R$2.068,50 |
| R$18.000,00 | Pix, Cartão, Inteligente | [Link](https://pay.herospark.com/a-estrategista-planejamento-anual-com-leticia-cazarre-comercial-2-505570) | 12x R$1.861,60 |
| R$5.000,00 | PIX Compromisso | [Link](https://pay.herospark.com/a-estrategia-planejamento-anual-com-leticia-cazarre-pix-compromisso-5k-comercial-505578) | R$5.000,00 |

---

## VIDA, CARREIRA E NEGÓCIOS
| Valor | Opções | Link | Parcelas |
| :--- | :--- | :--- | :--- |
| R$20.000,00 | Pix, Cartão | [Link](https://pay.herospark.com/vida-carreira-e-negocios-20k-comercial-513848) | 12x R$2.068,50 |
| R$18.000,00 | Pix, Cartão | [Link](https://pay.herospark.com/vida-carreira-e-negocios-18k-comercial-514626) | 12x R$1.861,60 |

---

## THE WAY - EVENTO PRESENCIAL
- **Valor Total:** R$25.000,00 (12x R$2.585,60 no Cartão)
- **À vista (PIX):** R$22.000,00
- **Parcelado (PIX):** 2x R$11.000,00 (Quitar até 10 dias antes)
`;

async function seed() {
  console.log("Iniciando seed...");

  // Inserir links (pode falhar se RLS estiver ativo e não houver auth, mas vamos tentar)
  const { error: linksError } = await supabase.from('links_uteis').insert(links);
  if (linksError) {
    console.error("Erro ao inserir links (provavelmente RLS):", linksError.message);
  } else {
    console.log("Links inseridos com sucesso!");
  }

  // Criar pasta e documento
  const { data: pasta, error: pastaError } = await supabase
    .from('pastas')
    .insert({ nome: 'Processos', favorita: true })
    .select()
    .single();

  if (pastaError) {
    console.error("Erro ao criar pasta:", pastaError.message);
  } else {
    console.log("Pasta 'Processos' criada!");
    const { error: docError } = await supabase
      .from('documentos')
      .insert({
        titulo: "Informações de Produto e Comercial",
        conteudo: productContent,
        pasta_id: pasta.id,
        favorito: true,
        publico: true
      });
    
    if (docError) {
      console.error("Erro ao criar documento:", docError.message);
    } else {
      console.log("Documento de precificação criado!");
    }
  }

  console.log("Seed finalizado.");
}

seed();
