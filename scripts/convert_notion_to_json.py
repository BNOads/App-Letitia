#!/usr/bin/env python3
"""
Convert Notion HTML exports to a JSON file with markdown content.
This JSON will be imported via the app's seeder.
"""

import os
import re
import json
from html.parser import HTMLParser

NOTION_DIR = "/Users/jpconfins/Movies/App Letitia/Notion transfer/[LC] Materiais"
OUTPUT_FILE = "/Users/jpconfins/Movies/App Letitia/src/data/notion_documents.json"


class NotionHTMLToMarkdown(HTMLParser):
    def __init__(self):
        super().__init__()
        self.result = []
        self.skip = False
        self.in_body = False
        self.tag_stack = []
        self.in_table = False
        self.table_row = []
        self.table_rows = []
        self.in_td = False
        self.td_content = []
        self.list_type_stack = []
        self.ol_counter = 0
        self.in_link = False
        self.link_href = ''

    def handle_starttag(self, tag, attrs):
        self.tag_stack.append(tag)
        attrs_dict = dict(attrs)

        if tag == 'body':
            self.in_body = True
            return
        if tag in ('style', 'script', 'head'):
            self.skip = True
            return
        if not self.in_body or self.skip:
            return

        cls = attrs_dict.get('class', '')

        if tag == 'h1':
            self.result.append('\n\n# ')
        elif tag == 'h2':
            self.result.append('\n\n## ')
        elif tag == 'h3':
            self.result.append('\n\n### ')
        elif tag == 'p':
            self.result.append('\n\n')
        elif tag == 'ul':
            self.list_type_stack.append('ul')
        elif tag == 'ol':
            self.list_type_stack.append('ol')
            self.ol_counter = 0
        elif tag == 'li':
            depth = len(self.list_type_stack) - 1
            indent = '  ' * depth
            if self.list_type_stack and self.list_type_stack[-1] == 'ol':
                self.ol_counter += 1
                self.result.append(f'\n{indent}{self.ol_counter}. ')
            else:
                self.result.append(f'\n{indent}- ')
        elif tag in ('strong', 'b'):
            self.result.append('**')
        elif tag in ('em', 'i'):
            self.result.append('*')
        elif tag == 'br':
            self.result.append('\n')
        elif tag == 'hr':
            self.result.append('\n\n---\n\n')
        elif tag == 'blockquote':
            self.result.append('\n\n> ')
        elif tag == 'code':
            self.result.append('`')
        elif tag == 'a':
            href = attrs_dict.get('href', '')
            if href and not href.startswith('#'):
                self.in_link = True
                self.link_href = href
                self.result.append('[')
        elif tag == 'table':
            self.in_table = True
            self.table_rows = []
        elif tag == 'tr':
            self.table_row = []
        elif tag in ('td', 'th'):
            self.in_td = True
            self.td_content = []

    def handle_endtag(self, tag):
        if tag in self.tag_stack:
            idx = len(self.tag_stack) - 1 - self.tag_stack[::-1].index(tag)
            self.tag_stack.pop(idx)

        if tag in ('style', 'script', 'head'):
            self.skip = False
            return
        if not self.in_body or self.skip:
            return

        if tag in ('h1', 'h2', 'h3'):
            self.result.append('\n')
        elif tag == 'p':
            pass
        elif tag in ('ul', 'ol'):
            if self.list_type_stack:
                self.list_type_stack.pop()
            self.result.append('\n')
        elif tag in ('strong', 'b'):
            self.result.append('**')
        elif tag in ('em', 'i'):
            self.result.append('*')
        elif tag == 'code':
            self.result.append('`')
        elif tag == 'blockquote':
            pass
        elif tag == 'a':
            if self.in_link:
                self.result.append(f']({self.link_href})')
                self.in_link = False
                self.link_href = ''
        elif tag in ('td', 'th'):
            self.in_td = False
            self.table_row.append(''.join(self.td_content).strip())
            self.td_content = []
        elif tag == 'tr':
            if self.table_row:
                self.table_rows.append(self.table_row)
        elif tag == 'table':
            self.in_table = False
            if self.table_rows:
                for i, row in enumerate(self.table_rows):
                    self.result.append('\n| ' + ' | '.join(row) + ' |')
                    if i == 0:
                        self.result.append('\n| ' + ' | '.join(['---'] * len(row)) + ' |')
                self.result.append('\n')

    def handle_data(self, data):
        if not self.in_body or self.skip:
            return
        text = data.replace('\t', ' ')
        if self.in_td:
            self.td_content.append(text.strip())
        else:
            cleaned = text.strip()
            if cleaned:
                self.result.append(cleaned)

    def get_markdown(self):
        result = ''.join(self.result)
        result = re.sub(r'\n{3,}', '\n\n', result)
        result = result.strip()
        return result


def html_to_markdown(html_content):
    parser = NotionHTMLToMarkdown()
    parser.feed(html_content)
    return parser.get_markdown()


def extract_title(filename):
    name = filename.replace('.html', '')
    name = re.sub(r'\s+[a-f0-9]{32}$', '', name)
    return name.strip()


def get_category(title):
    title_upper = title.upper()
    venda_keywords = ["FICHA DE PRODUTO", "PERSONA", "SCRIPT", "PLAYBOOK", "MANUAL QUEBRA"]
    vendedor_keywords = ["PROCESSO DE CONTRATAÇÃO", "ONBORDING", "ONBOARDING", "CONSULTOR", "METAS E COMISSÕES", "ROTEIRO DE ENTREVISTA"]
    
    for kw in venda_keywords:
        if kw in title_upper:
            return "Materiais de Venda"
    for kw in vendedor_keywords:
        if kw in title_upper:
            return "Processos Internos"
    return "Geral"


def main():
    html_files = [f for f in os.listdir(NOTION_DIR) if f.endswith('.html')]
    print(f"📄 Encontrados {len(html_files)} arquivos HTML")

    documents = []
    seen_titles = set()

    for filename in sorted(html_files):
        titulo = extract_title(filename)
        
        # Skip duplicates
        base_title = re.sub(r'\s*\(\d+\)\s*$', '', titulo)
        if base_title in seen_titles:
            print(f"  ⏭️  Pulando duplicata: '{titulo}'")
            continue
        seen_titles.add(base_title)

        filepath = os.path.join(NOTION_DIR, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            markdown = html_to_markdown(html_content)
            
            if not markdown or len(markdown.strip()) < 10:
                print(f"  ⚠️  Conteúdo curto, pulando: '{titulo}'")
                continue

            category = get_category(titulo)
            
            documents.append({
                "titulo": titulo,
                "conteudo": markdown,
                "categoria": category,
                "favorito": False,
                "publico": False
            })
            
            print(f"  ✅ '{titulo}' → {category} ({len(markdown)} chars)")
            
        except Exception as e:
            print(f"  ❌ Erro em '{titulo}': {e}")

    # Write JSON output
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {len(documents)} documentos exportados para {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
