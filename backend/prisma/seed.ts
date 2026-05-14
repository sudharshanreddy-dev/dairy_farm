import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

dotenv();
function dotenv() {
  try { require('dotenv').config(); } catch {}
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database with DIVERSE data (90 days history, alerts scenarios, strict rounding)...');

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

  const round = (num: number) => parseFloat(num.toFixed(2));

  // ─── Users ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Farm@1234', 10);
  const users = [
    { username: 'ravi_farmer', fullName: 'Ravi Kumar', farmName: 'Krishna Dairy Farm', email: 'ravi@krishnadairy.com' },
    { username: 'anjana_farmer', fullName: 'Anjana Singh', farmName: 'Sunlight Bovines', email: 'anjana@sunlight.com' },
    { username: 'vikram_dairy', fullName: 'Vikram Reddy', farmName: 'Green Pastures', email: 'vikram@greenpastures.com' },
  ];

  const createdUsers = [];
  for (const u of users) {
    createdUsers.push(await prisma.user.create({
      data: { ...u, passwordHash, role: 'Farmer' }
    }));
  }
  console.log(`✓ Users created`);

  // ─── Cattle ─────────────────────────────────────────────────
  const breeds = ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Murrah Buffalo', 'Tharparkar', 'Kankrej'];
  const statuses = ['Active', 'Pregnant', 'Sick', 'Sold', 'Dry', 'Calved'];
  const cattleList = [];
  
  for (const user of createdUsers) {
    for (let i = 1; i <= 50; i++) { // Increased to 50 cattle
      const breed = breeds[Math.floor(Math.random() * breeds.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const gender = Math.random() > 0.1 ? 'Female' : 'Male';
      
      cattleList.push(await prisma.cattle.create({
        data: {
          userId: user.id,
          name: `${breed.split(' ')[0]} ${i}`,
          breed,
          gender,
          weight: round(300 + Math.random() * 400),
          quality: i % 5 === 0 ? 'Excellent' : i % 3 === 0 ? 'Good' : 'Fair',
          purchasePrice: round(40000 + Math.random() * 60000),
          tagNumber: `${user.username.substring(0,3).toUpperCase()}-${i.toString().padStart(3, '0')}`,
          status: status,
          dateOfBirth: new Date(Date.now() - (Math.random() * 6 + 1) * 365 * 24 * 60 * 60 * 1000),
          purchaseDate: new Date(Date.now() - (Math.random() * 3) * 365 * 24 * 60 * 60 * 1000),
          notes: i % 10 === 0 ? 'Elite Pedigree' : 'Standard Farm Stock'
        }
      }));
    }
  }
  console.log(`✓ ${cattleList.length} cattle added with heavy variety`);

  // ─── Milk & Sales (180 days) ─────────────────────────
  const milkEntries = [];
  const salesRows = [];
  const historyDays = 180; // Increased to 6 months

  for (let d = historyDays; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    for (const user of createdUsers) {
      const userCows = cattleList.filter(c => c.userId === user.id && c.gender === 'Female' && (c.status === 'Active' || c.status === 'Pregnant'));
      let dailyTotalYield = 0;

      for (const cow of userCows) {
        // Seasonal variation simulation
        const month = date.getMonth();
        const seasonFactor = (month >= 3 && month <= 6) ? 0.8 : 1.1; // Lower in summer
        
        let baseMorning = 7.0 * seasonFactor;
        let baseEvening = 5.0 * seasonFactor;
        if (cow.breed?.includes('Holstein')) { baseMorning = 10.0 * seasonFactor; baseEvening = 8.0 * seasonFactor; }
        
        const m = round(baseMorning + (Math.random() * 3 - 1.5));
        const e = round(baseEvening + (Math.random() * 3 - 1.5));
        const total = round(m + e);
        dailyTotalYield += total;

        milkEntries.push({
          cattleId: cow.id,
          userId: user.id,
          date,
          morningYield: m,
          eveningYield: e,
          totalYield: total,
          quality: Math.random() > 0.9 ? 'Fair' : 'Excellent',
        });
      }

      const pricePerLiter = round(45 + (Math.random() * 15));
      salesRows.push({
        userId: user.id,
        date,
        quantityLiters: round(dailyTotalYield),
        pricePerLiter: pricePerLiter,
        totalAmount: round(dailyTotalYield * pricePerLiter),
        buyerName: d % 7 === 0 ? 'Heritage Foods' : d % 3 === 0 ? 'Amul Cooperative' : 'Local Vendor',
        paymentStatus: Math.random() > 0.05 ? 'Paid' : 'Pending',
      });
    }
    
    // Chunked creation to avoid memory issues
    if (d % 5 === 0 && milkEntries.length > 0) {
      await prisma.milkProduction.createMany({ data: milkEntries });
      milkEntries.length = 0;
    }
  }
  if (milkEntries.length > 0) await prisma.milkProduction.createMany({ data: milkEntries });
  await prisma.sale.createMany({ data: salesRows });
  console.log(`✓ 180 days of milk and financial history generated`);

  // ─── Health & Vaccinations ──────────────────────────────
  const healthRecords = [];
  const vaccinations = [];
  const conditions = ['Mastitis', 'Fever', 'Limping', 'Digestive Issue', 'Skin Infection'];
  const vaccines = ['FMD', 'Brucellosis', 'Anthrax', 'HS', 'BQ', 'Lumpy Skin'];

  for (const cow of cattleList) {
    if (Math.random() > 0.4) {
      healthRecords.push({
        userId: cow.userId,
        cattleId: cow.id,
        date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        cost: round(500 + Math.random() * 2500),
        status: Math.random() > 0.8 ? 'Ongoing' : 'Resolved'
      });
    }

    // Multiple vaccinations per animal
    for (let v = 0; v < 2; v++) {
      vaccinations.push({
        userId: cow.userId,
        cattleId: cow.id,
        vaccineName: vaccines[Math.floor(Math.random() * vaccines.length)],
        dateGiven: new Date(Date.now() - (v * 90 + Math.random() * 30) * 24 * 60 * 60 * 1000),
        nextDueDate: new Date(Date.now() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000),
        cost: round(150 + Math.random() * 350)
      });
    }
  }
  await prisma.healthRecord.createMany({ data: healthRecords });
  await prisma.vaccination.createMany({ data: vaccinations });
  console.log(`✓ Complex health and vaccination history populated`);

  // ─── Inventory & Transactions ──────────────────────────────
  const inventoryItems = [
    { name: 'High-Protein Pellets', cat: 'Feed', qty: 2500, min: 500, unit: 'kg' },
    { name: 'Dry Fodder', cat: 'Feed', qty: 100, min: 1000, unit: 'kg' }, // LOW STOCK
    { name: 'Silage', cat: 'Feed', qty: 5000, min: 1000, unit: 'kg' },
    { name: 'Oxytocin', cat: 'Medicine', qty: 5, min: 20, unit: 'Vials' }, // LOW STOCK
    { name: 'Vitamin B12', cat: 'Medicine', qty: 50, min: 10, unit: 'Tabs', expiry: -5 }, // EXPIRED
    { name: 'Antibiotics Type-A', cat: 'Medicine', qty: 30, min: 5, unit: 'ml', expiry: 4 }, // EXPIRING
    { name: 'Nipples & Buckets', cat: 'Equipment', qty: 40, min: 5, unit: 'Pcs' },
  ];

  for (const user of createdUsers) {
    for (const item of inventoryItems) {
      let expiryDate = null;
      if (item.expiry) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + item.expiry);
      }
      const inv = await prisma.inventory.create({
        data: {
          userId: user.id,
          itemName: item.name,
          category: item.cat,
          quantity: round(item.qty),
          minQuantity: round(item.min),
          unit: item.unit,
          costPerUnit: round(50 + Math.random() * 150),
          expiryDate: expiryDate
        }
      });

      // Add random transactions history
      await prisma.inventoryTransaction.createMany({
        data: [
          { userId: user.id, inventoryId: inv.id, type: 'Addition', quantity: 500, notes: 'Restock' },
          { userId: user.id, inventoryId: inv.id, type: 'Deduction', quantity: 50, notes: 'Daily Usage' }
        ]
      });
    }
  }
  console.log(`✓ Inventory restocked with strategic low-stock and expired items`);

  // ─── Community Posts & Deep Comments ───────────────────────
  const posts = [
    { title: 'Best Silage Management for 2026', content: 'Our recent harvest yielded 20% more after switching to organic fertilizers. Any similar experiences?', author: 'Ravi Kumar', category: 'Feed' },
    { title: 'New Government Subsidy for Dairy Equipment', content: 'Apply via the official portal before end of this month for 35% discount.', author: 'Anjana Singh', category: 'General' },
    { title: 'Lumpy Skin Alert in Northern District', content: 'Be careful with external animals. Vaccinate your herd ASAP.', author: 'Admin Vikram', category: 'Health' },
  ];

  for (const p of posts) {
    const post = await prisma.communityPost.create({ data: p });
    const commenters = ['FarmerJohn', 'DairyQueen', 'GreenMilk', 'BovineExpert'];
    for (const c of commenters) {
      await prisma.communityComment.create({
        data: { postId: post.id, content: `Comment from ${c}: Very insightful information, thanks for sharing!`, author: c }
      });
    }
  }
  console.log('✓ Community board populated with variety of discussions');

  console.log('\n✅ HEAVY SEED COMPLETE.');
  console.log('--------------------------------------------------');
  console.log('CREDENTIALS FOR TESTING:');
  console.log('Usernames: ravi_farmer, anjana_farmer, vikram_dairy');
  console.log('Password:  Farm@1234');
  console.log('--------------------------------------------------');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
