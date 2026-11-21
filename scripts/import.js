require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Suti = require("../models/Suti");
const Ar = require("../models/Ar");
const Tartalom = require("../models/Tartalom");

function beolvas(fajlnev) {
    const tartalom = fs.readFileSync(
        path.join(__dirname, fajlnev),
        "utf8"
    ).replace(/^\uFEFF/, "").trim();

    const sorok = tartalom.split(/\r?\n/);
    const fejlec = sorok.shift().split("\t").map(x => x.trim());

    return sorok.filter(sor => sor.trim()).map(sor => {
        const ertekek = sor.split("\t");
        return Object.fromEntries(
            fejlec.map((mezo, i) => [
                mezo,
                (ertekek[i] || "").trim()
            ])
        );
    });
}

async function importalas() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Atlas kapcsolat sikeres!");

        const sutik = beolvas("suti.txt").map(s => ({
            id: Number(s.id),
            nev: s.nev,
            tipus: s.tipus,
            dijazott: s.dijazott === "-1" || s.dijazott === "1"
        }));

        const arak = beolvas("ar.txt").map(a => ({
            id: Number(a.id),
            sutiid: Number(a.sutiid),
            ertek: Number(a.ertek),
            egyseg: a.egyseg
        }));

        const tartalmak = beolvas("tartalom.txt").map(t => ({
            id: Number(t.id),
            sutiid: Number(t.sutiid),
            mentes: t.mentes
        }));

        // Meglévő azonosítók frissítése,
        // új rekordok beszúrása.
        async function ment(model, adatok) {
            if (!adatok.length) return;

            await model.bulkWrite(adatok.map(adat => ({
                updateOne: {
                    filter: { id: adat.id },
                    update: { $set: adat },
                    upsert: true
                }
            })));
        }
        await ment(Suti, sutik);
        await ment(Ar, arak);
        await ment(Tartalom, tartalmak);

        console.log(`Sütemények: ${sutik.length}`);
        console.log(`Árak: ${arak.length}`);
        console.log(`Mentességek: ${tartalmak.length}`);
        console.log("Importálás sikeres!");

    } catch (error) {
        console.error("Importálási hiba:", error);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}
importalas();