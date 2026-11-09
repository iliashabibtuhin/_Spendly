// Seeds an optional demo account so the app can be explored with realistic data.
// New users who register get the default categories automatically (see
// createDefaultCategories in src/services/category.service.js); this script
// re-uses that same function for the demo user.
//
// Demo login: demo@spendly.app / demo1234

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";
import { createDefaultCategories } from "../src/services/category.service.js";
import { currentMonth, shiftMonth } from "../src/utils/dates.js";

const DEMO_EMAIL = "demo@spendly.app";

// [day, categoryName, amount (BDT), description]
const MONTH_TEMPLATE = {
  INCOME: [
    [1, "Salary", 65000, "Monthly salary"],
    [14, "Freelance", 12000, "Website project"],
  ],
  EXPENSE: [
    [2, "Bills", 18000, "House rent"],
    [3, "Bills", 1450, "Electricity bill"],
    [4, "Food", 3200, "Groceries – Shwapno"],
    [6, "Transport", 450, "Uber to office"],
    [8, "Food", 780, "Lunch with team"],
    [10, "Health", 1200, "Pharmacy"],
    [12, "Shopping", 4200, "Eid clothes"],
    [15, "Education", 2500, "Online course"],
    [18, "Entertainment", 900, "Movie tickets"],
    [20, "Transport", 1200, "Bus pass top-up"],
    [22, "Food", 2650, "Groceries"],
    [25, "Bills", 1100, "Internet bill"],
  ],
};

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: { name: "Demo User", email: DEMO_EMAIL, passwordHash: await bcrypt.hash("demo1234", 12) },
  });
  await createDefaultCategories(user.id);
  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const byName = Object.fromEntries(categories.map((c) => [`${c.type}:${c.name}`, c.id]));

  const today = new Date();
  const thisMonth = currentMonth();
  const data = [];

  for (let offset = 5; offset >= 0; offset--) {
    const month = shiftMonth(thisMonth, -offset);
    // Vary amounts a little per month so the charts are not flat.
    const factor = 1 + ((offset * 7) % 5) / 20 - 0.1;
    for (const type of ["INCOME", "EXPENSE"]) {
      for (const [day, cat, amount, description] of MONTH_TEMPLATE[type]) {
        const date = new Date(`${month}-${String(day).padStart(2, "0")}T00:00:00.000Z`);
        if (date > today) continue; // never create future-dated transactions
        const scaled = cat === "Salary" || cat === "Bills" ? amount : Math.round(amount * factor);
        data.push({
          userId: user.id,
          type,
          categoryId: byName[`${type}:${cat}`],
          amount: scaled * 100,
          description,
          date,
        });
      }
    }
  }

  await prisma.transaction.createMany({ data });
  await prisma.budget.create({ data: { userId: user.id, month: thisMonth, amount: 40000 * 100 } });

  console.log(`Seeded ${DEMO_EMAIL} with ${data.length} transactions (password: demo1234).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
