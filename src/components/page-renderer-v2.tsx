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

export function PageRendererV2({ page }: PageRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Aggiunge il CSS della pagina (rimuove -v2 suffix)
    const baseSlug = page.slug.replace('-v2', '');
    const existingLink = document.querySelector(`link[href="/css/${baseSlug}.css"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/css/${baseSlug}.css`;
      document.head.appendChild(link);
    }
  }, [page.slug]);

  useEffect(() => {
    console.log('PageRendererV2 data:', {
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

  // Rimuove suffisso -v2 per asset paths
  const baseSlug = slug.replace('-v2', '');
  console.log('Asset path conversion:', { slug, baseSlug });

  // Aggiorna i percorsi delle risorse nel head
  let processedHead = headContent || '';
  processedHead = processedHead
    .replace(/href="styles\.css"/g, `href="/css/${baseSlug}.css"`)
    .replace(/src="assets\//g, `src="/assets/${baseSlug}/`)
    .replace(/href="assets\//g, `href="/assets/${baseSlug}/`);

  // Aggiorna i percorsi delle risorse nel body (gestisce sia path relativi che placeholder)
  console.log('Body content before asset replacement:', bodyContent.substring(0, 200));
  bodyContent = bodyContent
    .replace(/src="assets\//g, `src="/assets/${baseSlug}/`)
    .replace(/href="assets\//g, `href="/assets/${baseSlug}/`)
    // Gestisce anche i placeholder che potrebbero contenere path relativi
    .replace(/\{\{([^}]+)\}\}/g, (match, placeholder) => {
      // Se il placeholder contiene un path asset, lo converte
      if (placeholder.includes('assets/')) {
        return placeholder.replace(/assets\//g, `/assets/${baseSlug}/`);
      }
      return match; // Lascia gli altri placeholder inalterati
    });
  console.log('Body content after asset replacement:', bodyContent.substring(0, 200));

  // Costruisce l'HTML completo (solo il body per Next.js)
  return bodyContent;
}