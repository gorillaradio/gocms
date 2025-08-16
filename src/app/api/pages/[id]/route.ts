import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { blocks } = body;

    console.log('API received blocks:', blocks.map((b: any) => ({ 
      id: b.id, 
      type: b.type, 
      order: b.order, 
      fieldsCount: b.fields?.length || 0 
    })));

    // Update blocks and their fields with explicit error handling
    await prisma.$transaction(async (tx) => {
      for (const block of blocks) {
        try {
          console.log(`Updating block ${block.type} with order ${block.order} and ${block.fields?.length || 0} fields`);
          
          // Update block order
          await tx.block.update({
            where: { id: block.id },
            data: { order: block.order }
          });
          
          // Update block fields if they exist
          if (block.fields && block.fields.length > 0) {
            for (const field of block.fields) {
              await tx.blockField.update({
                where: { id: field.id },
                data: { 
                  value: field.value,
                  displayName: field.displayName
                }
              });
              console.log(`  ✓ Updated field ${field.fieldName}: "${field.value}"`);
            }
          }
          
          console.log(`✓ Successfully updated ${block.type}`);
        } catch (blockError) {
          console.error(`ERROR updating block ${block.type}:`, blockError);
          throw blockError;
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DETAILED ERROR:", error);
    console.error("Error stack:", (error as Error).stack);
    return NextResponse.json(
      { error: "Failed to update page", details: (error as Error).message },
      { status: 500 }
    );
  }
}