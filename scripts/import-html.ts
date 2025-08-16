import { readFileSync, readdirSync, copyFileSync, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { parse } from 'node-html-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedBlock {
  type: string;
  htmlContent: string;
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
  
  console.log('All detected blocks:', blocks.map(b => ({ type: b.type, draggable: b.draggable })));
  
  return { title, headContent, blocks };
}

function divideBodyIntoBlocks(bodyElement: any, htmlContent: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  
  // 1. Prima processa tutti i blocchi manuali
  const manualBlocks = findManualBlocks(htmlContent);
  console.log('Manual blocks found:', manualBlocks.map(b => `${b.type}:${b.draggable}`));
  
  // 2. Trova tutti gli elementi del body che NON sono già coperti da blocchi manuali
  const bodyChildren = bodyElement.childNodes.filter((node: any) => 
    node.nodeType === 1 // Solo elementi, non testo
  );
  
  // 3. Traccia quali elementi sono già stati processati
  const processedElements = new Set();
  
  // 4. Processa prima i blocchi manuali
  manualBlocks.forEach(manualBlock => {
    // Trova l'elemento corrispondente nel DOM
    const matchingElement = bodyChildren.find((child: any) => {
      return manualBlock.html.includes(child.outerHTML) || child.outerHTML.includes(manualBlock.html);
    });
    
    if (matchingElement) {
      processedElements.add(matchingElement);
      const fields = extractFieldsFromElement(matchingElement, manualBlock.type);
      
      blocks.push({
        type: manualBlock.type,
        htmlContent: manualBlock.html,
        draggable: manualBlock.draggable,
        fields
      });
    }
  });
  
  // 5. Processa gli elementi rimanenti come blocchi automatici
  let blockCounter = 1;
  
  bodyChildren.forEach((child: any) => {
    if (processedElements.has(child)) {
      return; // Già processato come blocco manuale
    }
    
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
    
    const fields = extractFieldsFromElement(child, blockType);
    
    blocks.push({
      type: blockType,
      htmlContent: child.outerHTML,
      draggable: false, // Gli elementi automatici non sono draggable di default
      fields
    });
    
    blockCounter++;
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

function extractFieldsFromElement(element: any, blockType: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const editableElements = element.querySelectorAll('[data-editable]');
  
  let fieldCounter = 1;
  
  editableElements.forEach((editable: any) => {
    const customName = editable.getAttribute('data-editable');
    const fieldName = customName && customName !== '' 
      ? customName.replace(/_/g, ' ')
      : `${blockType}-${fieldCounter}`;
    
    const fieldType = detectFieldType(editable);
    let value = '';
    
    if (fieldType === 'image') {
      value = editable.getAttribute('src') || '';
    } else if (fieldType === 'link') {
      value = editable.getAttribute('href') || '';
    } else {
      value = editable.text.trim();
    }
    
    fields.push({
      fieldName,
      displayName: generateDisplayName(fieldName),
      fieldType,
      value
    });
    
    fieldCounter++;
  });
  
  return fields;
}

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
            htmlContent: block.htmlContent,
            order: i + 1,
            draggable: block.draggable,
            pageId: page.id
          }
        });
        
        console.log(`Created block ${block.type} with ID: ${createdBlock.id}`);
        
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
      
      console.log(`✓ Imported ${slug} with ${blocks.length} blocks`);
    }
    
    console.log('\n🎉 HTML import completed!');
  } catch (error) {
    console.error('Error importing HTML files:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importHtmlFiles();