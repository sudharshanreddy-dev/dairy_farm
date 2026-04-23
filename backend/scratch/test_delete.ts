import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const cattleList = await prisma.cattle.findMany({ take: 1 });
    if (cattleList.length > 0) {
      const id = cattleList[0].id;
      console.log('Trying to delete cattle ID:', id);
      await prisma.cattle.delete({ where: { id } });
      console.log('Success');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
