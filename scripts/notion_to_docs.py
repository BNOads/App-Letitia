#!/usr/bin/env python3
"""
Script para converter arquivos HTML do Notion Transfer em documentos
na ferramenta Documentos (tabela 'documentos' no Supabase).

Cria uma pasta "[LC] Materiais" e insere cada HTML como um documento Markdown.
"""

import os
import re
import json
import glob
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from urllib.parse import quote

# ─── Supabase Config ────────────────────────────────────────
SUPABASE_URL = "https://saoysiaolrogzfmzbsko.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_jVm-K3e2e73bNnK2XlBqAw_3feXCv4o"

NOTION_DIR = os.path.join("/Users/jpconfins/Movies/App Letitia", "Notion transfer", "[LC] Materiais")


# ─── HTML to Markdown Parser ───────────────────────────────
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
        self.list_type_stack = []  # 'ul' or 'ol'
        self.ol_counter = 0

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

        # Skip Notion UI elements like icons, page covers, etc.
        if 'page-header-icon' in cls or 'icon' in cls:
            return

        if tag == 'h1':
            self.result.append('\n# ')
        elif tag == 'h2':
            self.result.append('\n## ')
        elif tag == 'h3':
            self.result.append('\n### ')
        elif tag == 'p':
            self.result.append('\n')
        elif tag == 'ul':
            self.list_type_stack.append('ul')
        elif tag == 'ol':
            self.list_type_stack.append('ol')
            self.ol_counter = 0
        elif tag == 'li':
            if self.list_type_stack and self.list_type_stack[-1] == 'ol':
                self.ol_counter += 1
                self.result.append(f'\n{self.ol_counter}. ')
            else:
                self.result.append('\n- ')
        elif tag in ('strong', 'b'):
            self.result.append('**')
        elif tag in ('em', 'i'):
            self.result.append('*')
        elif tag == 'br':
            self.result.append('\n')
        elif tag == 'hr':
            self.result.append('\n---\n')
        elif tag == 'blockquote':
            self.result.append('\n> ')
        elif tag == 'code':
            self.result.append('`')
        elif tag == 'a':
            href = attrs_dict.get('href', '')
            if href:
                self.result.append('[')
        elif tag == 'table':
            self.in_table = True
            self.table_rows = []
        elif tag == 'tr':
            self.table_row = []
        elif tag in ('td', 'th'):
            self.in_td = True
            self.td_content = []
        elif tag == 'img':
            # Skip Notion icon images, only include content images
            src = attrs_dict.get('src', '')
            if src and 'notion.so/icons' not in src:
                alt = attrs_dict.get('alt', '')
                # Don't include local image refs in markdown since they won't work in app
                pass

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
            self.result.append('\n')
        elif tag in ('ul', 'ol'):
            if self.list_type_stack:
                self.list_type_stack.pop()
            self.result.append('\n')
        elif tag == 'li':
            pass  # newline already added at start
        elif tag in ('strong', 'b'):
            self.result.append('**')
        elif tag in ('em', 'i'):
            self.result.append('*')
        elif tag == 'code':
            self.result.append('`')
        elif tag == 'blockquote':
            self.result.append('\n')
        elif tag == 'a':
            self.result.append(']')
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
                # Convert table to markdown
                for i, row in enumerate(self.table_rows):
                    self.result.append('\n| ' + ' | '.join(row) + ' |')
                    if i == 0:
                        self.result.append('\n| ' + ' | '.join(['---'] * len(row)) + ' |')
                self.result.append('\n')
        elif tag == 'div':
            self.result.append('\n')

    def handle_data(self, data):
        if not self.in_body or self.skip:
            return
        text = data
        if self.in_td:
            self.td_content.append(text.strip())
        else:
            # Clean up whitespace but preserve intentional formatting
            cleaned = text.replace('\t', ' ')
            if cleaned.strip():
                self.result.append(cleaned.strip())

    def get_markdown(self):
        result = ''.join(self.result)
        # Clean up excessive newlines
        result = re.sub(r'\n{3,}', '\n\n', result)
        # Clean up leading newline
        result = result.strip()
        return result


def html_to_markdown(html_content: str) -> str:
    """Convert Notion HTML export to Markdown."""
    parser = NotionHTMLToMarkdown()
    parser.feed(html_content)
    return parser.get_markdown()


def extract_title_from_filename(filename: str) -> str:
    """Extract the document title from the Notion filename (remove hash)."""
    # Remove .html extension
    name = filename.replace('.html', '')
    # Remove the Notion hash (32 hex chars at the end)
    name = re.sub(r'\s+[a-f0-9]{32}$', '', name)
    return name.strip()


def supabase_request(method: str, endpoint: str, data=None):
    """Make a request to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    body = json.dumps(data).encode('utf-8') if data else None
    req = Request(url, data=body, headers=headers, method=method)

    try:
        with urlopen(req) as response:
            response_data = response.read().decode('utf-8')
            return json.loads(response_data) if response_data else None
    except Exception as e:
        print(f"  ❌ API Error: {e}")
        if hasattr(e, 'read'):
            print(f"     Response: {e.read().decode('utf-8')}")
        raise


def get_or_create_pasta(nome: str) -> str:
    """Get or create a pasta (folder) and return its ID."""
    # Check if pasta exists
    try:
        existing = supabase_request("GET", f"pastas?nome=eq.{quote(nome)}&select=id")
        if existing and len(existing) > 0:
            print(f"📁 Pasta existente encontrada: '{nome}' (ID: {existing[0]['id']})")
            return existing[0]["id"]
    except Exception:
        pass

    # Create new pasta
    result = supabase_request("POST", "pastas", {"nome": nome, "favorita": False})
    pasta_id = result[0]["id"] if isinstance(result, list) else result["id"]
    print(f"📁 Pasta criada: '{nome}' (ID: {pasta_id})")
    return pasta_id


def create_documento(titulo: str, conteudo: str, pasta_id: str):
    """Create a new document."""
    doc = {
        "titulo": titulo,
        "conteudo": conteudo,
        "pasta_id": pasta_id,
        "favorito": False,
        "publico": False,
    }
    result = supabase_request("POST", "documentos", doc)
    doc_id = result[0]["id"] if isinstance(result, list) else result["id"]
    return doc_id


def main():
    print("=" * 60)
    print("🔄 Notion Transfer → Documentos")
    print("=" * 60)
    print()

    # Find all HTML files (don't use glob - brackets in path cause issues)
    html_files = [
        os.path.join(NOTION_DIR, f)
        for f in os.listdir(NOTION_DIR)
        if f.endswith('.html')
    ]
    print(f"📄 Encontrados {len(html_files)} arquivos HTML para converter")
    print()

    if not html_files:
        print("❌ Nenhum arquivo HTML encontrado no diretório Notion transfer!")
        return

    # Group by category from CSV data
    # Based on the CSV, materials are categorized by "Tipo de Material"
    # We'll create subfolders based on document type
    categories = {
        "Venda": [
            "FICHA DE PRODUTO", "PERSONA", "SCRIPT", "PLAYBOOK"
        ],
        "Vendedor (a)": [
            "PROCESSO DE CONTRATAÇÃO", "ONBORDING"
        ],
    }

    def get_category(title: str) -> str:
        for cat, keywords in categories.items():
            for kw in keywords:
                if kw in title.upper():
                    return cat
        return "Geral"

    # Create main pasta
    pasta_materiais_id = get_or_create_pasta("[LC] Materiais")

    # Also create sub-category pastas
    pasta_venda_id = get_or_create_pasta("[LC] Materiais - Venda")
    pasta_vendedor_id = get_or_create_pasta("[LC] Materiais - Vendedor(a)")
    pasta_geral_id = get_or_create_pasta("[LC] Materiais - Geral")

    category_pasta_map = {
        "Venda": pasta_venda_id,
        "Vendedor (a)": pasta_vendedor_id,
        "Geral": pasta_geral_id,
    }

    # Track created docs to avoid duplicates
    created_titles = set()
    success_count = 0
    skip_count = 0
    error_count = 0

    for html_file in sorted(html_files):
        filename = os.path.basename(html_file)
        titulo = extract_title_from_filename(filename)

        # Skip duplicates (e.g. "PLAYBOOK - VOCÊ DIRIGE" and "PLAYBOOK - VOCÊ DIRIGE (1)")
        base_title = re.sub(r'\s*\(\d+\)\s*$', '', titulo)
        if base_title in created_titles:
            print(f"⏭️  Pulando duplicata: '{titulo}'")
            skip_count += 1
            continue

        print(f"📝 Convertendo: '{titulo}'")

        try:
            # Read and parse HTML
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()

            markdown = html_to_markdown(html_content)

            if not markdown or len(markdown.strip()) < 10:
                print(f"   ⚠️  Conteúdo vazio ou muito curto, pulando")
                skip_count += 1
                continue

            # Determine category
            category = get_category(titulo)
            pasta_id = category_pasta_map[category]

            # Create document
            doc_id = create_documento(titulo, markdown, pasta_id)
            created_titles.add(base_title)
            success_count += 1
            print(f"   ✅ Criado com sucesso (ID: {doc_id}) → Pasta: {category}")

        except Exception as e:
            error_count += 1
            print(f"   ❌ Erro: {e}")

    print()
    print("=" * 60)
    print(f"✅ Concluído!")
    print(f"   📄 Documentos criados: {success_count}")
    print(f"   ⏭️  Pulados: {skip_count}")
    print(f"   ❌ Erros: {error_count}")
    print("=" * 60)


if __name__ == "__main__":
    main()
