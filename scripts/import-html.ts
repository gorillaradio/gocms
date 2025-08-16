import { readFileSync, readdirSync, copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'node-html-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedBlock {
  type: string;
  htmlTemplate: string; // HTML con placeholder {{fieldName}}
  draggable: boolean;
  fields: ParsedField[];
}

interface ParsedField {
  fieldName: string;
  displayName: string;
  fieldType: 'text' | 'textarea' | 'image' | 'link';
  value: string;
}

function detectFieldType(element: any): 'text' | 'textarea' | 'image' | 'link' {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'img') return 'image';
  if (tagName === 'a') return 'link';
  if (tagName === 'p' || tagName === 'div') return 'textarea';
  return 'text';
}

function generateDisplayName(fieldName: string): string {
  return fieldName
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

function extractFieldsFromElement(element: any, blockType: string): { fields: ParsedField[], templateHtml: string } {
  const fields: ParsedField[] = [];
  const editableElements = element.querySelectorAll('[data-editable]');
  
  let fieldCounter = 1;
  let templateHtml = element.outerHTML;
  
  editableElements.forEach((editable: any) => {
    const customName = editable.getAttribute('data-editable');
    const fieldName = customName && customName !== '' 
      ? customName.replace(/_/g, ' ')
      : `${blockType}-${fieldCounter}`;
    
    const fieldType = detectFieldType(editable);
    let value = '';
    
    if (fieldType === 'image') {
      value = editable.getAttribute('src') || '';
      // Sostituisci src nell'HTML con placeholder
      templateHtml = templateHtml.replace(
        new RegExp(`src="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `src="{{${fieldName}}}"`
      );
    } else if (fieldType === 'link') {
      value = editable.getAttribute('href') || '';
      // Sostituisci href nell'HTML con placeholder
      templateHtml = templateHtml.replace(
        new RegExp(`href="${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g'),
        `href="{{${fieldName}}}"`
      );
    } else {
      value = editable.text.trim();
      // Sostituisci contenuto testuale con placeholder
      templateHtml = templateHtml.replace(
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        `{{${fieldName}}}`
      );
    }
    
    fields.push({
      fieldName,
      displayName: generateDisplayName(fieldName),
      fieldType,
      value
    });
    
    fieldCounter++;
  });
  
  return { fields, templateHtml };
}

function parseHtmlFile(filePath: string, slug: string): { title: string; headContent: string; blocks: ParsedBlock[] } {
  const htmlContent = readFileSync(filePath, 'utf-8');
  const root = parse(htmlContent);
  
  // Estrai titolo dalla meta o da h1
  const titleElement = root.querySelector('title');
  const title = titleElement?.text || slug.charAt(0).toUpperCase() + slug.slice(1);
  
  // Estrai contenuto del head
  const headElement = root.querySelector('head');
  const headContent = headElement ? headElement.innerHTML : '';
  
  // Estrai tutto il body e dividilo in blocchi logici
  const bodyElement = root.querySelector('body');
  if (!bodyElement) {
    throw new Error('No body element found in HTML');
  }
  
  const blocks = divideBodyIntoBlocks(bodyElement, htmlContent);
  
  console.log('Detected blocks:', blocks.map(b => ({ type: b.type, draggable: b.draggable, fields: b.fields.length })));
  
  return { title, headContent, blocks };
}

function divideBodyIntoBlocks(bodyElement: any, htmlContent: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  
  // 1. Prima trova tutti i blocchi manuali per reference
  const manualBlocks = findManualBlocks(htmlContent);
  console.log('Manual blocks found:', manualBlocks.map(b => `${b.type}:${b.draggable}`));
  
  // 2. Processa tutti gli elementi del body nell'ordine HTML originale
  const bodyChildren = bodyElement.childNodes.filter((node: any) => 
    node.nodeType === 1 // Solo elementi, non testo
  );
  
  let blockCounter = 1;
  
  bodyChildren.forEach((child: any) => {
    // 3. Controlla se questo elemento fa parte di un blocco manuale
    const manualBlock = manualBlocks.find(manual => {
      // Migliore matching: trova per ID o class della section
      const childId = child.getAttribute('id');
      const childClass = child.getAttribute('class');
      
      // Match per ID
      if (childId && manual.type === childId) {
        return true;
      }
      
      // Match per class (es. galleria-section -> galleria)
      if (childClass && childClass.includes(manual.type)) {
        return true;
      }
      
      // Fallback: matching HTML
      return manual.html.includes(child.outerHTML) || child.outerHTML.includes(manual.html);
    });
    
    if (manualBlock) {
      // Questo è un blocco manuale
      const { fields, templateHtml } = extractFieldsFromElement(child, manualBlock.type);
      
      blocks.push({
        type: manualBlock.type,
        htmlTemplate: templateHtml, // Template con placeholder
        draggable: manualBlock.draggable,
        fields
      });
    } else {
      // Questo è un blocco automatico
      const tagName = child.tagName?.toLowerCase();
      let blockType = '';
      
      if (tagName === 'section') {
        // Usa ID o class della section
        const id = child.getAttribute('id');
        const className = child.getAttribute('class');
        
        if (id) {
          blockType = id;
        } else if (className) {
          const match = className.match(/(\w+)(?:-section)?/);
          blockType = match ? match[1] : 'section';
        } else {
          blockType = `section-${blockCounter}`;
        }
      } else if (tagName === 'nav') {
        blockType = 'navigation';
      } else if (tagName === 'footer') {
        blockType = 'footer';
      } else if (tagName === 'header') {
        blockType = 'header';
      } else {
        blockType = `${tagName}-${blockCounter}`;
      }
      
      const { fields, templateHtml } = extractFieldsFromElement(child, blockType);
      
      blocks.push({
        type: blockType,
        htmlTemplate: templateHtml, // Template con placeholder
        draggable: false, // Gli elementi automatici non sono draggable di default
        fields
      });
      
      blockCounter++;
    }
  });
  
  return blocks;
}

function findManualBlocks(htmlContent: string): Array<{type: string, html: string, draggable: boolean}> {
  const blocks: Array<{type: string, html: string, draggable: boolean}> = [];
  
  // Trova tutti i blocchi manuali <!-- BLOCK:name:modifier -->
  const blockRegex = /<!-- BLOCK:(\w+)(?::(\w+))? -->([\s\S]*?)<!-- \/BLOCK:\w+ -->/g;
  let match;
  
  while ((match = blockRegex.exec(htmlContent)) !== null) {
    const blockType = match[1];
    const modifier = match[2];
    const blockHtml = match[3];
    
    blocks.push({
      type: blockType,
      html: blockHtml,
      draggable: modifier === 'draggable'
    });
  }
  
  return blocks;
}

// Copio le altre funzioni necessarie dall'import originale
function copyAssets(importDir: string, slug: string) {
  const publicDir = join(process.cwd(), 'public');
  
  // Copia styles.css
  const cssSource = join(importDir, 'styles.css');
  if (existsSync(cssSource)) {
    const cssDestDir = join(publicDir, 'css');
    if (!existsSync(cssDestDir)) mkdirSync(cssDestDir, { recursive: true });
    
    let cssContent = readFileSync(cssSource, 'utf-8');
    cssContent = cssContent.replace(/assets\//g, `/assets/${slug}/`);
    
    const cssDestination = join(cssDestDir, `${slug}.css`);
    writeFileSync(cssDestination, cssContent);
    console.log(`  ✓ Copied and updated styles.css → /public/css/${slug}.css`);
  }
  
  // Copia cartella assets
  const assetsSource = join(importDir, 'assets');
  if (existsSync(assetsSource)) {
    const assetsDestination = join(publicDir, 'assets', slug);
    copyDirectoryRecursive(assetsSource, assetsDestination);
    console.log(`  ✓ Copied assets/ → /public/assets/${slug}/`);
  }
}

function copyDirectoryRecursive(source: string, destination: string) {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }
  
  const items = readdirSync(source, { withFileTypes: true });
  
  for (const item of items) {
    const sourcePath = join(source, item.name);
    const destPath = join(destination, item.name);
    
    if (item.isDirectory()) {
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      copyFileSync(sourcePath, destPath);
    }
  }
}

async function importHtmlFiles() {
  const importDir = join(process.cwd(), 'import');
  
  try {
    const files = readdirSync(importDir).filter(file => file.endsWith('.html'));
    
    for (const file of files) {
      const slug = file.replace('.html', '');
      const filePath = join(importDir, file);
      
      console.log(`Importing ${file}...`);
      
      // Copia CSS e assets
      copyAssets(importDir, slug);
      
      const { title, headContent, blocks } = parseHtmlFile(filePath, slug);
      
      // Crea o aggiorna la pagina
      const page = await prisma.page.upsert({
        where: { slug },
        update: {
          title,
          headContent,
        },
        create: {
          slug,
          title,
          headContent,
          published: true
        }
      });
      
      // Elimina blocchi esistenti se stiamo ricreando
      await prisma.block.deleteMany({
        where: { pageId: page.id }
      });
      
      // Crea i nuovi blocchi
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        const createdBlock = await prisma.block.create({
          data: {
            type: block.type,
            htmlContent: block.htmlTemplate, // Salva il template con placeholder
            order: i + 1,
            draggable: block.draggable,
            pageId: page.id
          }
        });
        
        console.log(`Created block ${block.type} with ${block.fields.length} fields and template`);
        
        // Crea i campi del blocco
        for (const field of block.fields) {
          await prisma.blockField.create({
            data: {
              fieldName: field.fieldName,
              displayName: field.displayName,
              fieldType: field.fieldType,
              value: field.value,
              blockId: createdBlock.id
            }
          });
        }
      }
      
      console.log(`✓ Imported ${slug} with ${blocks.length} blocks using template approach`);
    }
    
    console.log('\n🎉 HTML import completed!');
  } catch (error) {
    console.error('Error importing HTML files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importHtmlFiles();