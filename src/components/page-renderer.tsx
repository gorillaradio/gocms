"use client";

import { useEffect, useRef } from 'react';

interface BlockField {
  id: string;
  fieldName: string;
  displayName: string;
  fieldType: string;
  value: string;
}

interface Block {
  id: string;
  type: string;
  htmlContent: string;
  order: number;
  fields: BlockField[];
}

interface Page {
  id: string;
  slug: string;
  title: string;
  headContent: string | null;
  published: boolean;
  blocks: Block[];
}

interface PageRendererProps {
  page: Page;
}

export function PageRenderer({ page }: PageRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('PageRenderer data:', {
      hasHead: !!page.headContent,
      blocksCount: page.blocks.length,
      slug: page.slug
    });

    if (!containerRef.current) {
      console.log('No container ref');
      return;
    }

    if (page.blocks.length === 0) {
      console.log('No blocks found');
      containerRef.current.innerHTML = '<div>No content blocks found</div>';
      return;
    }

    console.log('Blocks:', page.blocks.map(b => ({ type: b.type, fieldsCount: b.fields.length })));

    // Costruisce la pagina usando solo i blocchi dal database
    const htmlContent = buildPageFromBlocks(page.blocks, page.headContent, page.slug);
    console.log('Generated HTML length:', htmlContent.length);
    containerRef.current.innerHTML = htmlContent;
  }, [page.blocks, page.headContent, page.slug]);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen"
      suppressHydrationWarning
    />
  );
}

function buildPageFromBlocks(blocks: Block[], headContent: string | null, slug: string): string {
  // Ordina i blocchi per order dal database
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  
  console.log('Building page with blocks order:', sortedBlocks.map(b => ({ type: b.type, order: b.order })));
  
  // Crea mappa di tutti i campi per sostituzione
  const fieldMap: Record<string, string> = {};
  blocks.forEach(block => {
    block.fields.forEach(field => {
      fieldMap[field.fieldName] = field.value;
    });
  });

  // Costruisce il contenuto del body dai blocchi
  let bodyContent = '';
  
  sortedBlocks.forEach((block) => {
    let blockHtml = block.htmlContent;
    
    // Sostituisce i contenuti data-editable in questo blocco
    try {
      const { parse } = require('node-html-parser');
      const root = parse(blockHtml);
      
      const editableElements = root.querySelectorAll('[data-editable]');
      let fieldCounter = 1;
      
      editableElements.forEach((element: any) => {
        const fieldName = element.getAttribute('data-editable');
        
        let actualFieldName: string;
        
        if (fieldName && fieldName !== '') {
          actualFieldName = fieldName.replace(/_/g, ' ');
        } else {
          actualFieldName = `${block.type}-${fieldCounter}`;
        }
        
        const newContent = fieldMap[actualFieldName];
        if (newContent !== undefined) {
          element.innerHTML = newContent;
        }
        
        fieldCounter++;
      });
      
      blockHtml = root.toString();
    } catch (error) {
      console.error(`Error processing block ${block.type}:`, error);
    }
    
    bodyContent += blockHtml + '\n';
  });

  // Aggiorna i percorsi delle risorse nel head
  let processedHead = headContent || '';
  processedHead = processedHead
    .replace(/href="styles\.css"/g, `href="/css/${slug}.css"`)
    .replace(/src="assets\//g, `src="/assets/${slug}/`)
    .replace(/href="assets\//g, `href="/assets/${slug}/`);

  // Aggiorna i percorsi delle risorse nel body
  bodyContent = bodyContent
    .replace(/src="assets\//g, `src="/assets/${slug}/`)
    .replace(/href="assets\//g, `href="/assets/${slug}/`);

  // Costruisce l'HTML completo
  return `<!DOCTYPE html>
<html>
<head>
${processedHead}
</head>
<body>
${bodyContent}
</body>
</html>`;
}