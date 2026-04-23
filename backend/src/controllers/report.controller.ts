import { Request, Response } from 'express';
import { prisma } from '../db';

/**
 * Simple CSV generator that handles escaping and quotes for Excel compatibility
 */
const toCSV = (headers: string[], data: any[][]): string => {
  const escape = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val).replace(/"/g, '""'); // Escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = `"${str}"`; // Wrap in quotes if special chars present
    }
    return str;
  };

  const headerRow = headers.join(',');
  const bodyRows = data.map(row => row.map(escape).join(',')).join('\n');
  
  // Return with BOM for Excel UTF-8 support
  return '\ufeff' + headerRow + '\n' + bodyRows;
};

export const exportHerd = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const cattle = await prisma.cattle.findMany({
      where: { userId },
      orderBy: { tagNumber: 'asc' }
    });

    const headers = [
      'Tag Number', 'Name', 'Breed', 'Gender', 'Status', 'Quality', 
      'Weight (kg)', 'Purchase Price', 'Purchase Date', 'DOB', 'Notes'
    ];

    const data = cattle.map(c => [
      c.tagNumber,
      c.name,
      c.breed,
      c.gender,
      c.status,
      c.quality,
      c.weight,
      c.purchasePrice,
      c.purchaseDate ? c.purchaseDate.toLocaleDateString() : 'N/A',
      c.dateOfBirth ? c.dateOfBirth.toLocaleDateString() : 'N/A',
      c.notes
    ]);

    const csv = toCSV(headers, data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=herd_roster.csv');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate herd report' });
  }
};

export const exportFinancials = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Aggregate from multiple sources
    const [sales, health, vax, cattle] = await Promise.all([
      prisma.sale.findMany({ where: { userId } }),
      prisma.healthRecord.findMany({ where: { userId }, include: { cattle: true } }),
      prisma.vaccination.findMany({ where: { userId }, include: { cattle: true } }),
      prisma.cattle.findMany({ where: { userId } })
    ]);

    const headers = ['Date', 'Category', 'Type', 'Amount', 'Description', 'Related Entity'];
    const ledger: any[][] = [];

    // Sales -> Income
    sales.forEach(s => ledger.push([s.date.toLocaleDateString(), 'Sale', 'Income', s.totalAmount, `Sold ${s.quantityLiters}L milk`, s.buyerName || 'Client']));
    
    // Health -> Expense
    health.forEach(h => {
      if (h.cost > 0) ledger.push([h.date.toLocaleDateString(), 'Medical', 'Expense', h.cost, h.condition, h.cattle.name || h.cattle.tagNumber]);
    });

    // Vax -> Expense
    vax.forEach(v => {
      if (v.cost > 0) ledger.push([v.dateGiven.toLocaleDateString(), 'Vaccination', 'Expense', v.cost, v.vaccineName, v.cattle.name || v.cattle.tagNumber]);
    });

    // Cattle -> Purchase Expense
    cattle.forEach(c => {
      if (c.purchasePrice > 0) ledger.push([c.purchaseDate?.toLocaleDateString() || c.createdAt.toLocaleDateString(), 'Purchase', 'Expense', c.purchasePrice, `Purchased ${c.breed} cattle`, c.name || c.tagNumber]);
    });

    // Sort by date desc
    ledger.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    const csv = toCSV(headers, ledger);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=financial_ledger.csv');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate financial report' });
  }
};

export const exportCattleHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params as { id: string };

    const cattle = await prisma.cattle.findFirst({
      where: { id: parseInt(id), userId },
      include: {
        milkRecords: { orderBy: { date: 'desc' } },
        healthRecords: { orderBy: { date: 'desc' } },
        vaccinations: { orderBy: { dateGiven: 'desc' } }
      }
    });

    if (!cattle) return res.status(404).json({ error: 'Cattle not found' });

    const headers = ['Date', 'Record Type', 'Detail', 'Metric/Status', 'Cost', 'Notes'];
    const data: any[][] = [];

    cattle.milkRecords.forEach(m => data.push([m.date.toLocaleDateString(), 'Milk Production', `${m.totalYield} L`, m.quality || 'Good', '', '']));
    cattle.healthRecords.forEach(h => data.push([h.date.toLocaleDateString(), 'Health Record', h.condition, h.status, h.cost || 0, h.notes || '']));
    cattle.vaccinations.forEach(v => data.push([v.dateGiven.toLocaleDateString(), 'Vaccination', v.vaccineName, `Next: ${v.nextDueDate?.toLocaleDateString() || 'N/A'}`, v.cost || 0, '']));

    data.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    const csv = toCSV(headers, data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=cattle_${cattle.tagNumber}_history.csv`);
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate cattle history report' });
  }
};
