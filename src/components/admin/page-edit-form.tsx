"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Save, Eye, Edit2 } from "lucide-react";

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
  htmlFile: string | null;
  order: number;
  draggable: boolean;
  fields: BlockField[];
}

interface Page {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  blocks: Block[];
}

interface PageEditFormProps {
  page: Page;
}

export function PageEditForm({ page }: PageEditFormProps) {
  const [blocks, setBlocks] = useState(page.blocks);
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('Blocks with correct draggable:', blocks.map((b, i) => ({ 
    index: i, 
    type: b.type, 
    draggable: b.draggable
  })));

  // Calcola se un blocco può essere spostato su/giù
  const canMoveBlock = (blockIndex: number, direction: "up" | "down") => {
    const block = blocks[blockIndex];
    if (!block.draggable) return false;

    const targetIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return false;

    const targetBlock = blocks[targetIndex];
    
    // Un blocco draggable può muoversi solo se il target è anche draggable
    // (solo all'interno di gruppi consecutivi draggable)
    return targetBlock.draggable;
  };

  const updateFieldValue = (blockId: string, fieldId: string, newValue: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { 
            ...block, 
            fields: block.fields.map(field =>
              field.id === fieldId ? { ...field, value: newValue } : field
            )
          }
        : block
    ));
  };

  const updateFieldDisplayName = (blockId: string, fieldId: string, newDisplayName: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { 
            ...block, 
            fields: block.fields.map(field =>
              field.id === fieldId ? { ...field, displayName: newDisplayName } : field
            )
          }
        : block
    ));
  };

  const moveBlock = (blockId: string, direction: "up" | "down") => {
    setBlocks(prev => {
      const currentIndex = prev.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[currentIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[currentIndex]];
      
      return newBlocks.map((block, index) => ({ ...block, order: index + 1 }));
    });
  };

  const saveChanges = async () => {
    setIsLoading(true);
    try {
      console.log('Sending blocks to API:', blocks.map(b => ({ id: b.id, type: b.type, order: b.order })));
      
      const response = await fetch(`/api/pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks })
      });

      if (!response.ok) throw new Error("Failed to save");
      
      toast.success("Page updated successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button onClick={saveChanges} disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" asChild>
          <a href={`/${page.slug}`} target="_blank">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </a>
        </Button>
      </div>

      <div className="space-y-4">
        {blocks.map((block, index) => (
          <Card key={block.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg capitalize">
                    {block.type} Block
                  </CardTitle>
                  {!block.draggable && (
                    <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
                      Fisso
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {block.draggable && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveBlock(block.id, "up")}
                        disabled={!canMoveBlock(index, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveBlock(block.id, "down")}
                        disabled={!canMoveBlock(index, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {index + 1}/{blocks.length}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {block.fields.length > 0 ? (
                <BlockFieldsEditor 
                  block={block} 
                  onUpdateField={updateFieldValue}
                  onUpdateDisplayName={updateFieldDisplayName}
                />
              ) : (
                <div className="text-sm text-muted-foreground py-4">
                  {block.draggable 
                    ? "Questo blocco non ha campi editabili, ma può essere riordinato."
                    : "Questo blocco non ha campi editabili."
                  }
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BlockFieldsEditor({ 
  block, 
  onUpdateField,
  onUpdateDisplayName 
}: { 
  block: Block; 
  onUpdateField: (blockId: string, fieldId: string, value: string) => void;
  onUpdateDisplayName: (blockId: string, fieldId: string, displayName: string) => void;
}) {
  const [editingField, setEditingField] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {(block.fields || []).map((field) => (
        <div key={field.id} className="space-y-2">
          <div className="flex items-center gap-2">
            {editingField === field.id ? (
              <Input
                value={field.displayName}
                onChange={(e) => onUpdateDisplayName(block.id, field.id, e.target.value)}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                className="max-w-xs"
                autoFocus
              />
            ) : (
              <Label 
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setEditingField(field.id)}
              >
                {field.displayName}
                <Edit2 className="h-3 w-3 text-muted-foreground" />
              </Label>
            )}
            <span className="text-xs text-muted-foreground">
              ({field.fieldName})
            </span>
          </div>
          
          {field.fieldType === 'textarea' ? (
            <Textarea
              value={field.value}
              onChange={(e) => onUpdateField(block.id, field.id, e.target.value)}
              rows={3}
            />
          ) : (
            <Input
              value={field.value}
              onChange={(e) => onUpdateField(block.id, field.id, e.target.value)}
              type={field.fieldType === 'image' ? 'url' : 'text'}
              placeholder={
                field.fieldType === 'image' ? 'https://...' :
                field.fieldType === 'link' ? 'https://...' :
                'Enter text...'
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}