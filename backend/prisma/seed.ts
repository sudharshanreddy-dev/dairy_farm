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
  console.log('🌱 Seeding database with MAXIMUM VARIETY (180 days, lineage, alerts, edge cases)...');

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
  await prisma.user.deleteMany();
  console.log('✓ Cleared existing data');

  const passwordHash = await bcrypt.hash('Farm@1234', 10);

  // ─── 1. MORE USERS (5) ──────────────────────────────────────
  const userData = [
    { username: 'ravi_farmer', fullName: 'Ravi Kumar', farmName: 'Krishna Dairy Farm', email: 'ravi@krishnadairy.com' },
    { username: 'anjana_farmer', fullName: 'Anjana Singh', farmName: 'Sunlight Bovines', email: 'anjana@sunlight.com' },
    { username: 'vikram_dairy', fullName: 'Vikram Reddy', farmName: 'Green Pastures', email: 'vikram@greenpastures.com' },
    { username: 'priya_organic', fullName: 'Priya Mehta', farmName: 'Organic Milk Haven', email: 'priya@organichaven.com' },
    { username: 'suresh_farmer', fullName: 'Suresh Nair', farmName: 'Malabar Dairy', email: 'suresh@malabardairy.com' },
  ];

  const users = [];
  for (const u of userData) {
    users.push(await prisma.user.create({
      data: { ...u, passwordHash, role: 'Farmer' }
    }));
  }
  console.log(`✓ ${users.length} users created`);

  // ─── 2. CATTLE WITH MULTI‑GENERATION LINEAGE (50 per user) ──
  const breeds = ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Murrah Buffalo', 'Tharparkar', 'Kankrej', 'Ongole', 'Hariana'];
  const statuses = ['Active', 'Pregnant', 'Sick', 'Sold', 'Dry', 'Calved', 'Deceased'];
  const qualities = ['Excellent', 'Good', 'Fair', 'Poor'];
  const genders = ['Female', 'Male'];

  // We'll generate 200–250 cattle total across 5 users
  let allCattle: any[] = [];
  let cattleMap: Map<number, any[]> = new Map(); // user id -> list of cattle for that user

  for (const user of users) {
    console.log(`  -> Creating cattle for ${user.username}...`);
    const userCattle: any[] = [];

    // Step A: Create 5 foundation animals (great‑grandparents)
    const founders: any[] = [];
    for (let i = 0; i < 5; i++) {
      const gender = i < 3 ? 'Female' : 'Male'; // 3 females, 2 males
      const founder = await prisma.cattle.create({
        data: {
          userId: user.id,
          tagNumber: `FND-${user.username.slice(0,2).toUpperCase()}-${i+1}`,
          name: `Founder ${gender === 'Female' ? 'Dam' : 'Sire'} ${i+1}`,
          breed: randomItem(breeds),
          gender,
          weight: round(400 + Math.random() * 300),
          status: 'Deceased', // founders are dead but kept for lineage
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

    // Step B: Create 10 grandparents (children of founders)
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
          breed: dam.breed, // inherit breed from mother
          gender,
          weight: round(300 + Math.random() * 350),
          status: randomItem(statuses.filter(s => s !== 'Deceased')), // alive
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

    // Step C: Create 35 current herd (third generation, some have parents)
    for (let i = 0; i < 35; i++) {
      const gender = randomItem(genders);
      const dam = randomItem(grandFemales);
      const sire = randomItem(grandMales);
      const cattle = await prisma.cattle.create({
        data: {
          userId: user.id,
          tagNumber: `${user.username.slice(0,3).toUpperCase()}-${(i+1).toString().padStart(3,'0')}`,
          name: `${randomItem(breeds).split(' ')[0]} ${i+1}`,
          breed: dam.breed,
          gender,
          weight: round(150 + Math.random() * 400),
          quality: randomItem(qualities),
          purchasePrice: round(25000 + Math.random() * 35000),
          status: randomItem(statuses),
          damId: dam.id,
          sireId: sire.id,
          dateOfBirth: new Date(Date.now() - (Math.random() * 5 + 0.2) * 365 * 86400000),
          purchaseDate: new Date(Date.now() - Math.random() * 2 * 365 * 86400000),
          notes: i % 5 === 0 ? 'High milk lineage' : 'Regular herd'
        }
      });
      userCattle.push(cattle);
    }
    allCattle.push(...userCattle);
    cattleMap.set(user.id, userCattle);
  }
  console.log(`✓ ${allCattle.length} cattle created with up to 3 generations of lineage`);

  // ─── 3. ALERTS FOR EDGE CASES (low stock, expired, health, vaccination) ──
  // We'll generate alerts after inventory & health records exist, but we already have cattle.
  // Alerts will be created later after inventory etc.

  // ─── 4. INVENTORY WITH VARIETY (20+ items per user) ─────────
  const inventoryCategories = ['Feed', 'Medicine', 'Equipment', 'Supplies', 'Vaccine'];
  const inventoryItems = [
    { name: 'High-Protein Pellets', cat: 'Feed', baseQty: 5000, min: 1000, unit: 'kg', cost: 75 },
    { name: 'Dry Fodder', cat: 'Feed', baseQty: 800, min: 1200, unit: 'kg', cost: 15 },  // low stock
    { name: 'Silage (Maize)', cat: 'Feed', baseQty: 8000, min: 2000, unit: 'kg', cost: 25 },
    { name: 'Cottonseed Cake', cat: 'Feed', baseQty: 3000, min: 500, unit: 'kg', cost: 60 },
    { name: 'Mineral Mixture', cat: 'Supplies', baseQty: 200, min: 50, unit: 'kg', cost: 180 },
    { name: 'Oxytocin Injection', cat: 'Medicine', baseQty: 8, min: 20, unit: 'vials', cost: 120 }, // low stock
    { name: 'Vitamin AD3E', cat: 'Medicine', baseQty: 100, min: 30, unit: 'ml', cost: 95 },
    { name: 'Antibiotic (Tetracycline)', cat: 'Medicine', baseQty: 45, min: 10, unit: 'doses', cost: 210 },
    { name: 'Anti‑inflammatory', cat: 'Medicine', baseQty: 60, min: 15, unit: 'tabs', cost: 35 },
    { name: 'Lumpy Skin Vaccine', cat: 'Vaccine', baseQty: 120, min: 40, unit: 'doses', cost: 50 },
    { name: 'FMD Vaccine', cat: 'Vaccine', baseQty: 200, min: 80, unit: 'doses', cost: 45 },
    { name: 'Milking Machine Spares', cat: 'Equipment', baseQty: 25, min: 5, unit: 'pcs', cost: 450 },
    { name: 'Nipple Cups', cat: 'Equipment', baseQty: 50, min: 10, unit: 'pcs', cost: 110 },
    { name: 'Iodine Teat Dip', cat: 'Supplies', baseQty: 30, min: 10, unit: 'liters', cost: 280 },
    { name: 'Urea (Feed Grade)', cat: 'Feed', baseQty: 600, min: 200, unit: 'kg', cost: 40 },
    { name: 'Electrolyte Powder', cat: 'Medicine', baseQty: 25, min: 5, unit: 'kg', cost: 320 },
    { name: 'Calcium Borogluconate', cat: 'Medicine', baseQty: 18, min: 5, unit: 'bottles', cost: 210 },
    { name: 'Hoof Trimming Kit', cat: 'Equipment', baseQty: 8, min: 2, unit: 'sets', cost: 1200 },
    { name: 'Straw Bedding', cat: 'Supplies', baseQty: 2000, min: 500, unit: 'kg', cost: 12 },
    { name: 'Probiotic Supplement', cat: 'Feed', baseQty: 150, min: 30, unit: 'kg', cost: 310 },
  ];

  const inventoriesByUser: Map<number, any[]> = new Map();

  for (const user of users) {
    const userInv = [];
    for (const item of inventoryItems) {
      // random expiry: 30% expired, 20% expiring within 30 days, rest far future
      let expiryDate = null;
      const r = Math.random();
      if (r < 0.3) {
        // expired
        expiryDate = new Date(Date.now() - (Math.random() * 90 + 1) * 86400000);
      } else if (r < 0.5) {
        // expiring soon (1‑30 days)
        expiryDate = new Date(Date.now() + (Math.random() * 30 + 1) * 86400000);
      } else {
        // valid for long
        expiryDate = new Date(Date.now() + (Math.random() * 365 + 90) * 86400000);
      }

      let quantity = item.baseQty;
      // Some items are deliberately low stock (already below min)
      if (item.name.includes('Dry Fodder') || item.name.includes('Oxytocin')) {
        quantity = item.min - (Math.random() * 10 + 1);
      } else {
        // random variance ±30%
        quantity = quantity * (0.7 + Math.random() * 0.6);
      }
      quantity = round(Math.max(0, quantity));

      const inv = await prisma.inventory.create({
        data: {
          userId: user.id,
          itemName: item.name,
          category: item.cat,
          quantity,
          minQuantity: item.min,
          unit: item.unit,
          costPerUnit: round(item.cost * (0.8 + Math.random() * 0.4)),
          expiryDate,
          lastRestocked: randomDate(new Date(Date.now() - 180 * 86400000), new Date()),
          notes: `Auto-generated ${item.cat} item`
        }
      });
      userInv.push(inv);

      // Create 5‑10 random transactions per inventory item
      const txns = [];
      for (let t = 0; t < 3 + Math.floor(Math.random() * 8); t++) {
        const type = Math.random() > 0.6 ? 'Addition' : 'Deduction';
        const qty = round(5 + Math.random() * 200);
        txns.push({
          userId: user.id,
          inventoryId: inv.id,
          type,
          quantity: qty,
          date: randomDate(new Date(Date.now() - 150 * 86400000), new Date()),
          notes: type === 'Addition' ? 'Purchase / Restock' : 'Daily usage / loss'
        });
      }
      await prisma.inventoryTransaction.createMany({ data: txns });
    }
    inventoriesByUser.set(user.id, userInv);
  }
  console.log(`✓ Inventory with 20+ items per user, including expired & low‑stock scenarios`);

  // ─── 5. HEALTH RECORDS & VACCINATIONS (max variety) ─────────
  const conditions = ['Mastitis', 'Fever', 'Limping', 'Digestive Issue', 'Skin Infection', 'Milk Fever', 'Pneumonia', 'Foot Rot'];
  const treatments = ['Antibiotic course', 'Anti‑inflammatory', 'Fluids therapy', 'Topical ointment', 'Hormone therapy', 'Surgery'];
  const vetNames = ['Dr. Sharma', 'Dr. Patel', 'Dr. Kaur', 'Govt. Vet', 'Mobile Vet Service', 'None'];
  const healthStatuses = ['Resolved', 'Ongoing', 'Critical'];
  const adminBy = ['Vet', 'Farmer', 'Assistant', 'External Agency'];

  const allHealthRecords = [];
  const allVaccinations = [];

  for (const cattle of allCattle) {
    // Health records: 40% chance to have 1‑3 records
    if (Math.random() < 0.4) {
      const numRecords = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numRecords; i++) {
        const date = randomDate(new Date(Date.now() - 180 * 86400000), new Date());
        allHealthRecords.push({
          userId: cattle.userId,
          cattleId: cattle.id,
          date,
          condition: randomItem(conditions),
          treatment: randomItem(treatments),
          vetName: randomItem(vetNames),
          status: randomItem(healthStatuses),
          cost: round(200 + Math.random() * 5000),
          notes: `Record ${i+1} – follow‑up required: ${Math.random() > 0.7}`
        });
      }
    }

    // Vaccinations: each animal gets 2‑4 vaccines over time
    const vaccines = ['FMD', 'Brucellosis', 'Anthrax', 'HS', 'BQ', 'Lumpy Skin', 'Rabies', 'IBR'];
    const numVax = 2 + Math.floor(Math.random() * 3);
    for (let v = 0; v < numVax; v++) {
      const dateGiven = randomDate(new Date(Date.now() - 300 * 86400000), new Date());
      const nextDue = new Date(dateGiven);
      nextDue.setMonth(nextDue.getMonth() + (Math.random() * 12 + 3)); // 3‑15 months
      allVaccinations.push({
        userId: cattle.userId,
        cattleId: cattle.id,
        vaccineName: randomItem(vaccines),
        dateGiven,
        nextDueDate: nextDue,
        administeredBy: randomItem(adminBy),
        cost: round(100 + Math.random() * 600),
        notes: `Batch #${Math.floor(Math.random()*100)}`
      });
    }
  }
  await prisma.healthRecord.createMany({ data: allHealthRecords });
  await prisma.vaccination.createMany({ data: allVaccinations });
  console.log(`✓ ${allHealthRecords.length} health records, ${allVaccinations.length} vaccinations with varied status & admins`);

  // ─── 6. MILK PRODUCTION (daily, 180 days) & SALES ──────────
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
        // Seasonal & breed variation
        const month = date.getMonth();
        const seasonFactor = (month >= 3 && month <= 6) ? 0.75 : (month >= 10 && month <= 12 ? 1.1 : 1.0);
        let baseMorning = 6.0;
        let baseEvening = 4.5;
        if (cow.breed?.includes('Holstein')) { baseMorning = 10.5; baseEvening = 7.5; }
        if (cow.breed?.includes('Jersey')) { baseMorning = 8.0; baseEvening = 6.0; }
        if (cow.breed?.includes('Murrah')) { baseMorning = 5.0; baseEvening = 4.0; }

        const morning = round(baseMorning * seasonFactor + (Math.random() * 3 - 1.5));
        const evening = round(baseEvening * seasonFactor + (Math.random() * 2.5 - 1.2));
        const total = round(morning + evening);
        dailyTotal += total;

        const qualityOptions = ['Excellent', 'Good', 'Fair', 'Poor'];
        const qualityWeights = [0.5, 0.3, 0.15, 0.05];
        const quality = qualityOptions[Math.random() < qualityWeights[0] ? 0 : Math.random() < qualityWeights[1] ? 1 : Math.random() < qualityWeights[2] ? 2 : 3];

        milkEntries.push({
          cattleId: cow.id,
          userId: user.id,
          date,
          morningYield: morning,
          eveningYield: evening,
          totalYield: total,
          quality,
          notes: d % 30 === 0 ? 'Monthly summary' : null
        });
      }

      // Sale record per user per day
      const pricePerLiter = round(42 + Math.random() * 18);
      const paymentMethods = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];
      const buyers = ['Amul', 'Mother Dairy', 'Local Mandi', 'Cooperative Society', 'Private Doodhwalas'];
      saleEntries.push({
        userId: user.id,
        date,
        quantityLiters: round(dailyTotal),
        pricePerLiter,
        totalAmount: round(dailyTotal * pricePerLiter),
        buyerName: randomItem(buyers),
        paymentStatus: Math.random() > 0.1 ? 'Paid' : (Math.random() > 0.5 ? 'Pending' : 'Overdue'),
        paymentMethod: randomItem(paymentMethods),
        notes: dailyTotal === 0 ? 'No production – dry period' : null
      });
    }

    // Batch insert milk every 10 days to avoid memory overload
    if (d % 10 === 0 && milkEntries.length) {
      await prisma.milkProduction.createMany({ data: milkEntries });
      milkEntries.length = 0;
    }
  }
  if (milkEntries.length) await prisma.milkProduction.createMany({ data: milkEntries });
  await prisma.sale.createMany({ data: saleEntries });
  console.log(`✓ ${historyDays+1} days of milk & sales with varied buyers/payments`);

  // ─── 7. FEEDING LOGS (using inventory items, random days) ───
  const feedingLogs = [];
  for (let i = 0; i < 300; i++) { // 300 random feeding events
    const user = randomItem(users);
    const userInv = inventoriesByUser.get(user.id) || [];
    if (!userInv.length) continue;
    const inventory = randomItem(userInv);
    const cattleCount = 5 + Math.floor(Math.random() * 50);
    const totalQuantity = round((Math.random() * 200 + 20) * cattleCount / 10);
    feedingLogs.push({
      userId: user.id,
      inventoryId: inventory.id,
      totalQuantity,
      cattleCount,
      date: randomDate(new Date(Date.now() - 90 * 86400000), new Date()),
      notes: `Feeding ${inventory.itemName} – batch ${Math.floor(Math.random()*100)}`
    });
  }
  await prisma.feedingLog.createMany({ data: feedingLogs });
  console.log(`✓ ${feedingLogs.length} feeding logs with varied cattle counts`);

  // ─── 8. COMMUNITY POSTS & COMMENTS (high variety) ──────────
  const postTitles = [
    'Best milking machine for small farms?', 'Organic certification experience', 'How to treat mastitis naturally',
    'Government scheme 2026 – subsidy update', 'Lumpy skin disease – latest prevention', 'Feeding silage vs hay',
    'Breeding strategies for high milk yield', 'Water management in summer', 'Vaccination schedule for calves',
    'Profitability of goat farming vs cattle', 'AI service success stories', 'Solar panels for dairy farms'
  ];
  const categories = ['General', 'Health', 'Feed', 'Equipment', 'Breeding', 'Marketing'];
  const authors = ['Ravi Farmer', 'Anjana Singh', 'Vikram Reddy', 'Priya Organic', 'Suresh Nair', 'DairyExpert', 'MilkLover2024'];

  for (let i = 0; i < 15; i++) {
    const post = await prisma.communityPost.create({
      data: {
        title: randomItem(postTitles) + ` (${i+1})`,
        content: `This is a detailed discussion about ${randomItem(postTitles)}. Please share your experiences. ${Math.random() > 0.5 ? 'Attached a photo in comments.' : ''}`,
        author: randomItem(authors),
        category: randomItem(categories),
        createdAt: randomDate(new Date(Date.now() - 90 * 86400000), new Date())
      }
    });
    // 3‑10 comments per post
    const numComments = 3 + Math.floor(Math.random() * 8);
    for (let c = 0; c < numComments; c++) {
      await prisma.communityComment.create({
        data: {
          postId: post.id,
          content: `Comment #${c+1}: ${Math.random() > 0.7 ? 'I completely agree!' : 'Interesting point, but have you considered...'}`,
          author: randomItem(authors),
          createdAt: randomDate(post.createdAt, new Date())
        }
      });
    }
  }
  console.log('✓ 15+ community posts with rich comments');

  // ─── 9. GENERATE ALERTS (low stock, expired, health, vaccines) ───
  const alerts = [];

  // Low stock alerts
  for (const [userId, invList] of inventoriesByUser.entries()) {
    for (const inv of invList) {
      if (inv.quantity < inv.minQuantity) {
        alerts.push({
          userId,
          type: 'Inventory',
          message: `Low stock: ${inv.itemName} (${inv.quantity} ${inv.unit} left, min ${inv.minQuantity})`,
          severity: 'High',
          relatedId: inv.id,
          isRead: Math.random() > 0.7,
          createdAt: new Date(Date.now() - Math.random() * 7 * 86400000)
        });
      }
      if (inv.expiryDate && inv.expiryDate < new Date()) {
        alerts.push({
          userId,
          type: 'Expiration',
          message: `Expired item: ${inv.itemName} expired on ${inv.expiryDate.toISOString().split('T')[0]}`,
          severity: 'Critical',
          relatedId: inv.id,
          isRead: false,
          createdAt: inv.expiryDate
        });
      }
    }
  }

  // Health alerts for ongoing/critical conditions
  const ongoingHealth = await prisma.healthRecord.findMany({
    where: { status: { in: ['Ongoing', 'Critical'] } },
    include: { cattle: true }
  });
  for (const rec of ongoingHealth) {
    alerts.push({
      userId: rec.userId,
      type: 'Health',
      message: `${rec.cattle.tagNumber} has ${rec.condition} (${rec.status}) – treatment: ${rec.treatment || 'none'}`,
      severity: rec.status === 'Critical' ? 'Critical' : 'High',
      relatedId: rec.id,
      isRead: false,
      createdAt: rec.date
    });
  }

  // Vaccination overdue alerts
  const today = new Date();
  const upcomingVax = await prisma.vaccination.findMany({
    where: { nextDueDate: { lt: new Date(today.getTime() + 7 * 86400000) } },
    include: { cattle: true }
  });
  for (const vax of upcomingVax) {
    alerts.push({
      userId: vax.userId,
      type: 'Vaccination',
      message: `${vax.cattle.tagNumber} due for ${vax.vaccineName} on ${vax.nextDueDate?.toISOString().split('T')[0]}`,
      severity: vax.nextDueDate && vax.nextDueDate < today ? 'Critical' : 'Medium',
      relatedId: vax.id,
      isRead: false,
      createdAt: vax.nextDueDate || new Date()
    });
  }

  if (alerts.length) {
    await prisma.alert.createMany({ data: alerts });
    console.log(`✓ ${alerts.length} alerts generated (low stock, expired, health, vaccination)`);
  } else {
    console.log('✓ No alerts generated (all thresholds satisfied)');
  }

  console.log('\n✅ HEAVY SEED COMPLETE – maximum variety achieved');
  console.log('--------------------------------------------------');
  console.log('CREDENTIALS FOR TESTING:');
  console.log('Usernames: ravi_farmer, anjana_farmer, vikram_dairy, priya_organic, suresh_farmer');
  console.log('Password:  Farm@1234');
  console.log('--------------------------------------------------');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
