import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const events = [
    {
      title: 'Головоломка 2',
      description: 'Радость, Печаль, Гнев, Страх и Брезгливость теперь вынуждены уживаться с новыми эмоциями.',
      date: new Date('2024-07-20'),
      time: '20:00',
      posterUrl: null,
      isFootball: false,
      totalPoufs: 50,
      availablePoufs: 50,
      poufPrice: 80000,
      totalTapchans: 10,
      availableTapchans: 10,
      tapchanPrice: 320000,
    },
    {
      title: 'Евро 2024: Финал',
      description: 'Трансляция финального матча Чемпионата Европы 2024.',
      date: new Date('2024-07-22'),
      time: '22:00',
      posterUrl: null,
      isFootball: true,
      totalPoufs: 50,
      availablePoufs: 50,
      poufPrice: 80000,
      totalTapchans: 10,
      availableTapchans: 10,
      tapchanPrice: 320000,
    }
  ];

  for (const event of events) {
    await prisma.event.create({
      data: event
    });
  }

  console.log('Seeded database with initial events');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
