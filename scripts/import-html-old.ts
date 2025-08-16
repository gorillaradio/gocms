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
  // Converte "main_title" → "Main Title" o "hero-1" → "Hero 1"
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
  
  const blocks: ParsedBlock[] = [];
  
  // 1. Trova tutti i blocchi nell'ordine corretto dell'HTML (inclusi quelli senza section)
  const allBlocks = findAllBlocksInOrder(htmlContent, root);
  
  console.log('All detected blocks:', allBlocks.map(b => ({ type: b.type, draggable: b.draggable })));
  
  // 4. Processa ogni blocco per estrarre i campi
  allBlocks.forEach((blockInfo, index) => {
    const blockRoot = parse(blockInfo.html);
    const editableElements = blockRoot.querySelectorAll('[data-editable]');
    
    // Skip se non ha data-editable E non è draggable
    if (editableElements.length === 0 && !blockInfo.draggable) {
      console.log(`  ⚠ Skipping block "${blockInfo.type}" - no data-editable and not draggable`);
      return;
    }
    
    // Se è draggable ma senza campi, lo includiamo comunque per il dragging
    if (editableElements.length === 0 && blockInfo.draggable) {
      console.log(`  ✓ Including draggable block "${blockInfo.type}" without editable fields`);
    }
    
    const fields: ParsedField[] = [];
    let fieldCounter = 1;
    
    editableElements.forEach((element) => {
      const customName = element.getAttribute('data-editable');
      const fieldName = customName && customName !== '' 
        ? customName.replace(/_/g, ' ') // Converte underscore in spazi
        : `${blockInfo.type}-${fieldCounter}`;
      
      const fieldType = detectFieldType(element);
      let value = '';
      
      // Estrai il valore basato sul tipo di elemento
      if (fieldType === 'image') {
        value = element.getAttribute('src') || '';
      } else if (fieldType === 'link') {
        value = element.getAttribute('href') || '';
      } else {
        value = element.text.trim();
      }
      
      fields.push({
        fieldName,
        displayName: generateDisplayName(fieldName),
        fieldType,
        value
      });
      
      fieldCounter++;
    });
    
    blocks.push({
      type: blockInfo.type,
      htmlContent: blockInfo.html,
      draggable: blockInfo.draggable,
      fields
    });
  });
  
  return { title, headContent, blocks };
}

function findAllBlocksInOrder(htmlContent: string, root: any): Array<{type: string, html: string, draggable: boolean}> {
  const allBlocksWithPosition: Array<{type: string, html: string, draggable: boolean, position: number}> = [];
  
  // 1. Trova blocchi manuali con posizioni
  const blockRegex = /<!-- BLOCK:(\w+)(?::(\w+))? -->/g;
  let match;
  
  while ((match = blockRegex.exec(htmlContent)) !== null) {
    const blockType = match[1];
    const modifier = match[2];
    const isDraggable = modifier === 'draggable';
    
    // Trova la section dopo questo commento
    const afterComment = htmlContent.substring(match.index);
    const sectionMatch = afterComment.match(/<section[^>]*>/);
    
    if (sectionMatch) {
      const sectionStart = match.index + sectionMatch.index!;
      
      // Estrai l'intera section
      const sectionRegex = /(<section[^>]*>(?:(?!<\/?section).)*<\/section>)/s;
      const fullSectionMatch = htmlContent.substring(sectionStart).match(sectionRegex);
      
      if (fullSectionMatch) {
        allBlocksWithPosition.push({
          type: blockType,
          html: fullSectionMatch[1],
          draggable: isDraggable,
          position: sectionStart
        });
      }
    }
  }
  
  // 2. Trova section automatiche usando regex direttamente sull'HTML
  console.log('Looking for auto blocks...');
  const sectionRegex = /<section[^>]*>[\s\S]*?<\/section>/g;
  let sectionMatch;
  
  while ((sectionMatch = sectionRegex.exec(htmlContent)) !== null) {
    const sectionHtml = sectionMatch[0];
    const sectionPosition = sectionMatch.index;
    
    // Controlla se ha data-editable
    if (!sectionHtml.includes('data-editable')) continue;
    
    // Controlla se è già stato aggiunto come blocco manuale
    const alreadyAdded = allBlocksWithPosition.some(block => 
      block.html === sectionHtml || sectionHtml.includes(block.html) || block.html.includes(sectionHtml)
    );
    
    if (!alreadyAdded) {
      // Estrai id o class per il nome del blocco
      let blockType = 'section';
      const idMatch = sectionHtml.match(/id="([^"]+)"/);
      if (idMatch) {
        blockType = idMatch[1];
      } else {
        const classMatch = sectionHtml.match(/class="([^"]+)"/);
        if (classMatch) {
          const className = classMatch[1];
          const typeMatch = className.match(/(\w+)(?:-section)?/);
          blockType = typeMatch ? typeMatch[1] : 'section';
        }
      }
      
      console.log(`Found auto block: ${blockType} at position ${sectionPosition}`);
      
      allBlocksWithPosition.push({
        type: blockType,
        html: sectionHtml,
        draggable: false,
        position: sectionPosition
      });
    }
  }
  
  // 3. Ordina per posizione nell'HTML
  return allBlocksWithPosition
    .sort((a, b) => a.position - b.position)
    .map(({position, ...block}) => block);
}

function findManualBlocks(htmlContent: string): Array<{type: string, html: string, draggable: boolean}> {
  const blocks: Array<{type: string, html: string, draggable: boolean}> = [];
  const blockRegex = /<!-- BLOCK:(\w+)(?::(\w+))? -->(.*?)<!-- \/BLOCK:\w+ -->/gs;
  
  let match;
  while ((match = blockRegex.exec(htmlContent)) !== null) {
    const blockType = match[1];
    const modifier = match[2]; // "draggable" o undefined
    const blockHtml = match[3];
    
    blocks.push({
      type: blockType,
      html: blockHtml,
      draggable: modifier === 'draggable'
    });
  }
  
  return blocks;
}

function findAutoBlocks(root: any, manualBlocks: Array<{type: string, html: string, draggable: boolean}>): Array<{type: string, html: string, draggable: boolean}> {
  const blocks: Array<{type: string, html: string, draggable: boolean}> = [];
  const sections = root.querySelectorAll('section');
  
  sections.forEach((section: any) => {
    // Controlla se questa section ha data-editable al suo interno
    const editableElements = section.querySelectorAll('[data-editable]');
    if (editableElements.length === 0) return;
    
    // Determina il nome del blocco
    let blockType = '';
    
    // Prova a usare l'ID
    const id = section.getAttribute('id');
    if (id) {
      blockType = id;
    } else {
      // Prova a estrarre dalla classe (es. "hero-section" → "hero")
      const className = section.getAttribute('class');
      if (className) {
        const match = className.match(/(\w+)(?:-section)?/);
        blockType = match ? match[1] : 'section';
      } else {
        blockType = 'section';
      }
    }
    
    // Evita duplicati con blocchi manuali
    const isDuplicate = manualBlocks.some(manual => 
      manual.html.includes(section.outerHTML) || 
      section.outerHTML.includes(manual.html)
    );
    
    if (!isDuplicate) {
      blocks.push({
        type: blockType,
        html: section.outerHTML,
        draggable: false // I blocchi auto sono sempre fissi
      });
    }
  });
  
  return blocks;
}

function copyAssets(importDir: string, slug: string) {
  const publicDir = join(process.cwd(), 'public');
  
  // Copia e aggiorna styles.css
  const cssSource = join(importDir, 'styles.css');
  if (existsSync(cssSource)) {
    const cssDestDir = join(publicDir, 'css');
    if (!existsSync(cssDestDir)) mkdirSync(cssDestDir, { recursive: true });
    
    // Leggi CSS e aggiorna i percorsi delle immagini
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
          // Non aggiorniamo i blocchi in update per preservare le modifiche
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
        
        console.log(`About to create block:`, {
          type: block.type,
          draggable: block.draggable,
          draggableType: typeof block.draggable
        });
        
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

// Esegui l'import
importHtmlFiles();