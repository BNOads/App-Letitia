// Auto-generated from vendas_contatos_produtos.csv + Hotmart CSV
// Each raw row from CSV

import { HOTMART_DATA } from './hotmartData';

export interface AlunoRaw {
  nome: string;
  email: string;
  telefone: string;
  produto: string;
  origem?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  produtos: string[];
  produtosUnicos: string[];
  isMultiProduto: boolean;
  tags: string[];
}

// Normalize product names to group variations
function normalizeProductName(raw: string): string {
  const lower = raw.toLowerCase().trim();

  if (lower.includes("workshop") && lower.includes("plano a")) {
    return "Workshop - Plano A";
  }
  if (lower.includes("você dirige") || lower.includes("voce dirige")) {
    return "Você Dirige";
  }
  if (lower.includes("estrategista") && lower.includes("turma 2")) {
    return "A Estrategista - Turma 2";
  }
  if (lower.includes("estrategista") && lower.includes("turma 1")) {
    return "A Estrategista - Turma 1";
  }
  if (lower.includes("estrategista") && !lower.includes("turma")) {
    return "A Estrategista";
  }
  if (lower.includes("imersão") && lower.includes("plano a") && lower.includes("gravação")) {
    return "Imersão Plano A - Gravação";
  }
  if (lower.includes("imersão") && lower.includes("plano a")) {
    return "Imersão Plano A";
  }
  if (lower.includes("gravação") || lower.includes("gravacao")) {
    return "Gravação Aula ao Vivo";
  }
  if (lower.includes("style guide") && (lower.includes("3.0") || lower.includes("bônus") || lower.includes("bonus"))) {
    return "LCz Style Guide 3.0";
  }
  if (lower.includes("style guide") && (lower.includes("40 itens") || lower.includes("40 iten"))) {
    return "LCz Style Guide - 40 Itens";
  }
  if (lower.includes("style guide")) {
    return "LCz Style Guide";
  }
  if (lower.includes("vida, carreira")) {
    return "Vida, Carreira e Negócios";
  }

  return raw.trim();
}

const RAW_DATA: AlunoRaw[] = [
{"nome":"Rhuan De Vasconcelos","email":"rhnmendes@gmail.com","telefone":"+55 (21) 98023-1242","produto":"Você Dirige"},
{"nome":"Rhuan Mendes","email":"rhnmendes@gmail.com","telefone":"+55 (21) 98023-1242","produto":"Workshop - Plano A"},
{"nome":"Roseane Tofano","email":"roseanectofano@gmail.com","telefone":"+55 (28) 99298-4723","produto":"Você Dirige"},
{"nome":"Cristiane Alves Alvarenga","email":"crikamat@gmail.com","telefone":"+55 (24) 99315-4224","produto":"Workshop - Plano A"},
{"nome":"Rafaela Faria","email":"rafa.faria85@gmail.com","telefone":"+55 (94) 99201-1703","produto":"Workshop - Plano A"},
{"nome":"Aline Patricio Machado","email":"aline.patricio.machado@gmail.com","telefone":"+55 (15) 99746-2266","produto":"Você Dirige"},
{"nome":"Elaine Cruz Carvalho Silva Melo","email":"anamelovidinha@gmail.com","telefone":"+55 (21) 99981-8185","produto":"Você Dirige"},
{"nome":"Ingrid Godoy Cruz","email":"ingridgc.nutri@gmail.com","telefone":"+55 (61) 99923-3480","produto":"Workshop - Plano A"},
{"nome":"Ingrid Godoy Cruz","email":"ingridgc.nutri@gmail.com","telefone":"+55 (61) 99923-3480","produto":"Você Dirige"},
{"nome":"Vanessa Carvalho Dos Santos","email":"vanessacarvalhosantos@live.com","telefone":"+55 (17) 98169-4571","produto":"Você Dirige"},
{"nome":"Caroline Macedo Semprebom Pelissale","email":"cmspelissale@gmail.com","telefone":"+55 (66) 99667-2227","produto":"Você Dirige"},
{"nome":"Thayna De Sousa Ribeiro","email":"thaynasousaa1@gmail.com","telefone":"+55 (63) 99200-2357","produto":"Workshop - Plano A"},
{"nome":"Daniela Marani","email":"danimarani74@gmail.com","telefone":"+55 (41) 99186-9353","produto":"Workshop - Plano A"},
{"nome":"Beatriz Lopes Paes","email":"bialopespaes@gmail.com","telefone":"+55 (16) 99787-0737","produto":"Workshop - Plano A"},
{"nome":"Juliana Rodrigues Santos Marques","email":"julirsantos84@gmail.com","telefone":"+55 (41) 99121-4477","produto":"Você Dirige"},
{"nome":"Ecila Vieira Cunha De Oliveira","email":"ecilacunha@gmail.com","telefone":"+55 (34) 99123-1188","produto":"Você Dirige"},
{"nome":"Renata Leonardo Costa Carotenuto","email":"relccarotenuto@gmail.com","telefone":"+55 (11) 99179-7955","produto":"Você Dirige"},
{"nome":"Carlene Rodrigues","email":"carlenepatricia95@hotmail.com","telefone":"+44 (07) 89580-1399","produto":"Workshop - Plano A"},
{"nome":"Paula Fernandez","email":"paulinhaferr@hotmail.com","telefone":"+55 (21) 98187-6032","produto":"Workshop - Plano A"},
{"nome":"Evelin Gonçalves Souza Bulhões","email":"evelinmed90@gmail.com","telefone":"+55 (31) 99920-5025","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Vanessa Cunha De Souza","email":"vanessa1csouza@gmail.com","telefone":"+55 (61) 99951-2071","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Naiara Damasceno Oliveira","email":"nadamasceno06@gmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Ana Karolina Reinert Kotaka","email":"anakreinert@gmail.com","telefone":"+55 (47) 99977-4833","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Kamilla Pessanha Mariano Ribeiro","email":"kamillapmariano@gmail.com","telefone":"+55 (22) 99807-1249","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Andrea","email":"deamendes@hotmail.com","telefone":"+55 (21) 99982-3117","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Sonia Alexandre Ribamar Da Paixão","email":"sarpax92@hotmail.com","telefone":"+55 (61) 99267-9788","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Elisa Paschoalotto Da Silva","email":"epaschoalotto@gmail.com","telefone":"+55 (48) 98804-0391","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Daniele Simões","email":"dudasimoesbr@gmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Isabela Sousa","email":"isabelaacarolina@gmail.com","telefone":"+55 (37) 99999-4463","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Rafaela Thomazetto","email":"rafaela.thomazetto@gmail.com","telefone":"+55 (11) 98653-0788","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Emanoella Carla Melo Da Silva","email":"ecarla980@gmail.com","telefone":"+55 (11) 95478-9725","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Cristina De Bona Bertol","email":"jcdbbertol@gmail.com","telefone":"+55 (49) 99964-3606","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Frutuoso Hyppolito","email":"juhyppolito@gmail.com","telefone":"+55 (17) 99124-8378","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Larissa De Fátima Veiga Brey","email":"bertha.brecho.canoinhas@gmail.com","telefone":"+55 (47) 99278-1770","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Fernanda Carreiro Sales Corrêa","email":"fecarreiro@gmail.com","telefone":"+55 (22) 99848-7513","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Letícia Pâmela De Medeiros Costa","email":"leticiapamelamd@outlook.com","telefone":"+55 (84) 98840-7466","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Eliabel Aguilar Culquicondor","email":"eliabelac@hotmail.com","telefone":"+55 (11) 95877-2405","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Araceli De Maria Dos Reis","email":"aracelireis10@gmail.com","telefone":"+55 (11) 99622-0265","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Ana Caroline Blanco Carreiro","email":"anacaroline_bc@hotmail.com","telefone":"+55 (67) 98411-5828","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Maria José Lima Machado Moreira","email":"maria.machado@oabrj.org.br","telefone":"+55 (22) 99855-4041","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Severino Santos","email":"julianaseverino.adv@gmail.com","telefone":"+55 (21) 98895-4555","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Fabiana Magalhaes","email":"fabianavmp@uol.com.br","telefone":"+55 (27) 99972-0404","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Ana Marchine","email":"ana.marchine@gmail.com","telefone":"+55 (11) 95304-2772","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Glaucia Ribeiro De Almeida","email":"glaucia.socialmedia@gmail.com","telefone":"+55 (21) 98146-0484","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Luisa Braga Cançado Ferreira","email":"luisabragaferreira@gmail.com","telefone":"+55 (31) 98420-2605","produto":"Você Dirige"},
{"nome":"Michelli Gonçales Dádamo Dos Reis","email":"mnutri.dadamo@gmail.com","telefone":"+55 (67) 99289-1612","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Renata Carotenuto","email":"relccarotenuto@gmail.com","telefone":"+55 (11) 99179-7955","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Tatiana Marques","email":"tatianascmarques@gmail.com","telefone":"+55 (61) 99291-8448","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Thaís Arantes Campos","email":"tha.acampos@yahoo.com.br","telefone":"+55 (35) 98897-0040","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Marrara Lindsey Bortoloti","email":"suportefullrapido@gmail.com","telefone":"+55 (51) 99590-3745","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Thaisa Da Silva Hernandez","email":"thaisa.silvarj@gmail.com","telefone":"+55 (21) 98106-6373","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Flávia Neves Saccardi Borges","email":"flasaccardi@gmail.com","telefone":"+55 (17) 98166-4466","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Sheyla Tiburcio","email":"sheyla.assuncao@gmail.com","telefone":"+55 (61) 98133-2626","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Laryssa Cavalcante França","email":"lary.cavalcante@hotmail.com","telefone":"+55 (48) 99819-1023","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Renata Salles Faissal","email":"renatafaissal@yahoo.com.br","telefone":"+55 (21) 99854-3022","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Lidiane Silva Franqui","email":"lidiane.franqui@yahoo.com.br","telefone":"+55 (19) 98385-4397","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Anna Bartelheimer","email":"anna.bartelheimer@yahoo.com","telefone":"+49 (01) 577780-0125","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Gabriella De Medeiros Alves Araujo Luiz","email":"gabriellaluiz2020@gmail.com","telefone":"+55 (83) 99974-5968","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Monalisa Albertim Silva","email":"monnaalbertim@outlook.com","telefone":"+55 (61) 99806-7012","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Rakeliny Marques Inacio Ferreira","email":"rakelinymarq@gmail.com","telefone":"+55 (62) 99322-3760","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Acilga Kalina Pinto Da Silva","email":"kalina.silvas@gmail.com","telefone":"+55 (91) 98505-1436","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Mariana Assis Lage","email":"marianaalage@gmail.com","telefone":"+55 (31) 99244-7580","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Paula Lima","email":"limapaula1207@gmail.com","telefone":"+55 (41) 99661-7872","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Daisy V Martens","email":"daisyvmpenner@gmail.com","telefone":"+55 (41) 99661-8303","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Veronica De Freitas","email":"veronica.freitas948@gmail.com","telefone":"+55 (61) 99877-9199","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Mayra Almeida","email":"mayrasalmeidaa@gmail.com","telefone":"+55 (85) 99933-7068","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Patricia Brum Roecker","email":"pattybroecker@gmail.com","telefone":"+55 (45) 99993-2266","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Jéssica Do Nascimento Ramos","email":"jelramos43@yahoo.com.br","telefone":"+55 (21) 98225-2470","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Daiane Trajano Sena Da Silva","email":"daiane.ffc@hotmail.com","telefone":"+55 (21) 99425-6255","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Nathalia Marinho Brega","email":"marinhonathalia@hotmail.com","telefone":"+55 (91) 98387-1245","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Estrella Sanchez","email":"cestre.sanchez@gmail.com","telefone":"+55 (27) 99899-9426","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Mariana Mazoni Wanderley","email":"marianamazoniw@gmail.com","telefone":"+55 (31) 99140-2908","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Lydianne Rodrigues De Carvalho","email":"lydiannerc19@gmail.com","telefone":"+55 (31) 98449-7654","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Marina Bassul Evangelista De Oliveira","email":"bassul.marina@gmail.com","telefone":"+55 (61) 98110-4465","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Castanheira Coutinho","email":"jucast@gmail.com","telefone":"+55 (21) 97113-4237","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Maria Rita","email":"mariaritadecarvalhomendonca@gmail.com","telefone":"+55 (64) 99962-8654","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Rafaela Carvalho Faria","email":"rafa.faria85@gmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Gleyce Barbosa Carneiro De Oliveira","email":"gleycebarbosa@yahoo.com.br","telefone":"+55 (21) 98383-2022","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Taís Fernanda Celotto Rovari","email":"trovari@yahoo.com.br","telefone":"+55 (11) 97641-4984","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Ivi Dantas","email":"ivialiana@gmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Karolinne Skarllate Silva Chantal","email":"chantal.karol@gmail.com","telefone":"+55 (61) 98277-3388","produto":"Você Dirige"},
{"nome":"Cássia Rodrigues Arruda Martins","email":"cassia-arruda@hotmail.com","telefone":"+55 (62) 99115-9104","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Lizandra Gabrielle Melim Gamba","email":"lizandragabrielle@hotmail.com","telefone":"+55 (47) 99607-7113","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Gabriela Stein Zacchi","email":"gabi.zacchi@gmail.com","telefone":"+55 (48) 99913-0400","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Daiane Quadros De Araújo","email":"dqdearaujo@gmail.com","telefone":"+55 (71) 99357-5067","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Gilvane Caldeira De Souza","email":"gilvanecaldeira1@gmail.com","telefone":"+55 (62) 98271-6756","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Marina Acioli","email":"marinanoal@gmail.com","telefone":"+55 (11) 98330-0000","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Angela Mendes Ferreira","email":"amenfe.psi@gmail.com","telefone":"+55 (51) 99953-6418","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo com Leticia Cazarré"},
{"nome":"Juliana Bragança","email":"jds.braganca@gmail.com","telefone":"+55 (27) 99794-0428","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Paloma Silva Nogueira","email":"palomasnog@gmail.com","telefone":"+55 (21) 98289-2263","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Adriana Furtado Honório Dornelas","email":"drifhd.81@gmail.com","telefone":"+55 (83) 99887-1111","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Lahyre Izaete Silveira Gomes","email":"lahyrei@gmail.com","telefone":"+55 (38) 99109-4590","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Giovana Straioto De Souza Keuper","email":"gistrasou@yahoo.com.br","telefone":"+55 (21) 98132-4322","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Raquel Guerra","email":"rcavasinig@gmail.com","telefone":"+1 (20) 2823-7604","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Leonice Thomaz","email":"leonicethomazz@gmail.com","telefone":"+55 (11) 98291-0914","produto":"Workshop Plano A I 2025"},
{"nome":"Thais Bajerski","email":"cecilia.tcfc@hotmail.com","telefone":"+55 (77) 99989-2245","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Giovanna C Menegazzi","email":"giiiovannacarvalho@gmail.com","telefone":"+55 (41) 99155-0101","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Erica Timms","email":"ericaztimms@gmail.com","telefone":"+1 (23) 9351-0040","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Amanda Inacio De Souza","email":"amanda.soouza5@gmail.com","telefone":"+55 (64) 99236-1853","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Beatriz Cruz","email":"biamito2022@gmail.com","telefone":"+351 (93) 666-2324","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Daíse De Carvalho Barbosa Costa","email":"daisecarvalhoc@gmail.com","telefone":"+55 (86) 99452-9960","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Priscilla Ferreira","email":"cillabatista@gmail.com","telefone":"+55 (82) 99919-8081","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Rachel Viegas","email":"rachelviegas2024@gmail.com","telefone":"+1 (80) 5795-6717","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Beatriz Andrade De Oliveira","email":"b.cursos@icloud.com","telefone":"+55 (11) 98174-9918","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Caroline","email":"contato.caroladamy@gmail.com","telefone":"+55 (54) 99999-3469","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Pimenta Trevisan","email":"jpimentasilva@gmail.com","telefone":"+55 (44) 99970-6685","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Christiane Cecilio","email":"christianeps@hotmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Maria Izabel Pereira Mattos Mendes","email":"belmattos.cpa@gmail.com","telefone":"+55 (35) 99704-5347","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Aniela Reis","email":"aniela_alves@yahoo.com.br","telefone":"+55 (24) 92471-3456","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Junia Braz","email":"juniabraz@gmail.com","telefone":"+55 (37) 99982-4241","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Aline Pires","email":"alipires@hotmail.com","telefone":"+55 (61) 99971-4112","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Mariá Vidal Flores","email":"mariahvidalflores@gmail.com","telefone":"+55 (61) 99838-2221","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Mariana R Hendler","email":"mariana.rhendler@icloud.com","telefone":"+55 (51) 98183-4377","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Maria Soares","email":"salotmoura2011@hotmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Jeisa Tartari","email":"jeisatartari@hotmail.com","telefone":"+55 (11) 91137-1209","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Julia Pitangui","email":"juliapitangui@gmail.com","telefone":"+55 (27) 99932-2867","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Narjara Perin Robales","email":"narjara_p@hotmail.com","telefone":"+55 (44) 99142-4993","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Brena Dantas Da Silva","email":"brena.dantas@yahoo.com.br","telefone":"+55 (21) 99976-0308","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Glaucia Machado Alves","email":"gmachadoalves@gmail.com","telefone":"+55 (21) 97934-3264","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Adriana Machado De Oliveira Souza","email":"adriana.mos@hotmail.com.br","telefone":"+55 (24) 98864-1867","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Juliana Royes","email":"ju.royes@gmail.com","telefone":"+55 (51) 99631-2050","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Ana Caroline Mendes","email":"anamendes.cor@gmail.com","telefone":"+55 (67) 99976-0878","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Lígia Melo","email":"ligiaderma@gmail.com","telefone":"","produto":"Workshop - Plano A (Disponível em 15/12); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Juliana Kappaunn","email":"jukappaunn@hotmail.com","telefone":"+55 (21) 99697-9999","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Thatielle Nélia Lopes Da Silva","email":"thatinelia@adv.oabmg.org.br","telefone":"+55 (33) 99906-8640","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Joelma Alves Itokajo","email":"joelma.cursos123@gmail.com","telefone":"+55 (11) 98433-4127","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Thais F A P Kerche","email":"thais@kerche.adv.br","telefone":"+55 (19) 98904-6697","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Celma Quaresma","email":"quaresmacelma1@gmail.com","telefone":"+351 (96) 327-6463","produto":"Workshop - Plano A (Disponível em 15/12)"},
{"nome":"Solange Blanco","email":"solblanco1981@gmail.com","telefone":"+55 (11) 94736-5763","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Rita De Cássia Esequiel Costa Da Rocha","email":"ritaesequiel@hotmail.com","telefone":"+55 (87) 98101-7071","produto":"Você Dirige"},
{"nome":"Taiane Quintanilha","email":"ss.taiane@hotmail.com","telefone":"+55 (22) 99831-9885","produto":"Workshop Plano A I 2025"},
{"nome":"Marcela Da Silva Aquino Vilaça","email":"marcelaaquino.arq@gmail.com","telefone":"+55 (31) 99143-7211","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Eva Besso","email":"evabesso@hotmail.com","telefone":"+55 (66) 99998-0648","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Nayana Meireles","email":"naymeireless@icloud.com","telefone":"+55 (62) 99641-1143","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Maria Eduarda De Almeida Souza","email":"mariaealmeidasz@gmail.com","telefone":"+55 (38) 99946-3472","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Rafaela Freitas Rodrigues Veloso","email":"rafa.freitas.r@hotmail.com","telefone":"+61 (04) 7869-0164","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Doris Padilha","email":"dorispadilha.arq@gmail.com","telefone":"+55 (42) 99993-6320","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Daiane Braun Braun","email":"daiii_braun@hotmail.com","telefone":"+55 (66) 99663-0035","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Francisco Eugênio","email":"franciscoeugeniodesigner@gmail.com","telefone":"+55 (61) 99867-9408","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Andressa Barros","email":"andressa.apolinario@gmail.com","telefone":"+55 (11) 95496-4176","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Júlia Maximo Belo Santos","email":"juh.mbs@hotmail.com","telefone":"+55 (22) 99898-3433","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Andréia Mallon","email":"andreia1011@hotmail.com","telefone":"+55 (49) 99110-0000","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Ana Caroline Araujo Vieira Santos","email":"acarolinearaujovieira@gmail.com","telefone":"+55 (11) 97242-7829","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Juliana Azevedo Gonçalves","email":"julianaagoncalves@hotmail.com","telefone":"+55 (51) 99691-4099","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Larissa Maria Feitosa Gonçalves","email":"assiralm@gmail.com","telefone":"+55 (89) 99938-7804","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Vívian May","email":"viviancultur@gmail.com","telefone":"+55 (24) 98816-0506","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Vivian Palhano Dos Santos","email":"vivianpalhano82@gmail.com","telefone":"+55 (85) 99804-0633","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Patricia De Araujo Carneiro","email":"pacarneiro@gmail.com","telefone":"+55 (21) 99634-4674","produto":"Workshop Plano A I 2026 (Lançamento); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Luana Kahara","email":"luana_kahara@hotmail.com","telefone":"+55 (65) 98411-3662","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Natalí Paiva","email":"natalipaivaa@gmail.com","telefone":"+55 (81) 99322-8862","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Adelina Feitosa Feitosa","email":"dra.adelinafeitosa@gmail.com","telefone":"+55 (85) 98200-2273","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Silvia Longuinho","email":"slonguinho@yahoo.com.br","telefone":"+55 (11) 93005-4680","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Milene Lopes Frota","email":"frota.milene@gmail.com","telefone":"","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Helenice Feijó De Carvalho","email":"helenicecarvalho@uol.com.br","telefone":"+55 (21) 99968-5663","produto":"Workshop Plano A I 2026 (Lançamento); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Ana Cristina Garcia Lopes Cavaleiro","email":"anacavaleiro91@gmail.com","telefone":"+351 (96) 848-4112","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Lilian Rita De Souza Meireles","email":"lrsmeireles@gmail.com","telefone":"+55 (73) 98126-9636","produto":"Você Dirige"},
{"nome":"Norrara Lima Santana","email":"norrarals@gmail.com","telefone":"+55 (94) 99152-2329","produto":"Você Dirige"},
{"nome":"Jecika Raquel Santos","email":"jessica.cipriano17@outlook.com","telefone":"+55 (11) 95714-6937","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Camila Santos Lameu Gomes","email":"camilameu28@gmail.com","telefone":"+55 (15) 99779-5400","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Raissa Aires Ribeiro Bringel Teixeira","email":"raissaabringel@gmail.com","telefone":"+55 (16) 99118-7268","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Lorena Seabra Fernandes","email":"seabra_lorena@hotmail.com","telefone":"+55 (62) 98235-9565","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Francisca Carliana Santos Lima","email":"carlianalima@yahoo.com.br","telefone":"+55 (85) 98750-1066","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Tainá Taina","email":"tmcvadvocacia@gmail.com","telefone":"+55 (21) 99782-5528","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Ana Kleyce Correia Rocha","email":"anakleycecr@hotmail.com","telefone":"+55 (84) 98888-3968","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Aline Da Costa Matos","email":"line0493207@gmail.com","telefone":"+55 (33) 98807-6981","produto":"Você Dirige"},
{"nome":"Gabriela Oliveira Elesbao","email":"gabrielaoliveiraelesbao@gmail.com","telefone":"+55 (51) 99275-6029","produto":"Você Dirige"},
{"nome":"Thaisa","email":"thaisa.silvarj@gmail.com","telefone":"+55 (21) 98106-6373","produto":"Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Fabiana Mello","email":"melofabi@yahoo.com.br","telefone":"+55 (11) 99560-2433","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Emanoella Carla Melo Da Silva","email":"manoelamelo@yahoo.com.br","telefone":"+55 (11) 95478-9725","produto":"Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Marize Carvalho Coutinho Do Patrocinío Freitas","email":"marize18@hotmail.com","telefone":"+55 (62) 98422-1803","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Adriana Mastrella Fernandes","email":"adrimastrella@yahoo.com.br","telefone":"+55 (21) 96929-0033","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Emanoella Carla Melo Da Silva","email":"manoelamelo@yahoo.com.br","telefone":"+55 (11) 95478-9725","produto":"A Estrategista: Planejamento Anual com Leticia Cazarré"},
{"nome":"Juliane Dos Santos Gomes","email":"gomesjuliane52@yahoo.com","telefone":"+55 (31) 98437-8106","produto":"Você Dirige"},
{"nome":"Aguida Carvalho Luz","email":"aguida_luz@hotmail.com","telefone":"+55 (47) 99677-1066","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Monica C M Lemes","email":"monicaufg1@gmail.com","telefone":"+55 (64) 99627-5246","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Elaine Aparecida Botacin Rozante","email":"kidcoach.elaine@gmail.com","telefone":"+55 (19) 99845-0542","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Jhessica Carvalho Neckel","email":"jhessicathauane@gmail.com","telefone":"+55 (66) 99920-5110","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Aline De Sousa Miranda","email":"alinesousamirand4@gmail.com","telefone":"+55 (45) 99155-7430","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Renata Cristina Pinto Mansilha De Oliveira","email":"remansilha@yahoo.com.br","telefone":"+55 (21) 99194-1460","produto":"Você Dirige"},
{"nome":"Cristiane Alvarenga","email":"crikamat@gmail.com","telefone":"+55 (24) 99315-4224","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Rafaela Fumagalli","email":"rafaelacotrim1@gmail.com","telefone":"+55 (11) 98233-3867","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Talita Pinheiro Mar","email":"agolemar@gmail.com","telefone":"+55 (92) 98235-8138","produto":"Você Dirige"},
{"nome":"Sabrina Aparecida Grigolete Liberati","email":"sgrigol@hotmail.com","telefone":"+55 (16) 98802-0228","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Marina Bulcao","email":"marinamfbulcao@gmail.com","telefone":"+55 (21) 97977-6667","produto":"Workshop Plano A I 2026 (Lançamento); Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Camila Cardoso","email":"camila.cardoso25@hotmail.com","telefone":"+55 (11) 98262-5158","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Marcia Assis","email":"marciajoca@yahoo.com","telefone":"","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Tatiane Ribeiro De Mattos","email":"tribeiro.mattos@gmail.com","telefone":"+55 (11) 99585-3134","produto":"Você Dirige"},
{"nome":"Camila Thaís Nerbas","email":"arq.nerbas@gmail.com","telefone":"+55 (51) 98522-5448","produto":"Você Dirige"},
{"nome":"Melissa Montandon","email":"melissamontandon@hotmail.com","telefone":"+55 (31) 98795-3677","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Diana Maria Gomes Do Nascimento Locio Pires","email":"didalocio@yahoo.com.br","telefone":"+55 (81) 99192-6881","produto":"Workshop Plano A I 2026 (Lançamento)"},
{"nome":"Alessandra Hellbrugge","email":"nutrihellbrugge@gmail.com","telefone":"+55 (48) 99190-1929","produto":"Você Dirige"},
{"nome":"Adriana De Sousa Mastrella Fernandes","email":"adrimastrella@yahoo.com.br","telefone":"+55 (21) 96929-0033","produto":"A Estrategista: Planejamento Anual com Leticia Cazarré"},
{"nome":"Márcia Nascimento","email":"nilopolis.rj@thekidsclub.com.br","telefone":"+55 (21) 98459-5084","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Amanda Botin Pasinato","email":"amanda.botin17@gmail.com","telefone":"+55 (28) 99981-8157","produto":"Workshop Plano A | 2026"},
{"nome":"Marcela Maria Correa Hilgemberg","email":"mahilgemberg89@gmail.com","telefone":"+55 (44) 99159-5080","produto":"Você Dirige"},
{"nome":"Ana Flávia Santa Cruz De Almeida","email":"anafavah@gmail.com","telefone":"+55 (61) 99209-1904","produto":"Você Dirige"},
{"nome":"Ana Isabel Abreu Farinha Da Silva","email":"anafarinha@me.com","telefone":"+351 (96) 823-0975","produto":"A Estrategista: Planejamento Anual com Leticia Cazarré"},
{"nome":"Veronica De Freitas","email":"veronica.freitas948@gmail.com","telefone":"+55 (61) 99877-9199","produto":"Você Dirige"},
{"nome":"Cristiane Augusto Parada","email":"crisaugparada@gmail.com","telefone":"+55 (11) 98187-8569","produto":"Você Dirige"},
{"nome":"Ana Cristina Botelho Pinho","email":"anabotelhopinho@icloud.com","telefone":"+55 (31) 99735-7017","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Rosangela Macedo Quezada","email":"ronutri52@gmail.com","telefone":"+55 (43) 99122-8589","produto":"Você Dirige"},
{"nome":"Maira Fernanda Bardi Pedro Ranieri","email":"mairapedroranieri@gmail.com","telefone":"+55 (18) 99114-8323","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Glauciane Gonçalves","email":"glaucianemota84@hotmail.com","telefone":"+55 (35) 99156-2938","produto":"Workshop Plano A | 2026"},
{"nome":"Luciane Da Silva Madruga Freitag","email":"lucianemadrugafreitag@gmail.com","telefone":"+55 (51) 99993-0525","produto":"Você Dirige"},
{"nome":"Ivelony Campos Zilmar Do Nascimento","email":"ivelony@yahoo.com.br","telefone":"+55 (38) 99960-0598","produto":"Você Dirige"},
{"nome":"Camilla De Moraes Pereira","email":"camillamp23@gmail.com","telefone":"+55 (21) 96922-6475","produto":"Workshop Plano A | 2026"},
{"nome":"Vanessa Maia","email":"vanessapmaia@hotmail.com","telefone":"+55 (41) 98891-5863","produto":"Você Dirige"},
{"nome":"Cristina Lousada","email":"cristinalousada@uol.com.br","telefone":"+55 (22) 99974-6733","produto":"Você Dirige"},
{"nome":"Fabiana Da Silva França","email":"ffazinha22@gmail.com","telefone":"+55 (12) 99703-3888","produto":"Você Dirige"},
{"nome":"Andréia Aparecida Heck Posselt","email":"andreiahp@hotmail.com","telefone":"+55 (69) 99962-4347","produto":"Você Dirige"},
{"nome":"Rubia Vissotto","email":"rubiavissotto@yahoo.com.br","telefone":"+55 (66) 99981-4686","produto":"Você Dirige"},
{"nome":"Camilla De Moraes Pereira","email":"camillamp23@gmail.com","telefone":"+55 (21) 96922-6475","produto":"Você Dirige"},
{"nome":"Francianne Andrade","email":"francianneandrade@gmail.com","telefone":"+55 (21) 99690-9268","produto":"Você Dirige"},
{"nome":"Guilhermina Monteiro","email":"minamon_25@hotmail.com","telefone":"","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Marília Rigamonte Monteiro Mattiazzo","email":"marilia.mattiazzo@gmail.com","telefone":"+55 (67) 99688-1008","produto":"Você Dirige"},
{"nome":"Taciana Oliveira Martins Kosloski","email":"oliveirataci@live.com","telefone":"+55 (34) 99707-6161","produto":"Workshop Plano A | 2026"},
{"nome":"Suellem Stephanie S Silva","email":"suellem_stephanie@hotmail.com","telefone":"+55 (94) 99232-5058","produto":"Workshop Plano A | 2026"},
{"nome":"Natália Rostiane Ferreira Carneiro","email":"nataliarostiane@hotmail.com","telefone":"+55 (81) 99893-3935","produto":"Você Dirige"},
{"nome":"Isabela Assis Pereira","email":"assispisabela@gmail.com","telefone":"+55 (31) 98711-4399","produto":"Você Dirige"},
{"nome":"Adriana Pedroso De Oliveira","email":"dricapedrosop@gmail.com","telefone":"+55 (33) 99115-4935","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Claudiene Martins Gonçalves","email":"claudienemartinsgoncalves@gmail.com","telefone":"+55 (31) 99961-3711","produto":"Você Dirige"},
{"nome":"Marta Giannichi","email":"martagiannichi@gmail.com","telefone":"+55 (11) 98108-6203","produto":"Você Dirige"},
{"nome":"Ângela Santana Gomes De Oliveira","email":"angelasantanagomesdeoliveira@gmail.com","telefone":"+55 (43) 99143-6472","produto":"Você Dirige"},
{"nome":"Luana Kahara Karasiaki Fortes Coleta","email":"luana_kahara@hotmail.com","telefone":"+55 (65) 98411-3662","produto":"Você Dirige"},
{"nome":"Luciana Tambellini","email":"lutambellini32@hotmail.com","telefone":"+55 (11) 95755-8585","produto":"Você Dirige"},
{"nome":"Francelise Luzzi Ceron","email":"francelise.luzzi@gmail.com","telefone":"+55 (41) 98400-2691","produto":"Workshop Plano A | 2026"},
{"nome":"Ariane Furlan Rivera","email":"ariane.gimenes@hotmail.com","telefone":"+55 (11) 97386-2891","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Clarissa De Mello Arruda Ribeiro","email":"clarissa.4kids@hotmail.com","telefone":"+55 (21) 98891-9114","produto":"Você Dirige"},
{"nome":"Marcela Melo","email":"marcelamelopl@outlook.com","telefone":"+55 (62) 99191-5045","produto":"Você Dirige"},
{"nome":"Ana Isabel Abreu Farinha Da Silva","email":"anafarinha@me.com","telefone":"+351 (96) 823-0975","produto":"A Estrategista: Planejamento Anual com Leticia Cazarré"},
{"nome":"Jéssica Fernanda De Melo","email":"seuprojeto.a2@gmail.com","telefone":"+351 (93) 177-8737","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Stephanie Mines","email":"stephaniemines@gmail.com","telefone":"+55 (31) 98330-2121","produto":"Você Dirige"},
{"nome":"Príscilla Figueiredo Gomes","email":"administrativo@drogarianavegantes.com.br","telefone":"+55 (22) 99811-7030","produto":"Você Dirige"},
{"nome":"Gabriela Rocha De Jesus Ringuier","email":"gabiringuier@gmail.com","telefone":"+55 (28) 99993-8286","produto":"Você Dirige"},
{"nome":"Bárbara Dantas De Araújo Medeiros","email":"barbaradamedeiros@gmail.com","telefone":"+55 (84) 98181-1881","produto":"A Estrategista - Turma 2"},
{"nome":"Joyce Carla Dos Santos","email":"joycerezende17@gmail.com","telefone":"+55 (31) 99766-1211","produto":"Você Dirige"},
{"nome":"Roberta Targino Studart","email":"targinoroberta@gmail.com","telefone":"+55 (85) 98843-2604","produto":"Você Dirige"},
{"nome":"Daiana Marodin De França Holanda","email":"daianamarodin@gmail.com","telefone":"+55 (51) 98329-6577","produto":"Você Dirige; LCz STYLE GUIDE 3.0 + Bônus Guia de Compras"},
{"nome":"Marina Goulart","email":"marinangoulart@gmail.com","telefone":"+55 (21) 98796-0399","produto":"Você Dirige"},
{"nome":"Sandra Crivellaro Cunha","email":"scrivell@gmail.com","telefone":"+1 (30) 1395-1969","produto":"Você Dirige"},
{"nome":"Tagora Do Lago Santos","email":"tagora22@hotmail.com","telefone":"+55 (86) 99939-8955","produto":"Você Dirige"},
{"nome":"Thallyta Amato Florencio Wentworth","email":"thallytaamato@gmail.com","telefone":"+1 (91) 3999-6655","produto":"Você Dirige"},
{"nome":"Adriane Ávila Dos Anjos Gomes","email":"adrianeavila48@gmail.com","telefone":"+55 (11) 99341-4899","produto":"Você Dirige"},
{"nome":"Jessica Fernanda Natividade Pimenta","email":"jessicapimenta.agro@gmail.com","telefone":"+55 (66) 99952-9988","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Rita Oliveira Sodré Alencar Machado","email":"ritamacpsi@gmail.com","telefone":"+55 (74) 98835-8251","produto":"Você Dirige"},
{"nome":"Katiane De Oliveira Odorizzi","email":"katyoodorizzi@outlook.com","telefone":"+55 (43) 99819-0580","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Tairis Aparecida Vieira Pacanaro","email":"desenvolvapsicologia@gmail.com","telefone":"+55 (11) 99291-0935","produto":"Você Dirige"},
{"nome":"Jéssica Fernanda Natividade Pimenta","email":"jessicapimenta.agro@gmail.com","telefone":"+55 (66) 99952-9988","produto":"Você Dirige"},
{"nome":"Aline Vieira De Melo Farias","email":"aline.vdmfarias@gmail.com","telefone":"+55 (11) 97977-2553","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Vanessa Sabrina Prado Dos Santos","email":"vanessasabrinaprado@hotmail.com","telefone":"+55 (43) 99959-7026","produto":"Você Dirige"},
{"nome":"Sandra Cristina De Souza Barbosa","email":"sandracristinasb@yahoo.com.br","telefone":"+55 (62) 98474-0215","produto":"Você Dirige"},
{"nome":"Ana Claudia Novelini De Amorim","email":"ana.amorim.fr@gmail.com","telefone":"+55 (17) 99108-9918","produto":"Você Dirige"},
{"nome":"Carolina Mello Teixeira Pitzer","email":"carolmt.pitzer@gmail.com","telefone":"+244 (97) 235-9022","produto":"Você Dirige; Workshop Plano A | 2026"},
{"nome":"Karina Guedes Reis","email":"krn.guedes@gmail.com","telefone":"+1 (61) 7470-2929","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Lydianne Rodrigues De Carvalho","email":"lydiannerc19@gmail.com","telefone":"+55 (31) 98449-7654","produto":"Você Dirige"},
{"nome":"Lucienne Cristina De Campos Alves Zaneti","email":"lucienne.zaneti@gmail.com","telefone":"+55 (11) 98278-9791","produto":"A Estrategista - Turma 2"},
{"nome":"Evelin Louback Weber","email":"eve_louback@hotmail.com","telefone":"+55 (21) 98271-6538","produto":"Você Dirige"},
{"nome":"Chanara Cuquetto Ortulan","email":"chanarinha@hotmail.com","telefone":"+55 (27) 99755-2892","produto":"Workshop Plano A | 2026; LCz STYLE GUIDE 3.0 + Bônus Guia de Compras"},
{"nome":"Ludimila Mazioli Camporez Perim","email":"ludimila.camporez@gmail.com","telefone":"+55 (27) 98823-4020","produto":"A Estrategista - Turma 2"},
{"nome":"Thais Abath","email":"thaisabath.nutri@gmail.com","telefone":"","produto":"Workshop Plano A | 2026"},
{"nome":"Carolina Cetenareski","email":"aussiecete@gmail.com","telefone":"+27 (07) 6485-9610","produto":"A Estrategista - Turma 2"},
{"nome":"Isabela Maria Da Silva Marroso Barbalho","email":"isabelamarroso@gmail.com","telefone":"+55 (22) 99624-0903","produto":"Você Dirige"},
{"nome":"Fernanda Cardia","email":"fmpcardia@gmail.com","telefone":"+1 (41) 6809-6620","produto":"Workshop Plano A | 2026"},
{"nome":"Vanessa Pereira Bianchin","email":"vanessa.pb@hotmail.com","telefone":"+55 (65) 99289-4676","produto":"Você Dirige"},
{"nome":"Glaucy Adriany Almeida Palheta","email":"gapalheta@yahoo.com.br","telefone":"+55 (91) 98119-7780","produto":"Você Dirige"},
{"nome":"Thaís Naves","email":"thaisabath.nutri@gmail.com","telefone":"","produto":"Você Dirige"},
{"nome":"Ramona Cardoso Vieira","email":"ramona.cardoso.vieira@gmail.com","telefone":"+55 (11) 94982-8950","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Maria Florencia Saladino","email":"saladino.mflorencia@gmail.com","telefone":"+351 (92) 319-4637","produto":"Você Dirige"},
{"nome":"Emilia Sales Moreno","email":"emiliasalesmoreno@gmail.com","telefone":"+55 (43) 98479-1607","produto":"Você Dirige"},
{"nome":"Patrícia Valério Orlandi Falbo","email":"patricia_orlandi@hotmail.com","telefone":"","produto":"Workshop Plano A | 2026"},
{"nome":"Cynthia Fernandes Leite","email":"datacyn@gmail.com","telefone":"+55 (62) 99398-7706","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Ursula Lisboa Rossi","email":"ursula.olivenca@gmail.com","telefone":"+39 (32) 7328-9327","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Thaisa Da Silva Hernandez","email":"thaisa.silvarj@gmail.com","telefone":"+55 (21) 98106-6373","produto":"Você Dirige"},
{"nome":"Aline Vieira De Melo Farias","email":"aline.vdmfarias@gmail.com","telefone":"+55 (11) 97977-2553","produto":"Você Dirige"},
{"nome":"Cintia Santos De Souza","email":"cintiasscosta@gmail.com","telefone":"+55 (83) 98702-2194","produto":"Você Dirige"},
{"nome":"Marina Peccin E Silva Bertocco","email":"mapeccin@hotmail.com","telefone":"+55 (16) 99714-7305","produto":"Você Dirige"},
{"nome":"Vanderleia Aparecida Ferreira De Campos","email":"fvanderleia449@gmail.com","telefone":"+55 (15) 99659-1791","produto":"Você Dirige"},
{"nome":"Daniella Galavotti B Ribeiro","email":"danigalavotti@hotmail.com","telefone":"+55 (27) 98888-7473","produto":"Você Dirige"},
{"nome":"Aliny Rayze Rodrigues De Souza Lopes","email":"alinyrayze@gmail.com","telefone":"+55 (27) 99621-9332","produto":"Vida, Carreira e Negócios - Leticia Cazarré"},
{"nome":"Rafaela Oliveira Calvo","email":"rafaelaocalvo@gmail.com","telefone":"+55 (31) 99701-3854","produto":"Workshop Plano A | 2026"},
{"nome":"Giselle Da Silva Cunha","email":"giselle.sclima@yahoo.com.br","telefone":"+55 (11) 98422-8822","produto":"Você Dirige"},
{"nome":"Beatriz Rodrigues Batista Machado","email":"beatrizrbmachado.adv@gmail.com","telefone":"+55 (62) 99170-8403","produto":"Você Dirige"},
{"nome":"France Rigue","email":"france.rigue@gmail.com","telefone":"","produto":"Você Dirige"},
{"nome":"Amanda Ribeiro Da Fonseca Okiyama","email":"amandaokiyama@hotmail.com","telefone":"+55 (61) 98216-0703","produto":"Você Dirige"},
{"nome":"Isabella Menegazzi","email":"isabella.menegazzi@gmail.com","telefone":"+55 (61) 98116-8073","produto":"Workshop Plano A | 2026; LCz STYLE GUIDE 3.0 + Bônus Guia de Compras"},
{"nome":"Paula Carneiro De Albuquerque Wanderley","email":"paulacarneiro.a@gmail.com","telefone":"+55 (82) 99932-0245","produto":"Você Dirige; LCz STYLE GUIDE 3.0 + Bônus Guia de Compras"},
{"nome":"Mariana Pugliese De Andrade","email":"m.puglieseandrade@gmail.com","telefone":"+55 (11) 99952-0392","produto":"Você Dirige"},
{"nome":"Ana Isabel Abreu Farinha Da Silva","email":"anafarinha@me.com","telefone":"+351 (96) 823-0975","produto":"A Estrategista - Turma 1: Planejamento Anual com Leticia Cazarré"},
{"nome":"Taís Scaff De Mello","email":"taiscaff@gmail.com","telefone":"+55 (19) 99981-8454","produto":"Você Dirige"},
{"nome":"Carina Sueth","email":"carinarodrigues96@hotmail.com","telefone":"+55 (22) 99883-6113","produto":"Você Dirige"},
{"nome":"Judith Tenório Dos Santos Aguerssif","email":"jutesantos@hotmail.com","telefone":"+55 (21) 98862-9667","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Sandra Lucia Vasconcelos Rocha","email":"slvrocha@gmail.com","telefone":"+55 (82) 99610-6812","produto":"Você Dirige"},
{"nome":"Patricia Antunes Travassos Souto","email":"patycomorg@gmail.com","telefone":"+55 (61) 99656-9198","produto":"Você Dirige"},
{"nome":"Michelle De Moura Andrade Batista","email":"michellemabatista@gmail.com","telefone":"+55 (37) 99966-1164","produto":"Você Dirige"},
{"nome":"Doris Padilha","email":"dorispadilha.arq@gmail.com","telefone":"+55 (42) 99993-6320","produto":"Você Dirige"},
{"nome":"Camila Morgado","email":"cmorgadonogueira@gmail.com","telefone":"+55 (21) 97242-2312","produto":"Você Dirige"},
{"nome":"Analu Alves Andrade Martini","email":"analuaandrade@hotmail.com","telefone":"+55 (45) 98433-9984","produto":"Você Dirige"},
{"nome":"Rosana Batista Leal Rodrigues","email":"rosanalealrodrigues@gmail.com","telefone":"+55 (83) 98803-0138","produto":"Você Dirige"},
{"nome":"Elisa Dias","email":"elisadias692@gmail.com","telefone":"","produto":"Workshop Plano A | 2026"},
{"nome":"Marcella Cristina Alves Garcia","email":"marcellagarcia50@gmail.com","telefone":"+55 (34) 98849-6660","produto":"Workshop Plano A | 2026"},
{"nome":"Giseli De Andrade Flores","email":"giseli.andrade21@gmail.com","telefone":"+1 (78) 1420-5066","produto":"Workshop Plano A | 2026"},
{"nome":"Celi Vinagre Oliveira Ferreira","email":"celimelhormae@gmail.com","telefone":"+55 (21) 99864-3847","produto":"Workshop Plano A | 2026; Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Natalia C Andrade Scremin","email":"natalia_crepaldi@hotmail.com","telefone":"+55 (12) 99602-0863","produto":"Você Dirige"},
{"nome":"Paloma Aparecida Queiroz","email":"paqueiroz10@gmail.com","telefone":"+55 (61) 99161-3454","produto":"Vida, Carreira e Negócios - Leticia Cazarré"},
{"nome":"Cris Alberti","email":"crisalbertipersonal@gmail.com","telefone":"+55 (21) 99281-2384","produto":"Workshop Plano A | 2026"},
{"nome":"Keli Lima Ribeiro","email":"kelir.lima@gmail.com","telefone":"+55 (41) 99280-0822","produto":"Workshop Plano A | 2026"},
{"nome":"Edna Patricia Alves Borges Braziel","email":"ednappsi@outlook.com","telefone":"+55 (62) 99156-1339","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Isaura Condé Araújo De Paula Assis","email":"isauraaraujo@hotmail.com","telefone":"+55 (11) 91598-4414","produto":"Você Dirige"},
{"nome":"Mariana Nóbrega Gonçalves Lima","email":"nobregamariana@gmail.com","telefone":"+55 (16) 99380-1732","produto":"Workshop Plano A | 2026"},
{"nome":"Giovana Marques","email":"giovanafcn@gmail.com","telefone":"+55 (12) 99193-9292","produto":"Você Dirige"},
{"nome":"Erivalda Ferreira Rocha","email":"valrochaagape@gmail.com","telefone":"+55 (21) 98606-7235","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Kelly Xavier De Mello Nalin","email":"kxdemello@gmail.com","telefone":"+55 (21) 99762-1042","produto":"Workshop Plano A | 2026; Gravação da aula ao vivo (Tira dúvidas) com Leticia Cazarré"},
{"nome":"Marcella Costa Oliveira Ribeiro","email":"psi.marcellacosta@gmail.com","telefone":"+55 (11) 96827-4332","produto":"Você Dirige"},
{"nome":"Sandra Maria De Jesus","email":"smaria.sandra@gmail.com","telefone":"+55 (31) 97572-9856","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Lina Carvalho Nascimento Carvalho","email":"linapca@gmail.com","telefone":"+55 (63) 99279-2282","produto":"Workshop - Plano A (Pré-Venda)"},
{"nome":"Nathália Valeska Do Nascimento Guimarães","email":"nathaliaguimaraesvlk29@gmail.com","telefone":"+55 (84) 98801-2515","produto":"Você Dirige"},
{"nome":"Angela Mendes Ferreira","email":"amenfe.psi@gmail.com","telefone":"+55 (51) 99953-6418","produto":"Você Dirige"},
{"nome":"Ana Flávia Cardoso De Paula","email":"whois.anah@icloud.com","telefone":"+55 (35) 99743-2507","produto":"Você Dirige"},
{"nome":"Chaene De Azevedo Da Silva Moraes","email":"chaene_azevedo@yahoo.com.br","telefone":"+55 (22) 99234-4368","produto":"Você Dirige"},
{"nome":"Adriana De Sousa Mastrella Fernandes","email":"adrimastrella@yahoo.com.br","telefone":"+55 (21) 96929-0033","produto":"A Estrategista: Planejamento Anual com Leticia Cazarré"},
{"nome":"Adriana De Sousa Mastrella Fernandes","email":"adrimastrella@yahoo.com.br","telefone":"+55 (21) 96929-0033","produto":"A Estrategista - Turma 1: Planejamento Anual com Leticia Cazarré"},
{"nome":"Luciana Íris Rodrigues De Sousa Ribeiro","email":"lucianaribeiro.solutt@gmail.com","telefone":"+55 (12) 99107-9589","produto":"Você Dirige"},
{"nome":"Rafaela Cotrim Fumagalli","email":"rafaelacotrim1@gmail.com","telefone":"+55 (11) 98233-3867","produto":"Você Dirige"},
{"nome":"Any Kessler Pereira Sousa","email":"anykesslersilva@gmail.com","telefone":"+55 (11) 95455-5013","produto":"Você Dirige"},
{"nome":"Maria Eduarda Almeida Souza","email":"mariaealmeidasz@gmail.com","telefone":"+55 (38) 99946-3472","produto":"Você Dirige"},
{"nome":"Maria Jéssica Freitas Da Silva Gonzalez","email":"jessicafsgonzalez@gmail.com","telefone":"+55 (85) 98963-4447","produto":"Você Dirige"},
{"nome":"Josiane Vian","email":"josivian10@gmail.com","telefone":"+55 (45) 99922-1247","produto":"Você Dirige"},
{"nome":"Aniele Starck","email":"anieleberticelli@gmail.com","telefone":"+55 (46) 99903-8616","produto":"A Estrategista - Turma 2"},
{"nome":"Jaqueline De Almeida Marcelino","email":"jaqueline.almeidamarcelino@gmail.com","telefone":"+55 (73) 99975-6169","produto":"Você Dirige"},
{"nome":"Patricia Brum Roecker","email":"pattybroecker@gmail.com","telefone":"+55 (45) 99993-2266","produto":"Você Dirige"},
{"nome":"Fernanda Ziemann Cordeiro","email":"fz.cordeiro@gmail.com","telefone":"+55 (47) 98909-6259","produto":"A Estrategista - Turma 2"},
{"nome":"Maisa Aparecida Requena Pereira","email":"maisrequena@gmail.com","telefone":"+55 (11) 97270-7124","produto":"Você Dirige; LCz STYLE GUIDE - 40 itens fundamentais"},
{"nome":"Beatriz Kaiser De Castro","email":"beatrizkaiser90@gmail.com","telefone":"+55 (43) 99118-8100","produto":"Você Dirige"},
{"nome":"Maria Sílvia Rodrigues Alves","email":"masilrodriguesalves@gmail.com","telefone":"+55 (16) 98138-9452","produto":"Você Dirige"},
{"nome":"Aliny Rayze Rodrigues De Souza Lopes","email":"alinyrayze@gmail.com","telefone":"+55 (27) 99621-9332","produto":"Vida, Carreira e Negócios - Leticia Cazarré"},
{"nome":"Thassia Gomes Moreira","email":"thassiagmbio@gmail.com","telefone":"+55 (62) 99528-9012","produto":"Você Dirige"},
{"nome":"Samara Dias","email":"samaravieira23d@gmail.com","telefone":"+55 (21) 97113-2017","produto":"Você Dirige"},
{"nome":"Beatriz Redondo","email":"redondoribeirobeatriz@gmail.com","telefone":"+55 (14) 99885-4455","produto":"Você Dirige"},
{"nome":"Danielly T Silva","email":"dtiepo@gmail.com","telefone":"+55 (44) 99844-8034","produto":"Você Dirige"},
{"nome":"Maria J S Q Silva","email":"jailmasantanaqueiroz@gmail.com","telefone":"+55 (87) 99637-2111","produto":"Você Dirige"},
{"nome":"Jucimara Da Silva Vieira","email":"maraflorlumiar@gmail.com","telefone":"+55 (71) 99914-8348","produto":"Vida, Carreira e Negócios - Leticia Cazarré"},
{"nome":"Roselane Gonzalez Do Nascimento Almeida","email":"gonzalez.rgn@gmail.com","telefone":"+55 (21) 99195-9540","produto":"Você Dirige"},
];

/**
 * Process raw CSV data: split multi-product entries, merge by email, normalize product names
 */
export function processAlunos(): Aluno[] {
  // Merge original data + Hotmart data
  const ALL_DATA: AlunoRaw[] = [...RAW_DATA, ...HOTMART_DATA];

  // First expand: each raw row may contain multiple products separated by ";"
  const expanded: AlunoRaw[] = [];
  for (const row of ALL_DATA) {
    const products = row.produto.split(";").map(p => p.trim()).filter(Boolean);
    for (const prod of products) {
      expanded.push({ ...row, produto: prod });
    }
  }

  // Group by email (lowercase) to merge same-person entries
  const byEmail = new Map<string, { nome: string; email: string; telefone: string; allProducts: string[]; tags: Set<string> }>();

  for (const row of expanded) {
    const key = row.email.toLowerCase().trim();
    if (!byEmail.has(key)) {
      byEmail.set(key, {
        nome: row.nome,
        email: row.email,
        telefone: row.telefone,
        allProducts: [],
        tags: new Set<string>(),
      });
    }
    const entry = byEmail.get(key)!;
    // Use the longest name variation
    if (row.nome.length > entry.nome.length) {
      entry.nome = row.nome;
    }
    // Use phone if present
    if (row.telefone && !entry.telefone) {
      entry.telefone = row.telefone;
    }
    entry.allProducts.push(row.produto);
    // Propagate tags from origem
    if (row.origem) {
      entry.tags.add(row.origem);
    }
  }

  // Convert to Aluno[]
  const alunos: Aluno[] = [];
  let idx = 0;
  for (const [, entry] of byEmail) {
    const normalizedProducts = entry.allProducts.map(normalizeProductName);
    const uniqueProducts = Array.from(new Set(normalizedProducts));
    alunos.push({
      id: `aluno-${idx++}`,
      nome: entry.nome,
      email: entry.email,
      telefone: entry.telefone,
      produtos: entry.allProducts,
      produtosUnicos: uniqueProducts,
      isMultiProduto: uniqueProducts.length > 1,
      tags: Array.from(entry.tags),
    });
  }

  return alunos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// Product color mapping
export const PRODUCT_COLORS: Record<string, string> = {
  "Workshop - Plano A": "#C4A47C",
  "Você Dirige": "#7A8B6F",
  "A Estrategista": "#A66B4A",
  "A Estrategista - Turma 1": "#A66B4A",
  "A Estrategista - Turma 2": "#8B5E3C",
  "Gravação Aula ao Vivo": "#8A8275",
  "LCz Style Guide 3.0": "#B8956A",
  "LCz Style Guide - 40 Itens": "#D4A574",
  "LCz Style Guide": "#B8956A",
  "Vida, Carreira e Negócios": "#5C6B5A",
  "Imersão Plano A": "#9B7B5E",
  "Imersão Plano A - Gravação": "#8A6E52",
};

export function getProductColor(product: string): string {
  return PRODUCT_COLORS[product] || "#8A8275";
}
