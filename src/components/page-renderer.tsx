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
  htmlContent: string; // Template con placeholder {{fieldName}}
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
    // Aggiunge il CSS della pagina
    const existingLink = document.querySelector(`link[href="/css/${page.slug}.css"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/css/${page.slug}.css`;
      document.head.appendChild(link);
    }
  }, [page.slug]);

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

    // Costruisce la pagina usando template + campi separati
    const htmlContent = buildPageFromTemplates(page.blocks, page.headContent, page.slug);
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

function buildPageFromTemplates(blocks: Block[], headContent: string | null, slug: string): string {
  // Ordina i blocchi per order dal database
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  
  console.log('Building page with template approach:', sortedBlocks.map(b => ({ type: b.type, order: b.order })));
  
  // Costruisce il contenuto del body dai template
  let bodyContent = '';
  
  sortedBlocks.forEach((block) => {
    let blockHtml = block.htmlContent; // Template con placeholder
    
    // Sostituisce i placeholder {{fieldName}} con i valori dal database
    block.fields.forEach(field => {
      const placeholder = `{{${field.fieldName}}}`;
      blockHtml = blockHtml.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), field.value);
    });
    
    bodyContent += blockHtml + '\n';
  });

  // Aggiorna i percorsi delle risorse nel body
  bodyContent = bodyContent
    .replace(/src="assets\//g, `src="/assets/${slug}/`)
    .replace(/href="assets\//g, `href="/assets/${slug}/`)
    .replace(/background-image:\s*url\(['"]?assets\//g, `background-image: url('/assets/${slug}/`);

  // Costruisce l'HTML completo (solo il body per Next.js)
  return bodyContent;
}