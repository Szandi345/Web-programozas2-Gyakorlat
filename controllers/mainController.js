const User = require("../models/User");
const bcrypt = require("bcrypt");
const Suti = require("../models/Suti");
const Ar = require("../models/Ar");
const Tartalom = require("../models/Tartalom");

exports.homeIndex = (req, res) => { res.render("home"); };
exports.userIndex = (req, res) => { res.render("user"); };
exports.adminIndex = (req, res) => { res.render("admin"); };

exports.diagramIndex = async (req, res) => {
    try {
        const osszeg = await Suti.aggregate([
            { $group: {_id: "$tipus", darab: { $sum: 1 } } },
        ]);
        const diagramAdatok = osszeg.map(item => ({
            tipus: item._id,
            darab: item.darab
        }));
        res.render("diagram", {
            diagramJSON: JSON.stringify(diagramAdatok)
        });
    } catch (error) {
        console.error("Diagram hiba:", error);
        res.status(500).send("Hiba történt az adatok lekérésekor!");
    }
};

exports.crudRead = async (req, res) => {
    try {
        const sutik = await Suti.find().sort({ id: 1 }).lean();
        const tartalmak = await Tartalom.find().lean();

        res.render("crudindex", { sutik, tartalmak });
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Hiba a sütik lekérésekor!");
    }
};

exports.showCrudCreate = (req, res) => {
    res.render("createupdate", {
        suti: {},
        cim: "Új süti hozzáadása",
        action: "/crudindex/uj"
    });
};

exports.crudCreate = async (req, res) => {
    try {
        const { nev, tipus } = req.body;

        if (!nev || !tipus) {
            return res.status(400).send("A név és a típus kötelező!");
        }

        const utolsoSuti = await Suti.findOne().sort({ id: -1 }).lean();
        const ujId = utolsoSuti ? utolsoSuti.id + 1 : 1;

        await Suti.create({
            id: ujId,
            nev: nev.trim(),
            tipus: tipus.trim(),
            dijazott: req.body.dijazott === "on"
        });

        res.redirect("/crudindex");
    } catch (error) {
        console.error(error);
        res.status(500).send("Hiba a süti mentésekor!");
    }
};

exports.showCrudUpdate = async (req, res) => {
    try {
        const suti = await Suti.findById(req.params.id).lean();

        if (!suti) {
            return res.status(404).send("Nincs ilyen süti az adatbázisban!");
        }

        res.render("createupdate", {
            suti,
            cim: "Süti szerkesztése",
            action: `/crudindex/${suti._id}/edit`
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Hiba a süti lekérésekor!");
    }
};

exports.crudUpdate = async (req, res) => {
    try {
        const { nev, tipus } = req.body;

        if (!nev || !tipus) {
            return res.status(400).send("A név és a típus kötelező!");
        }

        const suti = await Suti.findByIdAndUpdate(
            req.params.id,
            {
                nev: nev.trim(),
                tipus: tipus.trim(),
                dijazott: req.body.dijazott === "on"
            },
            { runValidators: true }
        );

        if (!suti) {
            return res.status(404).send("Nincs ilyen süti az adatbázisban!");
        }

        res.redirect("/crudindex");
    } catch (error) {
        console.error(error);
        res.status(500).send("Hiba a módosításkor!");
    }
};

exports.registerGet = (req, res) => { res.render("register"); };
exports.registerPost = async (req, res) => {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
        req.session.message = "This user already exists!";
        return res.redirect("/register");
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    await User.create({ username: req.body.username, password: hash, role: "user" });
    req.session.message = "Successful registration! You can log in.";
    res.redirect("/login");
};

exports.loginGet = (req, res) => { res.render("login"); };
exports.loginPost = async (req, res) => {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
        req.session.message = "Login failed!";
        return res.redirect("/login");
    }
    const ok = await bcrypt.compare(req.body.password, user.password);
    if (!ok) {
        req.session.message = "Login failed!";
        return res.redirect("/login");
    }
    req.session.user = { id: user._id, username: user.username, role: user.role };
    if (user.role === "admin") {
        res.redirect("/admin");
    } else {
        res.redirect("/user");
    }
};
exports.logout = (req, res) => {
    req.session.destroy(() => { res.redirect("/"); });
};

exports.adatbazisIndex = async (req, res) => {
    try {
        const sutik = await Suti.find().sort({ id: 1 }).lean();
        const arak = await Ar.find().lean();
        const tartalmak = await Tartalom.find().lean();

        res.render("adatbazis", {
            sutik,
            arak,
            tartalmak
        });
    } catch (error) {
        console.error("Adatbázis hiba:", error);
        res.status(500).send("Hiba történt az adatok lekérésekor!");
    }
};

exports.uzenetIndex = async (req, res) => {
    try {
        const uzenetek = await Uzenet.find().sort({ id: 1 }).lean();

        res.render("uzenetek", {
            uzenetek
        });
    } catch (error) {
        console.error("Adatbázis hiba:", error);
        res.status(500).send("Hiba történt az adatok lekérésekor!");
    }
};

const Uzenet = require("../models/Uzenet");

// Kapcsolat oldal megjelenítése
exports.kapcsolatGet = (req, res) => {
    res.render("kapcsolat", {
        hiba: "",
        siker: "",
        adatok: {}
    });
};

// Kapcsolat űrlap feldolgozása
exports.kapcsolatPost = async (req, res) => {
    const nev = String(req.body.nev || "").trim();
    const email = String(req.body.email || "").trim();
    const uzenet = String(req.body.uzenet || "").trim();

    const adatok = { nev, email, uzenet };

    // Szerveroldali ellenőrzés
    if (
        nev.length < 2 ||
        nev.length > 100 ||
        email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        uzenet.length < 10 ||
        uzenet.length > 5000
    ) {
        return res.status(400).render("kapcsolat", {
            hiba: "Kérjük, ellenőrizd a megadott adatokat!",
            siker: "",
            adatok
        });
    }
    try {
        await Uzenet.create({
            nev,
            email,
            uzenet
        });
        res.render("kapcsolat", {
            hiba: "",
            siker: "Üzenetedet sikeresen elküldtük!",
            adatok: {}
        });
    } catch (error) {
        console.error("Üzenetmentési hiba:", error);
        res.status(500).render("kapcsolat", {
            hiba: "Hiba történt az üzenet mentésekor!",
            siker: "",
            adatok
        });
    }
};