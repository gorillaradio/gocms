# Piano di Implementazione Tiptap Rich Text Editor

## Obiettivo
Sostituire le textarea semplici con un rich text editor per gestire formattazione HTML (bold, italic, underline, newline) mantenendo compatibilità con il sistema esistente.

## Fase 1: Setup e Installazione
### Dipendenze da installare
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-text-style @tiptap/extension-underline
```

### Packages aggiuntivi (se necessari)
```bash
# Per styling personalizzato
npm install @tiptap/extension-typography

# Per gestione avanzata formattazione
npm install @tiptap/extension-character-count
```

## Fase 2: Creazione Componente Base
### File da creare: `src/components/ui/rich-text-editor.tsx`

#### Funzionalità base richieste:
- ✅ Bold (Ctrl+B)
- ✅ Italic (Ctrl+I) 
- ✅ Underline (Ctrl+U)
- ✅ Gestione paragrafi e newline
- ✅ Output HTML pulito
- ✅ Caricamento contenuto HTML esistente

#### Props interface:
```typescript
interface RichTextEditorProps {
  value: string;           // HTML content
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
}
```

## Fase 3: Integrazione nel Sistema
### File da modificare:
- `src/components/admin/page-edit-form.tsx` (riga 247-252)
- Sostituire condizione `fieldType === 'textarea'`

### Strategia di sostituzione:
```typescript
// Prima (textarea semplice)
{field.fieldType === 'textarea' ? (
  <Textarea
    value={field.value}
    onChange={(e) => onUpdateField(block.id, field.id, e.target.value)}
    rows={3}
  />
) : (
  // input normale
)}

// Dopo (rich text editor)
{field.fieldType === 'textarea' ? (
  <RichTextEditor
    value={field.value}
    onChange={(html) => onUpdateField(block.id, field.id, html)}
    placeholder="Inserisci contenuto..."
    minHeight="120px"
  />
) : (
  // input normale
)}
```

## Fase 4: Gestione Contenuto Esistente
### Problemi da risolvere:
1. **Tag `<br>` esistenti**: devono essere convertiti in paragrafi
2. **Indentazione HTML**: già risolto con script import
3. **Compatibilità backward**: editor deve caricare HTML esistente

### Test case da verificare:
- [ ] Contenuto con `<br>` (es: biografia con break line alla riga 62)
- [ ] Testo senza formattazione
- [ ] Testo con formattazione esistente (se presente)
- [ ] Salvataggio e caricamento del contenuto

## Fase 5: Styling e UX
### Componenti UI da creare:
- Toolbar con pulsanti Bold/Italic/Underline
- Styling coerente con tema ShadCN esistente
- Responsive design

### File CSS/styling:
- Usare classi Tailwind esistenti
- Integrare con tema dark/light
- Mantenere consistency con altri input

## Fase 6: Testing e Validazione
### Test da eseguire:
1. **Funzionalità base**:
   - [ ] Bold/Italic/Underline funzionano
   - [ ] Newline gestiti correttamente
   - [ ] Output HTML è pulito

2. **Integrazione sistema**:
   - [ ] Salvataggio in database
   - [ ] Caricamento da database
   - [ ] Compatibilità con rendering frontend

3. **User Experience**:
   - [ ] Performance accettabile
   - [ ] Keyboard shortcuts funzionano
   - [ ] Mobile responsive

## Fase 7: Deployment e Migrazione
### Strategia di rollout:
1. **Feature flag**: Abilitare solo per admin in sviluppo
2. **A/B test**: Confronto con textarea tradizionale
3. **Migrazione graduale**: Per tipo di contenuto
4. **Rollback plan**: Possibilità di tornare a textarea

### Migrazione dati esistenti:
- Script per convertire contenuti con `<br>` in paragrafi
- Backup database prima della migrazione
- Validazione contenuti post-migrazione

## Note Tecniche
### Configurazione Tiptap consigliata:
```typescript
const editor = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextStyle
  ],
  content: value,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});
```

### Considerazioni performance:
- Lazy loading del componente se non usato
- Debounce per onChange (500ms)
- Ottimizzazione re-render con React.memo

## Rischi e Mitigazioni
### Rischi identificati:
1. **Incompatibilità contenuto esistente** → Test approfonditi + rollback
2. **Performance degradata** → Profiling + ottimizzazioni
3. **UX confusionaria** → User testing + iterazioni

### Criteri di successo:
- Rich text editor funziona senza errori
- Contenuto esistente si carica correttamente
- Performance equivalente o migliore di textarea
- User experience intuitive per gli admin