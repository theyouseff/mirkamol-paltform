import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => { console.log("main dir ok:", await p.user.count()); await p.$disconnect(); })();
