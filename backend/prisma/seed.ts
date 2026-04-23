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
  const breeds = ['Holstein Friesian', 'Jersey', 'Sahiwal', 'Gir', 'Red Sindhi', 'Murrah Buffalo'];
  const statuses = ['Active', 'Pregnant', 'Sick', 'Sold', 'Dry'];
  const cattleList = [];
  
  for (const user of createdUsers) {
    for (let i = 1; i <= 15; i++) {
      const breed = breeds[Math.floor(Math.random() * breeds.length)];
      const status = i <= 2 ? statuses[i] : 'Active'; // Ensure some variety
      const gender = Math.random() > 0.1 ? 'Female' : 'Male';
      
      cattleList.push(await prisma.cattle.create({
        data: {
          userId: user.id,
          name: `${breed.split(' ')[0]} ${i}`,
          breed,
          gender,
          weight: round(350 + Math.random() * 300),
          quality: i % 4 === 0 ? 'Excellent' : 'Good',
          purchasePrice: round(45000 + Math.random() * 50000),
          tagNumber: `${user.username.substring(0,3).toUpperCase()}-${i.toString().padStart(3, '0')}`,
          status: status,
          dateOfBirth: new Date(Date.now() - (Math.random() * 5 + 2) * 365 * 24 * 60 * 60 * 1000),
          purchaseDate: new Date(Date.now() - (Math.random() * 2) * 365 * 24 * 60 * 60 * 1000),
          notes: i % 5 === 0 ? 'High yield potential' : 'Healthy and active.'
        }
      }));
    }
  }
  console.log(`✓ ${cattleList.length} cattle added with diverse statuses`);

  // ─── Milk & Sales (90 days) ─────────────────────────
  const milkEntries = [];
  const salesRows = [];
  const historyDays = 90;

  for (let d = historyDays; d >= 0; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    for (const user of createdUsers) {
      const userCows = cattleList.filter(c => c.userId === user.id && c.gender === 'Female' && c.status === 'Active');
      let dailyTotalYield = 0;

      for (const cow of userCows) {
        let baseMorning = 6.5;
        let baseEvening = 4.5;
        if (cow.breed?.includes('Holstein')) { baseMorning = 9.5; baseEvening = 7.5; }
        
        const m = round(baseMorning + (Math.random() * 2 - 1));
        const e = round(baseEvening + (Math.random() * 2 - 1));
        const total = round(m + e);
        dailyTotalYield += total;

        milkEntries.push({
          cattleId: cow.id,
          userId: user.id,
          date,
          morningYield: m,
          eveningYield: e,
          totalYield: total,
          quality: Math.random() > 0.8 ? 'Fair' : 'Excellent',
        });
      }

      const pricePerLiter = round(48 + (Math.random() * 12));
      salesRows.push({
        userId: user.id,
        date,
        quantityLiters: round(dailyTotalYield),
        pricePerLiter: pricePerLiter,
        totalAmount: round(dailyTotalYield * pricePerLiter),
        buyerName: d % 4 === 0 ? 'Mother Dairy' : 'Local Retail',
        paymentStatus: 'Paid',
      });
    }
    
    if (d % 10 === 0 && milkEntries.length > 0) {
      await prisma.milkProduction.createMany({ data: milkEntries });
      milkEntries.length = 0;
    }
  }
  if (milkEntries.length > 0) await prisma.milkProduction.createMany({ data: milkEntries });
  await prisma.sale.createMany({ data: salesRows });
  console.log(`✓ Milk and sales history generated`);

  // ─── Health & Vaccinations (With Alert Scenarios) ──────────────────────────────
  const healthRecords = [];
  const vaccinations = [];
  const vaccines = ['FMD', 'Brucellosis', 'Anthrax', 'Black Quarter'];

  for (const cow of cattleList) {
    // Some health history
    if (Math.random() > 0.6) {
      healthRecords.push({
        userId: cow.userId,
        cattleId: cow.id,
        date: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
        condition: cow.status === 'Sick' ? 'Foot Rot' : 'General Checkup',
        cost: round(300 + Math.random() * 1000),
        status: cow.status === 'Sick' ? 'Ongoing' : 'Recovered'
      });
    }

    // Some past vaccinations
    vaccinations.push({
      userId: cow.userId,
      cattleId: cow.id,
      vaccineName: vaccines[Math.floor(Math.random() * vaccines.length)],
      dateGiven: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      nextDueDate: new Date(Date.now() + (Math.random() * 10 - 2) * 24 * 60 * 60 * 1000), // Some in past, some in next 7 days
      cost: round(100 + Math.random() * 200)
    });
  }
  await prisma.healthRecord.createMany({ data: healthRecords });
  await prisma.vaccination.createMany({ data: vaccinations });
  console.log(`✓ Health and Vaccinations added (Includes upcoming dues)`);

  // ─── Inventory (With Alert Scenarios) ──────────────────────────────
  const inventoryItems = [
    { name: 'Maize Feed', cat: 'Feed', qty: 1000, min: 200, unit: 'kg' },
    { name: 'Wheat Bran', cat: 'Feed', qty: 50, min: 200, unit: 'kg' }, // LOW STOCK
    { name: 'Calcium Tonic', cat: 'Medicine', qty: 20, min: 5, unit: 'L', expiry: -10 }, // EXPIRED
    { name: 'Dewormer', cat: 'Medicine', qty: 15, min: 2, unit: 'Tabs', expiry: 5 }, // EXPIRING SOON
    { name: 'FMD Vaccine', cat: 'Vaccine', qty: 100, min: 10, unit: 'Doses' },
  ];

  for (const user of createdUsers) {
    for (const item of inventoryItems) {
      let expiryDate = null;
      if (item.expiry) {
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + item.expiry);
      }
      await prisma.inventory.create({
        data: {
          userId: user.id,
          itemName: item.name,
          category: item.cat,
          quantity: round(item.qty),
          minQuantity: round(item.min),
          unit: item.unit,
          costPerUnit: round(20 + Math.random() * 100),
          expiryDate: expiryDate
        }
      });
    }
  }
  console.log(`✓ Inventory added (Includes low stock and expired items)`);

  // ─── Community ──────────────────────────────────────
  const posts = [
    { title: 'Welcome to DairyFarm Pro!', content: 'Excited to see this community grow.', author: 'System Admin', category: 'General' },
    { title: 'Best Silage Practices', content: 'What are your tips for making high-quality silage?', author: 'Ravi Kumar', category: 'Feed' },
    { title: 'Vaccination Drive 2026', content: 'Government announced FMD drive starting next week.', author: 'Anjana Singh', category: 'Health' },
  ];
  for (const p of posts) {
    const post = await prisma.communityPost.create({ data: p });
    await prisma.communityComment.create({
      data: { postId: post.id, content: 'Great post, very helpful!', author: 'User123' }
    });
  }
  console.log('✓ Community posts and comments added');

  console.log('\n✅ SEED COMPLETE. APP IS READY FOR TESTING.');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
