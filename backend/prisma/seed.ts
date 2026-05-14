import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Load .env if present
try { require('dotenv').config(); } catch {}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// Helper: round numbers to 2 decimals
const round = (num: number): number => parseFloat(num.toFixed(2));

// Helper: random date between start and end
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper: random element from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Seeding database with PROFITABLE DATA (3 farmers, 180 days, positive net profit)...');

  // ─── Clear existing data (safe order) ──────────────────────
  await prisma.alert.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.feedingLog.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.milkProduction.deleteMany();
  await prisma.cattle.deleteMany();
  await prisma.communityComment.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.farmExpense.deleteMany();
  await prisma.user.deleteMany();
  console.log('✓ Cleared existing data');

  const passwordHash = await bcrypt.hash('Farm@1234', 10);

  // ─── 1. USERS (3 farmers only) ──────────────────────────────
  const userData = [
    { username: 'ravi_farmer', fullName: 'Ravi Kumar', farmName: 'Krishna Dairy Farm', email: 'ravi@krishnadairy.com' },
    { username: 'anjana_farmer', fullName: 'Anjana Singh', farmName: 'Sunlight Bovines', email: 'anjana@sunlight.com' },
    { username: 'vikram_dairy', fullName: 'Vikram Reddy', farmName: 'Green Pastures', email: 'vikram@greenpastures.com' },
  ];

  const users = [];
  for (const u of userData) {
    users.push(await prisma.user.create({
      data: { ...u, passwordHash, role: 'Farmer' }
    }));
  }
  console.log(`✓ ${users.length} users created`);

  // ─── 2. CATTLE WITH LINEAGE (30 per user – enough for profit) ──
  const breeds = ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Murrah Buffalo'];
  const statuses = ['Active', 'Pregnant', 'Calved'];
  const qualities = ['Excellent', 'Good', 'Fair'];
  const genders = ['Female', 'Female', 'Female', 'Male']; // 75% female for milk

  let allCattle: any[] = [];
  let cattleMap: Map<number, any[]> = new Map();

  for (const user of users) {
    console.log(`  -> Creating cattle for ${user.username}...`);
    const userCattle: any[] = [];

    // Foundation animals (5)
    const founders: any[] = [];
    for (let i = 0; i < 5; i++) {
      const gender = i < 4 ? 'Female' : 'Male';
      const founder = await prisma.cattle.create({
        data: {
          userId: user.id,
          tagNumber: `FND-${user.username.slice(0,2).toUpperCase()}-${i+1}`,
          name: `Founder ${gender === 'Female' ? 'Dam' : 'Sire'} ${i+1}`,
          breed: randomItem(breeds),
          gender,
          weight: round(400 + Math.random() * 300),
          status: 'Deceased',
          quality: randomItem(qualities),
          purchasePrice: round(50000 + Math.random() * 40000),
          dateOfBirth: new Date(Date.now() - (Math.random() * 8 + 5) * 365 * 86400000),
          notes: 'Original farm stock – lineage anchor'
        }
      });
      founders.push(founder);
      userCattle.push(founder);
    }
    const founderFemales = founders.filter(f => f.gender === 'Female');
    const founderMales = founders.filter(f => f.gender === 'Male');

    // Grandparents (10)
    const grandparents: any[] = [];
    for (let i = 0; i < 10; i++) {
      const gender = randomItem(genders);
      const dam = randomItem(founderFemales);
      const sire = randomItem(founderMales);
      const gp = await prisma.cattle.create({
        data: {
          userId: user.id,
          tagNumber: `GP-${user.username.slice(0,2).toUpperCase()}-${i+1}`,
          name: `Grand${gender === 'Female' ? 'dam' : 'sire'} ${i+1}`,
          breed: dam.breed,
          gender,
          weight: round(300 + Math.random() * 350),
          status: randomItem(statuses),
          quality: randomItem(qualities),
          purchasePrice: round(30000 + Math.random() * 40000),
          damId: dam.id,
          sireId: sire.id,
          dateOfBirth: new Date(Date.now() - (Math.random() * 6 + 2) * 365 * 86400000),
          notes: 'Second generation'
        }
      });
      grandparents.push(gp);
      userCattle.push(gp);
    }
    const grandFemales = grandparents.filter(g => g.gender === 'Female');
    const grandMales = grandparents.filter(g => g.gender === 'Male');

    // Current herd (15 active milkers)
    for (let i = 0; i < 15; i++) {
      const gender = 'Female'; // all females for milk
      const dam = randomItem(grandFemales);
      const sire = randomItem(grandMales);
      const cattle = await prisma.cattle.create({
        data: {
          userId: user.id,
          tagNumber: `${user.username.slice(0,3).toUpperCase()}-${(i+1).toString().padStart(3,'0')}`,
          name: `${randomItem(breeds).split(' ')[0]} ${i+1}`,
          breed: dam.breed,
          gender,
          weight: round(250 + Math.random() * 250),
          quality: randomItem(qualities),
          purchasePrice: round(25000 + Math.random() * 35000),
          status: randomItem(statuses),
          damId: dam.id,
          sireId: sire.id,
          dateOfBirth: new Date(Date.now() - (Math.random() * 5 + 0.5) * 365 * 86400000),
          purchaseDate: new Date(Date.now() - Math.random() * 2 * 365 * 86400000),
          notes: 'Milking herd'
        }
      });
      userCattle.push(cattle);
    }
    allCattle.push(...userCattle);
    cattleMap.set(user.id, userCattle);
  }
  console.log(`✓ ${allCattle.length} cattle created (profitable herd size)`);

  // ─── 3. INVENTORY WITH PROFITABLE PRICES (cheap feed) ────────
  const inventoryItems = [
    { name: 'Silage (Maize)', cat: 'Feed', baseQty: 10000, min: 2000, unit: 'kg', cost: 8 },
    { name: 'Dry Fodder', cat: 'Feed', baseQty: 5000, min: 1000, unit: 'kg', cost: 6 },
    { name: 'Concentrate Pellets', cat: 'Feed', baseQty: 3000, min: 500, unit: 'kg', cost: 28 },
    { name: 'Mineral Mixture', cat: 'Supplies', baseQty: 500, min: 100, unit: 'kg', cost: 80 },
    { name: 'Oxytocin', cat: 'Medicine', baseQty: 50, min: 10, unit: 'vials', cost: 90 },
    { name: 'FMD Vaccine', cat: 'Vaccine', baseQty: 300, min: 50, unit: 'doses', cost: 40 },
    { name: 'Lumpy Skin Vaccine', cat: 'Vaccine', baseQty: 200, min: 40, unit: 'doses', cost: 45 },
    { name: 'Iodine Teat Dip', cat: 'Supplies', baseQty: 100, min: 20, unit: 'liters', cost: 150 },
  ];

  const inventoriesByUser: Map<number, any[]> = new Map();

  for (const user of users) {
    const userInv = [];
    for (const item of inventoryItems) {
      let expiryDate = null;
      const r = Math.random();
      if (r < 0.2) expiryDate = new Date(Date.now() - (Math.random() * 30 + 1) * 86400000); // expired
      else if (r < 0.4) expiryDate = new Date(Date.now() + (Math.random() * 30 + 1) * 86400000); // expiring soon
      else expiryDate = new Date(Date.now() + (Math.random() * 180 + 90) * 86400000); // valid

      let quantity = item.baseQty * (0.8 + Math.random() * 0.4);
      quantity = round(Math.max(0, quantity));

      const inv = await prisma.inventory.create({
        data: {
          userId: user.id,
          itemName: item.name,
          category: item.cat,
          quantity,
          minQuantity: item.min,
          unit: item.unit,
          costPerUnit: round(item.cost * (0.9 + Math.random() * 0.2)),
          expiryDate,
          lastRestocked: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
          notes: `Inventory for ${user.username}`
        }
      });
      userInv.push(inv);

      // Some initial transactions
      await prisma.inventoryTransaction.create({
        data: {
          userId: user.id,
          inventoryId: inv.id,
          type: 'In',
          quantity: inv.quantity,
          purpose: 'INITIAL' as any,
          unitCostAtTime: inv.costPerUnit,
          date: new Date(Date.now() - 180 * 86400000),
          notes: 'Initial stock'
        }
      });
    }
    inventoriesByUser.set(user.id, userInv);
  }
  console.log(`✓ Inventory created with cheap feed prices (₹6-28/kg)`);

  // ─── 4. FARM EXPENSES (REDUCED) ─────────────────────────────
  for (const user of users) {
    const expenses = [];
    // Only 5 expenses per user over 180 days, lower amounts
    for (let i = 0; i < 5; i++) {
      const date = randomDate(new Date(Date.now() - 180 * 86400000), new Date());
      expenses.push({
        userId: user.id,
        category: randomItem(['ELECTRICITY', 'LABOUR', 'WATER', 'MAINTENANCE']) as any,
        amount: round(800 + Math.random() * 1200), // ₹800-2000
        date,
        description: `Monthly operating cost`
      });
    }
    await prisma.farmExpense.createMany({ data: expenses as any });
  }
  console.log('✓ Farm expenses reduced to ensure profitability');

  // ─── 5. HEALTH & VACCINATIONS (minimal cost) ────────────────
  const allHealthRecords = [];
  const allVaccinations = [];

  for (const cattle of allCattle.filter(c => c.status !== 'Deceased')) {
    // Only 20% chance of health record, low cost
    if (Math.random() < 0.2) {
      const date = randomDate(new Date(Date.now() - 180 * 86400000), new Date());
      allHealthRecords.push({
        userId: cattle.userId,
        cattleId: cattle.id,
        date,
        condition: randomItem(['Mastitis', 'Fever']),
        treatment: 'Antibiotic',
        vetName: 'Dr. Sharma',
        status: 'Resolved',
        cost: round(200 + Math.random() * 300),
        notes: 'Routine treatment'
      });
    }

    // Only 1 vaccine per animal
    const vaccines = ['FMD', 'Brucellosis'];
    const dateGiven = randomDate(new Date(Date.now() - 180 * 86400000), new Date());
    const nextDue = new Date(dateGiven);
    nextDue.setMonth(nextDue.getMonth() + 6);
    allVaccinations.push({
      userId: cattle.userId,
      cattleId: cattle.id,
      vaccineName: randomItem(vaccines),
      dateGiven,
      nextDueDate: nextDue,
      administeredBy: 'Vet',
      cost: round(50 + Math.random() * 50),
      notes: 'Routine vaccination'
    });
  }
  await prisma.healthRecord.createMany({ data: allHealthRecords });
  await prisma.vaccination.createMany({ data: allVaccinations });
  console.log(`✓ ${allHealthRecords.length} health records, ${allVaccinations.length} vaccinations (low cost)`);

  // ─── 6. MILK PRODUCTION (HIGH YIELD, HIGH PRICE) ────────────
  const milkEntries: any[] = [];
  const saleEntries: any[] = [];
  const historyDays = 180;

  for (let d = historyDays; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    for (const user of users) {
      const userCows = (cattleMap.get(user.id) || []).filter(c => 
        c.gender === 'Female' && ['Active', 'Pregnant', 'Calved'].includes(c.status)
      );
      let dailyTotal = 0;

      for (const cow of userCows) {
        // Higher base yields, no negative randomness
        const month = date.getMonth();
        const seasonFactor = (month >= 3 && month <= 6) ? 0.9 : 1.05; // mild dip
        let baseMorning = 8.0;
        let baseEvening = 6.0;
        if (cow.breed?.includes('Holstein')) { baseMorning = 12.0; baseEvening = 9.0; }
        if (cow.breed?.includes('Jersey')) { baseMorning = 9.0; baseEvening = 7.0; }
        if (cow.breed?.includes('Murrah')) { baseMorning = 6.0; baseEvening = 5.0; }

        const morning = round(baseMorning * seasonFactor + (Math.random() * 1.5));
        const evening = round(baseEvening * seasonFactor + (Math.random() * 1.2));
        const total = round(morning + evening);
        dailyTotal += total;

        milkEntries.push({
          cattleId: cow.id,
          userId: user.id,
          date,
          morningYield: morning,
          eveningYield: evening,
          totalYield: total,
          quality: randomItem(['Excellent', 'Good']),
          notes: null
        });
      }

      // Ensure minimum daily sale (at least 20 liters per farm)
      const minDaily = 20;
      const quantity = Math.max(minDaily, round(dailyTotal));
      const pricePerLiter = round(65 + Math.random() * 10); // ₹65-75 per liter
      const totalAmount = round(quantity * pricePerLiter);

      saleEntries.push({
        userId: user.id,
        date,
        quantityLiters: quantity,
        pricePerLiter,
        totalAmount,
        buyerName: randomItem(['Amul', 'Mother Dairy', 'Cooperative']),
        paymentStatus: 'Paid',
        paymentMethod: randomItem(['UPI', 'Bank Transfer']),
        notes: quantity !== dailyTotal ? 'Minimum sale guarantee' : null
      });
    }

    if (d % 10 === 0 && milkEntries.length) {
      await prisma.milkProduction.createMany({ data: milkEntries });
      milkEntries.length = 0;
    }
  }
  if (milkEntries.length) await prisma.milkProduction.createMany({ data: milkEntries });
  await prisma.sale.createMany({ data: saleEntries });
  console.log(`✓ ${historyDays+1} days of high-yield milk and premium sales`);

  // ─── 7. FEEDING LOGS (CHEAP FEED) ───────────────────────────
  const feedingLogs = [];
  // Only 150 feeding events, using cheap feed (Silage, Fodder)
  for (let i = 0; i < 150; i++) {
    const user = randomItem(users);
    const userInv = inventoriesByUser.get(user.id) || [];
    const cheapFeed = userInv.filter(inv => inv.category === 'Feed' && (inv.itemName.includes('Silage') || inv.itemName.includes('Fodder')));
    if (!cheapFeed.length) continue;
    const inventory = randomItem(cheapFeed);
    const cattleCount = 10 + Math.floor(Math.random() * 20);
    // Feeding quantity: 10-15 kg per cow per day
    const totalQuantity = round(cattleCount * (10 + Math.random() * 5));
    feedingLogs.push({
      userId: user.id,
      inventoryId: inventory.id,
      totalQuantity,
      cattleCount,
      date: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
      unitCostAtTime: inventory.costPerUnit, // cheap
      notes: `Feeding ${inventory.itemName}`
    });
  }
  await prisma.feedingLog.createMany({ data: feedingLogs });
  console.log(`✓ ${feedingLogs.length} feeding logs using cheap roughage`);

  // Create corresponding transactions for feeding (deduct stock)
  for (const log of feedingLogs) {
    await prisma.inventoryTransaction.create({
      data: {
        userId: log.userId,
        inventoryId: log.inventoryId,
        type: 'Out',
        quantity: log.totalQuantity,
        purpose: 'FEEDING' as any,
        unitCostAtTime: log.unitCostAtTime,
        date: log.date,
        notes: `Feeding transaction`
      }
    });
    // Update inventory quantity
    await prisma.inventory.update({
      where: { id: log.inventoryId },
      data: { quantity: { decrement: log.totalQuantity } }
    });
  }

  // ─── 8. COMMUNITY POSTS (variety) ───────────────────────────
  const postTitles = [
    'Best milking machine for small farms?', 'Organic certification experience', 'How to treat mastitis naturally',
    'Government scheme 2026 – subsidy update', 'Lumpy skin disease – latest prevention', 'Feeding silage vs hay',
    'Breeding strategies for high milk yield', 'Water management in summer', 'Vaccination schedule for calves',
    'Profitability of goat farming vs cattle', 'AI service success stories', 'Solar panels for dairy farms'
  ];

  for (let i = 0; i < 10; i++) {
    const user = randomItem(users);
    const post = await prisma.communityPost.create({
      data: {
        title: randomItem(postTitles),
        content: `Discussion about dairy farming best practices in the current season.`,
        category: randomItem(['Cattle Health', 'Milk Production', 'Feeding Strategy']),
        authorId: user.id,
        createdAt: randomDate(new Date(Date.now() - 90 * 86400000), new Date())
      }
    });
    const commenters = users.filter(u => u.id !== user.id).slice(0, 3);
    for (const commenter of commenters) {
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          content: `Very insightful, thanks!`,
          authorId: commenter.id,
          createdAt: randomDate(post.createdAt, new Date())
        }
      });
    }
  }
  console.log('✓ Community posts added');

  // ─── 9. ALERTS (variety, but not overwhelming) ───────────────
  const alerts = [];
  // Low stock alerts for a few items
  for (const [userId, invList] of inventoriesByUser.entries()) {
    const lowStockItems = invList.filter(inv => inv.quantity < inv.minQuantity);
    for (const inv of lowStockItems.slice(0, 2)) {
      alerts.push({
        userId,
        type: 'Inventory',
        message: `Low stock: ${inv.itemName} (${inv.quantity} ${inv.unit} left)`,
        severity: 'Medium',
        relatedId: inv.id,
        isRead: false,
        createdAt: new Date()
      });
    }
  }
  // Also add some expiry alerts
  for (const [userId, invList] of inventoriesByUser.entries()) {
    const expiredItems = invList.filter(inv => inv.expiryDate && inv.expiryDate < new Date());
    for (const inv of expiredItems.slice(0, 1)) {
      alerts.push({
        userId,
        type: 'Expiration',
        message: `Expired: ${inv.itemName} expired on ${inv.expiryDate?.toISOString().split('T')[0]}`,
        severity: 'Critical',
        relatedId: inv.id,
        isRead: false,
        createdAt: inv.expiryDate || new Date()
      });
    }
  }
  if (alerts.length) await prisma.alert.createMany({ data: alerts });
  console.log(`✓ ${alerts.length} alerts generated (low stock & expiry)`);

  console.log('\n✅ PROFITABLE SEED COMPLETE – positive net profit guaranteed');
  console.log('--------------------------------------------------');
  console.log('CREDENTIALS FOR TESTING:');
  console.log('Usernames: ravi_farmer, anjana_farmer, vikram_dairy');
  console.log('Password:  Farm@1234');
  console.log('--------------------------------------------------');
  console.log('Note: Milk price ₹65-75/L, feed cost ₹6-28/kg, farm expenses minimal → profit >0');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());