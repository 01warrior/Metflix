import { db } from "../src/lib/db";

const TMDB_POSTERS = [
  "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  "/9gk7adHYeDvHkCSEhniJIGnw4Co.jpg",
  "/r7gsqOpdeAR5f9OTKj4pEmK9dqp.jpg",
  "/kYgQzzjNis5jJalYtIHgrom0gOx.jpg",
  "/h8gHn0OzBoKcXnpWrmVUyRSMIiB.jpg",
  "/7WsyChQLEftFiDhRkZUHahFXChJ.jpg",
  "/dvTJaNiulVe1dA1OoKjL7lMNOPA.jpg",
  "/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
  "/fVZlqqDyVMqZsSS9U8K6EfJl79R.jpg",
  "/kAVRgw7GnQoaNzJcDxvGt3qzFJM.jpg",
  "/qAZ2pz3J5vJnJxLcCnmhYfEDMBB.jpg",
  "/mqsPoyeDc9lFu6TsyAe0hhXFGDW.jpg",
  "/nGxUxi3PfXDRm7Vg95VBNgNM8yc.jpg",
  "/6bCpl3PzYjKkXaxPz9PmzKV1KzR.jpg",
  "/pFlgASWmbGkDsmSsUXYnbkZ1Q1R.jpg",
  "/6JjfSchsU6daXk2AKX8EEBjO3Fm.jpg",
  "/bQRMBzFlmXAcCLdzPPhMxBh3x7h.jpg",
  "/bcCBY9neL4mNpJssN7Xxn4f2XNc.jpg",
  "/iZf0Kd8JMMBGxsMctoQjBdhyq2g.jpg",
  "/wF4iLUDCgpjLTe2dICNl0PVWR5o.jpg",
  "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg",
  "/aKmFiP3aBtdmZlY7hXnFcSsN7VW.jpg",
  "/eDqSjkGG2e5gL2RXaA6PG1Gj14k.jpg",
  "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
  "/tLelKoPNiyJCSEtQTz1FGv4TSgI.jpg",
  "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
  "/fN8E3u2Lzm7YwltW6VjB7eLbT3v.jpg",
  "/AoW1dYnFMa3fVUyR3qBh1Qc4vW9.jpg",
  "/5bFKVbWwMcHvSA8gQ4R8rFHkpHG.jpg",
  "/m4c3POeEuXkYPeB7v0YwLkBh2gH.jpg",
  "/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg",
  "/q5HZvVGZmkP2GE3gQYuYjhMcK1U.jpg",
  "/hZkgo8f7cOI1myMx8xzDUPpMRoB.jpg",
  "/d9iYD3b7WP6UbJYwbpPyuOPMlV7.jpg",
  "/pMqiHsXXjVSL5Pq3FPndyQdqcV4.jpg",
  "/kP1iyPpMFoXhKRhG7QjfZ6a9MW3.jpg",
  "/rQtfrTLZC4Y8WvJZK5tP7vN2cDh.jpg",
  "/dMW9Pg4QmX7k1b3FvNSRc6YHzJo.jpg",
  "/7WDb9VjioVLGMk0YTzNMHHnFEWS.jpg",
  "/h6tP2MRDaDDEK9YlBCoJk9fh6AL.jpg",
  "/nMHlYkDJFdNbpgrMEgo9a3m3H9o.jpg",
];

const TMDB_BACKDROPS = [
  "/xJHokMbljvjADYdit5fK1DVfjko.jpg",
  "/bQXAo0FLZw3b52KPG3zAPXl2r2j.jpg",
  "/7D430eqZj8y3oVkLFfsWXGRcpEG.jpg",
  "/ztkUQFLlC19CCMYHW73WxxWgMD5.jpg",
  "/ouoGcKDhBxuOv2V1OvOEhgqvKHB.jpg",
  "/nMdJIqLGuPJvbsHWJ9DUjKMTqzP.jpg",
  "/4M9MZyJlpPQ9cOvjzXZtAOCGp0D.jpg",
  "/1X7vow16X7CnCoexXh4H4F2yDJv.jpg",
  "/7WsyChQLEftFiDhRkZUHahFXChJ.jpg",
  "/eWp6nzvRtQgqYnYxnLOlZtn8Jy7.jpg",
  "/wcYxxlg4zvz5cTPnKNfKrYHRBvk.jpg",
  "/wMq9L5CM6pZnsNenMUfjOjVmX6p.jpg",
  "/pVWTMwBOVRME2B6iOcGh2n8sHGV.jpg",
  "/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg",
  "/h1mdalOmOWwLuDJPJnJOGzqMkBY.jpg",
  "/stTEGOl6z20cNOmG7NyiKiAi8Vr.jpg",
  "/pGqMvTqZx4d7VXKdAiNJQD1JxG5.jpg",
  "/2xSzAFMDkUFlfOoK3MKlEgYbMbK.jpg",
  "/dDIIlFEhHhPn5EFsoPBRbnvMCYO.jpg",
  "/jR4JBHuNG3ALNaTMY5Wjk4MVP7a.jpg",
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear all existing data
  await db.contentCategory.deleteMany();
  await db.embedSource.deleteMany();
  await db.content.deleteMany();
  await db.category.deleteMany();

  // Create categories
  const categories = await Promise.all([
    db.category.create({ data: { name: "Action", slug: "action", type: "all", order: 0 } }),
    db.category.create({ data: { name: "Comédie", slug: "comedie", type: "all", order: 1 } }),
    db.category.create({ data: { name: "Drame", slug: "drame", type: "all", order: 2 } }),
    db.category.create({ data: { name: "Science-Fiction", slug: "science-fiction", type: "all", order: 3 } }),
    db.category.create({ data: { name: "Horreur", slug: "horreur", type: "all", order: 4 } }),
    db.category.create({ data: { name: "Animation", slug: "animation", type: "all", order: 5 } }),
    db.category.create({ data: { name: "Thriller", slug: "thriller", type: "all", order: 6 } }),
    db.category.create({ data: { name: "Romance", slug: "romance", type: "all", order: 7 } }),
    db.category.create({ data: { name: "Aventure", slug: "aventure", type: "all", order: 8 } }),
    db.category.create({ data: { name: "Documentaire", slug: "documentaire", type: "all", order: 9 } }),
    db.category.create({ data: { name: "Films", slug: "films", type: "movie", order: 10 } }),
    db.category.create({ data: { name: "Séries", slug: "series", type: "series", order: 11 } }),
    db.category.create({ data: { name: "Anime", slug: "anime", type: "anime", order: 12 } }),
    db.category.create({ data: { name: "Manga", slug: "manga", type: "manga", order: 13 } }),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const getPoster = (i: number) => TMDB_POSTERS[i % TMDB_POSTERS.length];
  const getBackdrop = (i: number) => TMDB_BACKDROPS[i % TMDB_BACKDROPS.length];

  // === MOVIES ===
  const movies = [
    { title: "Dune: Part Two", titleFr: "Dune : Deuxième Partie", overview: "Paul Atréides s'unit aux Fremen pour venger sa famille tout en essayant d'empêcher un avenir terrible qu'il seul peut prévoir.", overviewFr: "Paul Atréides s'unit aux Fremen pour venger sa famille tout en essayant d'empêcher un avenir terrible qu'il seul peut prévoir.", genres: "Science-Fiction,Aventure,Drame", year: 2024, rating: 8.2, tmdbId: 693134, runtime: 166, featured: true, featuredOrder: 1, cats: ["science-fiction", "aventure", "films"] },
    { title: "Oppenheimer", titleFr: "Oppenheimer", overview: "L'histoire du physicien J. Robert Oppenheimer et son rôle dans le développement de la bombe atomique.", overviewFr: "L'histoire du physicien J. Robert Oppenheimer et son rôle dans le développement de la bombe atomique.", genres: "Drame,Histoire,Thriller", year: 2023, rating: 8.4, tmdbId: 872585, runtime: 180, featured: true, featuredOrder: 2, cats: ["drame", "thriller", "films"] },
    { title: "John Wick: Chapter 4", titleFr: "John Wick : Chapitre 4", overview: "John Wick découvre un moyen de vaincre la Haute Table. Mais avant de gagner sa liberté, il doit faire face à un nouvel ennemi.", overviewFr: "John Wick découvre un moyen de vaincre la Haute Table. Mais avant de gagner sa liberté, il doit faire face à un nouvel ennemi.", genres: "Action,Thriller", year: 2023, rating: 7.8, tmdbId: 603692, runtime: 169, featured: true, featuredOrder: 3, cats: ["action", "thriller", "films"] },
    { title: "Barbie", titleFr: "Barbie", overview: "Barbie et Ken font l'expérience du monde réel après avoir quitté le monde parfait de Barbieland.", overviewFr: "Barbie et Ken font l'expérience du monde réel après avoir quitté le monde parfait de Barbieland.", genres: "Comédie,Aventure,Fantastique", year: 2023, rating: 7.0, tmdbId: 346698, runtime: 114, cats: ["comedie", "aventure", "films"] },
    { title: "Spider-Man: Across the Spider-Verse", titleFr: "Spider-Man : Across the Spider-Verse", overview: "Miles Morales se lance dans une aventure à travers le multivers avec Gwen Stacy.", overviewFr: "Miles Morales se lance dans une aventure à travers le multivers avec Gwen Stacy.", genres: "Animation,Action,Aventure", year: 2023, rating: 8.7, tmdbId: 569094, runtime: 140, featured: true, featuredOrder: 4, cats: ["animation", "action", "aventure", "films"] },
    { title: "The Batman", titleFr: "The Batman", overview: "Quand un tueur se lance dans une série de meurtres monstrueux à Gotham, Batman doit enquêter.", overviewFr: "Quand un tueur se lance dans une série de meurtres monstrueux à Gotham, Batman doit enquêter.", genres: "Action,Crime,Drame", year: 2022, rating: 7.7, tmdbId: 414906, runtime: 176, cats: ["action", "drame", "thriller", "films"] },
    { title: "Interstellar", titleFr: "Interstellar", overview: "Un groupe d'explorateurs utilise un trou de ver pour parcourir de vastes distances dans l'espace.", overviewFr: "Un groupe d'explorateurs utilise un trou de ver pour parcourir de vastes distances dans l'espace.", genres: "Science-Fiction,Drame,Aventure", year: 2014, rating: 8.6, tmdbId: 157336, runtime: 169, cats: ["science-fiction", "drame", "aventure", "films"] },
    { title: "Inception", titleFr: "Inception", overview: "Un voleur qui dérobe des secrets en s'infiltrant dans les rêves se voit offrir une chance de rédemption.", overviewFr: "Un voleur qui dérobe des secrets en s'infiltrant dans les rêves se voit offrir une chance de rédemption.", genres: "Science-Fiction,Action,Thriller", year: 2010, rating: 8.8, tmdbId: 27205, runtime: 148, cats: ["science-fiction", "action", "thriller", "films"] },
    { title: "Parasite", titleFr: "Parasite", overview: "La famille Kim, sans le sou, s'infiltre dans la vie des riches Parks.", overviewFr: "La famille Kim, sans le sou, s'infiltre dans la vie des riches Parks.", genres: "Drame,Thriller,Comédie", year: 2019, rating: 8.5, tmdbId: 496243, runtime: 132, cats: ["drame", "thriller", "comedie", "films"] },
    { title: "Everything Everywhere All at Once", titleFr: "Tout partout à la fois", overview: "Une femme chinoise-américaine propriétaire d'une laverie doit sauver le multivers.", overviewFr: "Une femme chinoise-américaine propriétaire d'une laverie doit sauver le multivers.", genres: "Action,Comédie,Science-Fiction", year: 2022, rating: 7.8, tmdbId: 545611, runtime: 139, cats: ["action", "comedie", "science-fiction", "films"] },
    { title: "Killers of the Flower Moon", titleFr: "Killers of the Flower Moon", overview: "Quand l'huile est découverte dans le territoire osage, des meurtres mystérieux frappent la communauté.", overviewFr: "Quand l'huile est découverte dans le territoire osage, des meurtres mystérieux frappent la communauté.", genres: "Drame,Crime,Histoire", year: 2023, rating: 7.6, tmdbId: 674324, runtime: 206, cats: ["drame", "thriller", "films"] },
    { title: "Poor Things", titleFr: "Poor Things", overview: "Bella Baxter est ramenée à la vie par un scientifique brillant et non conventionnel.", overviewFr: "Bella Baxter est ramenée à la vie par un scientifique brillant et non conventionnel.", genres: "Science-Fiction,Drame,Comédie", year: 2023, rating: 7.9, tmdbId: 748783, runtime: 141, cats: ["science-fiction", "drame", "comedie", "films"] },
    { title: "Deadpool & Wolverine", titleFr: "Deadpool & Wolverine", overview: "Deadpool et Wolverine s'associent pour sauver le multivers d'une menace commune.", overviewFr: "Deadpool et Wolverine s'associent pour sauver le multivers d'une menace commune.", genres: "Action,Comédie,Science-Fiction", year: 2024, rating: 7.6, tmdbId: 533535, runtime: 128, featured: true, featuredOrder: 5, cats: ["action", "comedie", "films"] },
    { title: "Gladiator II", titleFr: "Gladiator II", overview: "Lucius, le fils de Lucilla, est forcé d'entrer dans l'arène de Colosse pour combattre.", overviewFr: "Lucius, le fils de Lucilla, est forcé d'entrer dans l'arène de Colosse pour combattre.", genres: "Action,Aventure,Drame", year: 2024, rating: 7.1, tmdbId: 438631, runtime: 148, cats: ["action", "aventure", "drame", "films"] },
  ];

  // === SERIES ===
  const series = [
    { title: "Breaking Bad", titleFr: "Breaking Bad", overview: "Un professeur de chimie atteint d'un cancer se lance dans la fabrication de méthamphétamine.", overviewFr: "Un professeur de chimie atteint d'un cancer se lance dans la fabrication de méthamphétamine.", genres: "Drame,Crime,Thriller", year: 2008, rating: 9.5, tmdbId: 1396, seasons: 5, cats: ["drame", "thriller", "series"] },
    { title: "Stranger Things", titleFr: "Stranger Things", overview: "Quand un jeune garçon disparaît, une petite ville découvre un mystère impliquant des expériences et des forces surnaturelles.", overviewFr: "Quand un jeune garçon disparaît, une petite ville découvre un mystère impliquant des expériences et des forces surnaturelles.", genres: "Drame,Science-Fiction,Horreur", year: 2016, rating: 8.6, tmdbId: 66732, seasons: 4, cats: ["drame", "science-fiction", "horreur", "series"] },
    { title: "The Last of Us", titleFr: "The Last of Us", overview: "Joel et Ellie voyagent à travers une Amérique post-apocalyptique ravagée par une infection fongique.", overviewFr: "Joel et Ellie voyagent à travers une Amérique post-apocalyptique ravagée par une infection fongique.", genres: "Drame,Action,Science-Fiction", year: 2023, rating: 8.8, tmdbId: 100088, seasons: 2, featured: true, featuredOrder: 6, cats: ["drame", "action", "science-fiction", "series"] },
    { title: "The Witcher", titleFr: "The Witcher", overview: "Geralt de Riv, un chasseur de monstres mutant, lutte pour trouver sa place dans un monde où les humains se révèlent souvent plus méchants que les bêtes.", overviewFr: "Geralt de Riv, un chasseur de monstres mutant, lutte pour trouver sa place dans un monde où les humains se révèlent souvent plus méchants que les bêtes.", genres: "Action,Aventure,Fantastique", year: 2019, rating: 8.0, tmdbId: 71912, seasons: 3, cats: ["action", "aventure", "series"] },
    { title: "Peaky Blinders", titleFr: "Peaky Blinders", overview: "Une famille de gangsters basée à Birmingham, en Angleterre, en 1919, dirigée par le brillant Tommy Shelby.", overviewFr: "Une famille de gangsters basée à Birmingham, en Angleterre, en 1919, dirigée par le brillant Tommy Shelby.", genres: "Drame,Crime", year: 2013, rating: 8.8, tmdbId: 60574, seasons: 6, cats: ["drame", "thriller", "series"] },
    { title: "Dark", titleFr: "Dark", overview: "La disparition mystérieuse d'un enfant lance quatre familles dans une quête effrayante pour découvrir la vérité.", overviewFr: "La disparition mystérieuse d'un enfant lance quatre familles dans une quête effrayante pour découvrir la vérité.", genres: "Drame,Science-Fiction,Thriller", year: 2017, rating: 8.8, tmdbId: 70523, seasons: 3, cats: ["drame", "science-fiction", "thriller", "series"] },
    { title: "Squid Game", titleFr: "Squid Game", overview: "Des centaines de joueurs fauchés acceptent une mystérieuse invitation à participer à des jeux d'enfants.", overviewFr: "Des centaines de joueurs fauchés acceptent une mystérieuse invitation à participer à des jeux d'enfants.", genres: "Drame,Thriller,Action", year: 2021, rating: 8.0, tmdbId: 93405, seasons: 2, cats: ["drame", "thriller", "action", "series"] },
    { title: "Wednesday", titleFr: "Wednesday", overview: "Mercredi Addams enquête sur une série de meurtres dans sa nouvelle école.", overviewFr: "Mercredi Addams enquête sur une série de meurtres dans sa nouvelle école.", genres: "Comédie,Horreur,Mystère", year: 2022, rating: 8.1, tmdbId: 119051, seasons: 1, cats: ["comedie", "horreur", "series"] },
  ];

  // === ANIME ===
  const anime = [
    { title: "Attack on Titan", titleFr: "L'Attaque des Titans", overview: "L'humanité vit dans des villes entourées de murs géants pour se protéger des Titans.", overviewFr: "L'humanité vit dans des villes entourées de murs géants pour se protéger des Titans.", genres: "Action,Animation,Drame", year: 2013, rating: 9.0, tmdbId: 1429, seasons: 4, cats: ["action", "animation", "drame", "anime"] },
    { title: "Demon Slayer", titleFr: "Demon Slayer : Kimetsu no Yaiba", overview: "Tanjiro Kamado devient un chasseur de démons pour guérir sa soeur transformée en démon.", overviewFr: "Tanjiro Kamado devient un chasseur de démons pour guérir sa soeur transformée en démon.", genres: "Action,Animation,Fantastique", year: 2019, rating: 8.7, tmdbId: 85937, seasons: 4, cats: ["action", "animation", "anime"] },
    { title: "Jujutsu Kaisen", titleFr: "Jujutsu Kaisen", overview: "Yuji Itadori entre dans le monde des sorciers après avoir avalé un doigt maudit.", overviewFr: "Yuji Itadori entre dans le monde des sorciers après avoir avalé un doigt maudit.", genres: "Action,Animation,Fantastique", year: 2020, rating: 8.6, tmdbId: 97456, seasons: 2, cats: ["action", "animation", "anime"] },
    { title: "One Piece", titleFr: "One Piece", overview: "Monkey D. Luffy et son équipage de pirates partent à la recherche du légendaire trésor One Piece.", overviewFr: "Monkey D. Luffy et son équipage de pirates partent à la recherche du légendaire trésor One Piece.", genres: "Action,Animation,Aventure", year: 1999, rating: 8.7, tmdbId: 37854, seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
    { title: "Chainsaw Man", titleFr: "Chainsaw Man", overview: "Denji, un jeune chasseur de démons, fusionne avec son démon-chaîne de tronçonneuse.", overviewFr: "Denji, un jeune chasseur de démons, fusionne avec son démon-chaîne de tronçonneuse.", genres: "Action,Animation,Horreur", year: 2022, rating: 8.4, tmdbId: 100939, seasons: 1, cats: ["action", "animation", "horreur", "anime"] },
    { title: "Solo Leveling", titleFr: "Solo Leveling", overview: "Sung Jinwoo, le chasseur le plus faible, gagne le pouvoir de monter en niveau sans limite.", overviewFr: "Sung Jinwoo, le chasseur le plus faible, gagne le pouvoir de monter en niveau sans limite.", genres: "Action,Animation,Fantastique", year: 2024, rating: 8.3, tmdbId: 209916, seasons: 1, cats: ["action", "animation", "anime"] },
    { title: "Fullmetal Alchemist: Brotherhood", titleFr: "Fullmetal Alchemist: Brotherhood", overview: "Deux frères alchimistes cherchent la pierre philosophale pour restaurer leurs corps.", overviewFr: "Deux frères alchimistes cherchent la pierre philosophale pour restaurer leurs corps.", genres: "Action,Animation,Aventure", year: 2009, rating: 9.1, tmdbId: 31887, seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
    { title: "Naruto Shippuden", titleFr: "Naruto Shippuden", overview: "Naruto revient après deux ans d'entraînement pour sauver Sasuke et protéger le village.", overviewFr: "Naruto revient après deux ans d'entraînement pour sauver Sasuke et protéger le village.", genres: "Action,Animation,Aventure", year: 2007, rating: 8.6, tmdbId: 31910, seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
    { title: "My Hero Academia", titleFr: "My Hero Academia", overview: "Izuku Midoriya, né sans pouvoir, rêve de devenir le plus grand héros.", overviewFr: "Izuku Midoriya, né sans pouvoir, rêve de devenir le plus grand héros.", genres: "Action,Animation,Comédie", year: 2016, rating: 8.1, tmdbId: 65930, seasons: 7, cats: ["action", "animation", "comedie", "anime"] },
    { title: "Spy x Family", titleFr: "Spy x Family", overview: "Un espion doit former une fausse famille pour mener à bien une mission, sans savoir que sa fille lit les pensées et sa femme est une tueuse.", overviewFr: "Un espion doit former une fausse famille pour mener à bien une mission, sans savoir que sa fille lit les pensées et sa femme est une tueuse.", genres: "Animation,Comédie,Action", year: 2022, rating: 8.5, tmdbId: 120089, seasons: 2, cats: ["animation", "comedie", "action", "anime"] },
    { title: "Death Note", titleFr: "Death Note", overview: "Un étudiant découvre un carnet surnaturel qui peut tuer toute personne dont le nom est écrit dedans.", overviewFr: "Un étudiant découvre un carnet surnaturel qui peut tuer toute personne dont le nom est écrit dedans.", genres: "Animation,Thriller,Mystère", year: 2006, rating: 8.9, tmdbId: 13995, seasons: 1, cats: ["animation", "thriller", "anime"] },
    { title: "Vinland Saga", titleFr: "Vinland Saga", overview: "Thorfinn, fils d'un grand guerrier, cherche la vengeance contre le chef mercenaire qui a tué son père.", overviewFr: "Thorfinn, fils d'un grand guerrier, cherche la vengeance contre le chef mercenaire qui a tué son père.", genres: "Action,Animation,Drame", year: 2019, rating: 8.7, tmdbId: 84958, seasons: 2, cats: ["action", "animation", "drame", "anime"] },
  ];

  // === MANGA ===
  const manga = [
    { title: "One Piece", titleFr: "One Piece", overview: "Les aventures de Monkey D. Luffy et de son équipage dans leur quête du One Piece.", overviewFr: "Les aventures de Monkey D. Luffy et de son équipage dans leur quête du One Piece.", genres: "Action,Aventure,Comédie", year: 1997, rating: 9.2, cats: ["action", "aventure", "comedie", "manga"] },
    { title: "Naruto", titleFr: "Naruto", overview: "Le ninja Naruto Uzumaki rêve de devenir Hokage, le chef de son village.", overviewFr: "Le ninja Naruto Uzumaki rêve de devenir Hokage, le chef de son village.", genres: "Action,Aventure", year: 1999, rating: 8.8, cats: ["action", "aventure", "manga"] },
    { title: "Dragon Ball Super", titleFr: "Dragon Ball Super", overview: "Goku et ses amis affrontent de nouveaux ennemis venus d'autres univers.", overviewFr: "Goku et ses amis affrontent de nouveaux ennemis venus d'autres univers.", genres: "Action,Aventure,Comédie", year: 2015, rating: 7.8, cats: ["action", "aventure", "comedie", "manga"] },
    { title: "Bleach", titleFr: "Bleach", overview: "Ichigo Kurosaki devient un Shinigami et protège les âmes des humains contre les Hollows.", overviewFr: "Ichigo Kurosaki devient un Shinigami et protège les âmes des humains contre les Hollows.", genres: "Action,Fantastique,Aventure", year: 2001, rating: 8.5, cats: ["action", "aventure", "manga"] },
    { title: "Chainsaw Man", titleFr: "Chainsaw Man", overview: "Denji, un jeune chasseur de démons, fusionne avec Pochita, le démon-chaîne de tronçonneuse.", overviewFr: "Denji, un jeune chasseur de démons, fusionne avec Pochita, le démon-chaîne de tronçonneuse.", genres: "Action,Horreur,Comédie", year: 2018, rating: 8.6, cats: ["action", "horreur", "comedie", "manga"] },
    { title: "Solo Leveling", titleFr: "Solo Leveling", overview: "Dans un monde où les donjons et les monstres sont réalité, le chasseur E-rank Sung Jinwoo obtient un pouvoir unique.", overviewFr: "Dans un monde où les donjons et les monstres sont réalité, le chasseur E-rank Sung Jinwoo obtient un pouvoir unique.", genres: "Action,Fantastique,Aventure", year: 2018, rating: 8.7, cats: ["action", "aventure", "manga"] },
    { title: "Jujutsu Kaisen", titleFr: "Jujutsu Kaisen", overview: "Yuji Itadori entre dans le monde des sorciers après avoir avalé un doigt maudit de Sukuna.", overviewFr: "Yuji Itadori entre dans le monde des sorciers après avoir avalé un doigt maudit de Sukuna.", genres: "Action,Fantastique", year: 2018, rating: 8.5, cats: ["action", "manga"] },
    { title: "Demon Slayer", titleFr: "Demon Slayer : Kimetsu no Yaiba", overview: "Tanjiro Kamado devient chasseur de démons pour sauver sa soeur Nezuko.", overviewFr: "Tanjiro Kamado devient chasseur de démons pour sauver sa soeur Nezuko.", genres: "Action,Fantastique", year: 2016, rating: 8.4, cats: ["action", "manga"] },
    { title: "Spy x Family", titleFr: "Spy x Family", overview: "Un espion, une tueuse et une télépathe forment une famille pour une mission secrète.", overviewFr: "Un espion, une tueuse et une télépathe forment une famille pour une mission secrète.", genres: "Comédie,Action", year: 2019, rating: 8.3, cats: ["comedie", "action", "manga"] },
    { title: "Vinland Saga", titleFr: "Vinland Saga", overview: "L'histoire de Thorfinn, un guerrier viking en quête de vengeance puis de paix.", overviewFr: "L'histoire de Thorfinn, un guerrier viking en quête de vengeance puis de paix.", genres: "Action,Drame,Histoire", year: 2005, rating: 8.8, cats: ["action", "drame", "manga"] },
  ];

  // Helper to create content with embeds and categories
  async function createContentWithRelations(
    data: typeof movies[0] & { type: string; seasons?: number },
    index: number
  ) {
    const content = await db.content.create({
      data: {
        tmdbId: data.tmdbId || null,
        title: data.title,
        titleFr: data.titleFr,
        overview: data.overview,
        overviewFr: data.overviewFr || data.overview,
        posterPath: getPoster(index),
        backdropPath: getBackdrop(index),
        releaseDate: data.year ? `${data.year}-01-01` : null,
        rating: data.rating,
        voteCount: Math.floor(data.rating * 1200),
        type: data.type,
        year: data.year,
        genres: data.genres,
        runtime: data.runtime || null,
        seasons: data.seasons || null,
        featured: data.featured || false,
        featuredOrder: data.featuredOrder || null,
      },
    });

    // Create embeds
    if (data.type === "movie") {
      await db.embedSource.createMany({
        data: [
          { contentId: content.id, serverName: "Serveur 1", serverType: "embed", url: `https://example.com/embed/${content.id}-s1`, lang: "vostfr", quality: "1080p", isActive: true },
          { contentId: content.id, serverName: "Serveur 2", serverType: "embed", url: `https://example.com/embed/${content.id}-s2`, lang: "vostfr", quality: "720p", isActive: true },
          { contentId: content.id, serverName: "VF", serverType: "embed", url: `https://example.com/embed/${content.id}-vf`, lang: "vf", quality: "1080p", isActive: true },
        ],
      });
    } else if (data.type === "manga") {
      const chapterCount = 50 + Math.floor(Math.random() * 150);
      await db.embedSource.createMany({
        data: [
          { contentId: content.id, serverName: "Lecteur 1", serverType: "manga", url: `https://example.com/manga/${content.id}/ch1`, lang: "fr", isActive: true },
          { contentId: content.id, serverName: "Lecteur 2", serverType: "manga", url: `https://example.com/manga-alt/${content.id}/ch1`, lang: "fr", isActive: true },
        ],
      });
    } else {
      // Series/Anime - create episodes for multiple seasons
      const numSeasons = data.seasons || 1;
      const maxSeasons = Math.min(numSeasons, 2);
      for (let s = 1; s <= maxSeasons; s++) {
        const epCount = Math.min(s === 1 ? 5 : 3, 8);
        for (let ep = 1; ep <= epCount; ep++) {
          await db.embedSource.createMany({
            data: [
              { contentId: content.id, serverName: `VOSTFR`, serverType: "embed", url: `https://example.com/embed/${content.id}/s${s}e${ep}`, lang: "vostfr", quality: "1080p", isActive: true, season: s, episode: ep },
              { contentId: content.id, serverName: `VF`, serverType: "embed", url: `https://example.com/embed/${content.id}/s${s}e${ep}/vf`, lang: "vf", quality: "1080p", isActive: true, season: s, episode: ep },
            ],
          });
        }
      }
    }

    // Assign categories
    const catSlugs = data.cats || [];
    for (const slug of catSlugs) {
      const catId = catMap[slug];
      if (catId) {
        await db.contentCategory.create({
          data: { contentId: content.id, categoryId: catId },
        });
      }
    }

    return content;
  }

  // Create all content
  let idx = 0;
  for (const movie of movies) {
    await createContentWithRelations({ ...movie, type: "movie" }, idx++);
  }
  for (const s of series) {
    await createContentWithRelations({ ...s, type: "series" }, idx++);
  }
  for (const a of anime) {
    await createContentWithRelations({ ...a, type: "anime" }, idx++);
  }
  for (const m of manga) {
    await createContentWithRelations({ ...m, type: "manga" }, idx++);
  }

  const contentCount = await db.content.count();
  const embedCount = await db.embedSource.count();

  console.log(`✅ Seeded ${contentCount} contents, ${embedCount} embeds, ${categories.length} categories`);
}

seed()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
    process.exit(0);
  });