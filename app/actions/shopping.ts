'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Helper to get or create a default demo user
async function getOrCreateDefaultUser() {
  return await prisma.user.upsert({
    where: { email: 'demo@shopsense.ai' },
    update: {},
    create: {
      email: 'demo@shopsense.ai',
      name: 'Ishaan Mittal',
      shoppingLists: {
        create: {
          title: 'Weekly Groceries',
          budget: 1500,
        },
      },
      pantryItems: {
        create: [
          { name: 'Whole Dairy Milk', category: 'Dairy', quantity: 1, unit: 'bottle', estimatedRemaining: 20, status: 'critically_low' },
          { name: 'Fresh Spinach', category: 'Produce', quantity: 1, unit: 'bunch', estimatedRemaining: 80, status: 'expiring_soon' },
          { name: 'Basmati Rice', category: 'Pantry', quantity: 5, unit: 'kg', estimatedRemaining: 75, status: 'good' },
        ],
      },
    },
    include: {
      shoppingLists: { include: { items: true } },
      pantryItems: true,
      activities: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
}

export async function fetchInitialData() {
  const user = await getOrCreateDefaultUser();
  return {
    lists: user.shoppingLists,
    pantry: user.pantryItems,
    activities: user.activities,
  };
}

export async function addVoiceItemsAction(listId: string, items: any[]) {
  const user = await getOrCreateDefaultUser();

  await prisma.cartItem.createMany({
    data: items.map((item) => ({
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'pack',
      category: item.category || 'Pantry',
      price: Number(item.price) || 60,
      brand: item.brand || null,
      shoppingListId: listId,
      source: 'voice',
    })),
  });

  await prisma.aIActivity.create({
    data: {
      type: 'voice',
      title: 'Voice Intent Added',
      description: `Added ${items.length} grocery item(s) via Groq AI.`,
      confidence: 0.96,
      dataUsed: ['Voice Transcript', 'Catalog Match'],
      userId: user.id,
    },
  });

  revalidatePath('/');
}

export async function addPantryItemAction(item: any) {
  const user = await getOrCreateDefaultUser();

  await prisma.pantryItem.create({
    data: {
      name: item.name,
      quantity: Number(item.quantity) || 1,
      unit: item.unit || 'pack',
      category: item.category || 'Pantry',
      estimatedRemaining: 100,
      status: 'good',
      userId: user.id,
    },
  });

  revalidatePath('/');
}

export async function toggleItemCompletedAction(itemId: string, completed: boolean) {
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { completed },
  });
  revalidatePath('/');
}

export async function deleteCartItemAction(itemId: string) {
  await prisma.cartItem.delete({
    where: { id: itemId },
  });
  revalidatePath('/');
}