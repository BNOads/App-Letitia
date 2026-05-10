import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function Seeder() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      seedData();
    }
  }, [user]);

  const seedData = async () => {
    try {
      // Limpeza de duplicatas existentes (opcional, rodar uma vez se houver sujeira)
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
        { titulo: "Aplicação THE WAY", url: "https://leticiacazarre.com.br/thewaymentoria/", categoria: "VENDAS", favorito: true, ordem: 11 },
      ];

      const linksToInsert = initialLinks.filter(l => !existingTitles.has(l.titulo));

      if (linksToInsert.length > 0) {
        console.log(`Seeding ${linksToInsert.length} new links...`);
        await supabase.from('links_uteis').insert(linksToInsert);
      }

      // Verificar se já existem pastas/documentos
      const { data: existingPastas } = await supabase.from('pastas').select('id').limit(1);
      
      if (!existingPastas || existingPastas.length === 0) {
        console.log("Seeding documents...");
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

        const { data: pasta } = await supabase
          .from('pastas')
          .insert({ nome: 'Processos', favorita: true })
          .select()
          .single();

        if (pasta) {
          await supabase.from('documentos').insert({
            titulo: "Informações de Produto e Comercial",
            conteudo: productContent,
            pasta_id: pasta.id,
            favorito: true,
            publico: true
          });
        }
      }
    } catch (e) {
      console.error("Seeding error:", e);
    }
  };

  return null;
}
