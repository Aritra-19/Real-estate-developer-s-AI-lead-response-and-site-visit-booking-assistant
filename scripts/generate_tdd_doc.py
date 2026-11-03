import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), fill_hex)
    tcPr.append(shd)

def create_tdd_word():
    md_path = os.path.join(os.path.dirname(__file__), '..', 'Technical_Design_Document.md')
    out_docx = os.path.join(os.path.dirname(__file__), '..', 'Technical_Design_Document.docx')

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    doc = Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Base Styles
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(0x2d, 0x37, 0x48)

    lines = content.split('\n')
    i = 0
    in_table = False
    table_rows = []

    while i < len(lines):
        line = lines[i].rstrip()

        # Handle tables
        if line.startswith('|') and line.endswith('|'):
            # Table line
            if not in_table:
                in_table = True
                table_rows = []
            
            # Check if divider line
            if not re.match(r'^\|[\s\-:|]+\|$', line):
                cols = [c.strip() for c in line.split('|')[1:-1]]
                table_rows.append(cols)
            i += 1
            continue
        else:
            if in_table:
                # Render table
                if table_rows:
                    num_cols = len(table_rows[0])
                    tbl = doc.add_table(rows=len(table_rows), cols=num_cols)
                    tbl.style = 'Light Shading Accent 1'
                    for r_idx, row_data in enumerate(table_rows):
                        row = tbl.rows[r_idx]
                        for c_idx, val in enumerate(row_data):
                            if c_idx < len(row.cells):
                                cell = row.cells[c_idx]
                                cell.text = val
                                if r_idx == 0:
                                    set_cell_background(cell, '064E3B') # Dark emerald
                                    for p in cell.paragraphs:
                                        for run in p.runs:
                                            run.font.bold = True
                                            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                in_table = False
                table_rows = []

        # Empty line
        if not line:
            i += 1
            continue

        # Heading 1
        if line.startswith('# '):
            h1_text = line[2:].strip()
            p = doc.add_paragraph()
            run = p.add_run(h1_text)
            run.font.name = 'Georgia'
            run.font.size = Pt(22)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x06, 0x4E, 0x3B) # Emerald
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(6)
            i += 1
            continue

        # Heading 2
        if line.startswith('## '):
            h2_text = line[3:].strip()
            p = doc.add_paragraph()
            run = p.add_run(h2_text)
            run.font.name = 'Georgia'
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(4)
            i += 1
            continue

        # Heading 3
        if line.startswith('### '):
            h3_text = line[4:].strip()
            p = doc.add_paragraph()
            run = p.add_run(h3_text)
            run.font.name = 'Georgia'
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x1C, 0x19, 0x17)
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(3)
            i += 1
            continue

        # Code block / ASCII diagram
        if line.startswith('```'):
            i += 1
            code_lines = []
            while i < len(lines) and not lines[i].startswith('```'):
                code_lines.append(lines[i])
                i += 1
            i += 1
            code_text = '\n'.join(code_lines)
            p = doc.add_paragraph()
            run = p.add_run(code_text)
            run.font.name = 'Consolas'
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
            p.paragraph_format.left_indent = Inches(0.2)
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            continue

        # Bullet point
        if line.startswith('- ') or line.startswith('* '):
            bullet_text = line[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            # Parse bold text
            parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(part[2:-2])
                    run.font.bold = True
                else:
                    p.add_run(part)
            p.paragraph_format.space_after = Pt(2)
            i += 1
            continue

        # Numbered list
        num_match = re.match(r'^(\d+)\.\s+(.*)$', line)
        if num_match:
            num_text = num_match.group(2)
            p = doc.add_paragraph(style='List Number')
            parts = re.split(r'(\*\*.*?\*\*)', num_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    run = p.add_run(part[2:-2])
                    run.font.bold = True
                else:
                    p.add_run(part)
            p.paragraph_format.space_after = Pt(2)
            i += 1
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        parts = re.split(r'(\*\*.*?\*\*)', line)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                run = p.add_run(part[2:-2])
                run.font.bold = True
            else:
                p.add_run(part)
        p.paragraph_format.space_after = Pt(4)
        i += 1

    doc.save(out_docx)
    print(f"[SUCCESS] Successfully generated Word document: {out_docx}")

if __name__ == '__main__':
    create_tdd_word()
