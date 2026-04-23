import { prisma } from '../src/db';
async function main() {
  try {
    const cattleList = await prisma.cattle.findMany({ take: 1 });
    if (cattleList.length > 0) {
      const id = cattleList[0].id;
      console.log('Trying to delete cattle ID:', id);
      
      await prisma.cattle.updateMany({
        where: { damId: Number(id) },
        data: { damId: null }
      });
      await prisma.cattle.updateMany({
        where: { sireId: Number(id) },
        data: { sireId: null }
      });
      
      await prisma.cattle.delete({ where: { id } });
      console.log('Success');
    } else {
        console.log('No cattle found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}
main();
