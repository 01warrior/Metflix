import { db } from "../src/lib/db";

// Embed providers - FREE, no API key needed
// These services auto-generate streams from TMDB IDs
function getMovieEmbeds(tmdbId: number) {
  return [
    { serverName: "VidSrc", hostProvider: "vidsrc", url: `https://vidsrc.xyz/embed/movie/${tmdbId}`, lang: "vostfr", quality: "1080p" },
    { serverName: "VidSrc Pro", hostProvider: "vidsrc_pro", url: `https://vidsrc.pro/embed/movie/${tmdbId}`, lang: "vostfr", quality: "1080p" },
    { serverName: "Embed.su", hostProvider: "embed_su", url: `https://embed.su/embed/movie/${tmdbId}`, lang: "vostfr", quality: "1080p" },
    { serverName: "AutoEmbed", hostProvider: "autoembed", url: `https://player.autoembed.cc/embed/movie/${tmdbId}`, lang: "vostfr", quality: "720p" },
    { serverName: "2Embed", hostProvider: "twoembed", url: `https://www.2embed.cc/embed/${tmdbId}`, lang: "vostfr", quality: "1080p" },
  ];
}

function getSeriesEmbeds(tmdbId: number, season: number, episode: number) {
  return [
    { serverName: "VidSrc", hostProvider: "vidsrc", url: `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`, lang: "vostfr", quality: "1080p", season, episode },
    { serverName: "VidSrc Pro", hostProvider: "vidsrc_pro", url: `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`, lang: "vostfr", quality: "1080p", season, episode },
    { serverName: "Embed.su", hostProvider: "embed_su", url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`, lang: "vostfr", quality: "1080p", season, episode },
    { serverName: "AutoEmbed", hostProvider: "autoembed", url: `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`, lang: "vostfr", quality: "720p", season, episode },
    { serverName: "2Embed", hostProvider: "twoembed", url: `https://www.2embed.cc/embed/${tmdbId}/${season}/${episode}`, lang: "vostfr", quality: "1080p", season, episode },
  ];
}

interface CDef {
  tmdbId: number; title: string; titleFr: string; overview: string;
  posterPath: string; backdropPath?: string; genres: string;
  year: number; rating: number; type: string; runtime?: number; seasons?: number;
  featured?: boolean; featuredOrder?: number; cats: string[];
}

const MOVIES: CDef[] = [
  { tmdbId: 693134, title: "Dune: Part Two", titleFr: "Dune : Deuxième Partie", overview: "Paul Atréides s'unit aux Fremen pour venger sa famille tout en essayant d'empêcher un avenir terrible qu'il seul peut prévoir.", posterPath: "/8b8R8l88Qje9dn9OE8PY05Nez7S.jpg", backdropPath: "/xJHokMbljvjADYdit5fK1DVfjko.jpg", genres: "Science-Fiction,Aventure,Drame", year: 2024, rating: 8.2, type: "movie", runtime: 166, featured: true, featuredOrder: 1, cats: ["science-fiction", "aventure", "films"] },
  { tmdbId: 872585, title: "Oppenheimer", titleFr: "Oppenheimer", overview: "L'histoire du physicien J. Robert Oppenheimer et son rôle dans le développement de la bombe atomique.", posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", backdropPath: "/nMdJIqLGuPJvbsHWJ9DUjKMTqzP.jpg", genres: "Drame,Histoire,Thriller", year: 2023, rating: 8.4, type: "movie", runtime: 180, featured: true, featuredOrder: 2, cats: ["drame", "thriller", "films"] },
  { tmdbId: 603692, title: "John Wick: Chapter 4", titleFr: "John Wick : Chapitre 4", overview: "John Wick découvre un moyen de vaincre la Haute Table avant de faire face à un nouvel ennemi.", posterPath: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg", backdropPath: "/ouoGcKDhBxuOv2V1OvOEhgqvKHB.jpg", genres: "Action,Thriller", year: 2023, rating: 7.8, type: "movie", runtime: 169, featured: true, featuredOrder: 3, cats: ["action", "thriller", "films"] },
  { tmdbId: 346698, title: "Barbie", titleFr: "Barbie", overview: "Barbie et Ken font l'expérience du monde réel après avoir quitté Barbieland.", posterPath: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg", backdropPath: "/nHf61UzkfFno5dHMQ7u0NyrBPEw.jpg", genres: "Comédie,Aventure,Fantastique", year: 2023, rating: 7.0, type: "movie", runtime: 114, cats: ["comedie", "aventure", "films"] },
  { tmdbId: 569094, title: "Spider-Man: Across the Spider-Verse", titleFr: "Spider-Man : Across the Spider-Verse", overview: "Miles Morales se lance dans une aventure à travers le multivers avec Gwen Stacy.", posterPath: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdropPath: "/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", genres: "Animation,Action,Aventure", year: 2023, rating: 8.7, type: "movie", runtime: 140, featured: true, featuredOrder: 4, cats: ["animation", "action", "aventure", "films"] },
  { tmdbId: 414906, title: "The Batman", titleFr: "The Batman", overview: "Quand un tueur se lance dans une série de meurtres à Gotham, Batman doit enquêter.", posterPath: "/74xTEgt7R36Fpooo50r9T25onhq.jpg", backdropPath: "/b0PlSFdDwbyFAJlMe1mDBIOQ2Ae.jpg", genres: "Action,Crime,Drame", year: 2022, rating: 7.7, type: "movie", runtime: 176, cats: ["action", "drame", "thriller", "films"] },
  { tmdbId: 157336, title: "Interstellar", titleFr: "Interstellar", overview: "Un groupe d'explorateurs utilise un trou de ver pour parcourir l'espace et sauver l'humanité.", posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", backdropPath: "/xJHokMbljvjADYdit5fK1DVfjko.jpg", genres: "Science-Fiction,Drame,Aventure", year: 2014, rating: 8.6, type: "movie", runtime: 169, cats: ["science-fiction", "drame", "aventure", "films"] },
  { tmdbId: 27205, title: "Inception", titleFr: "Inception", overview: "Un voleur qui dérobe des secrets en s'infiltrant dans les rêves se voit offrir une chance de rédemption.", posterPath: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", backdropPath: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg", genres: "Science-Fiction,Action,Thriller", year: 2010, rating: 8.8, type: "movie", runtime: 148, cats: ["science-fiction", "action", "thriller", "films"] },
  { tmdbId: 496243, title: "Parasite", titleFr: "Parasite", overview: "La famille Kim, sans le sou, s'infiltre dans la vie des riches Parks.", posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdropPath: "/TU9NIjwzjoKPwQHoHshkFcQUCG8.jpg", genres: "Drame,Thriller,Comédie", year: 2019, rating: 8.5, type: "movie", runtime: 132, cats: ["drame", "thriller", "comedie", "films"] },
  { tmdbId: 545611, title: "Everything Everywhere All at Once", titleFr: "Tout partout à la fois", overview: "Une femme chinoise-américaine doit sauver le multivers en explorant d'autres vies.", posterPath: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg", backdropPath: "/fOy2Jurz9k6RnJnMUMRDAgBZg2N.jpg", genres: "Action,Comédie,Science-Fiction", year: 2022, rating: 7.8, type: "movie", runtime: 139, cats: ["action", "comedie", "science-fiction", "films"] },
  { tmdbId: 533535, title: "Deadpool & Wolverine", titleFr: "Deadpool & Wolverine", overview: "Deadpool et Wolverine s'associent pour sauver le multivers d'une menace commune.", posterPath: "/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg", backdropPath: "/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg", genres: "Action,Comédie,Science-Fiction", year: 2024, rating: 7.6, type: "movie", runtime: 128, featured: true, featuredOrder: 5, cats: ["action", "comedie", "films"] },
  { tmdbId: 438631, title: "Gladiator II", titleFr: "Gladiator II", overview: "Lucius est forcé d'entrer dans l'arène du Colisée pour combattre pour sa survie.", posterPath: "/2cxhvwyEwRlysAmRH4o0z5.jpg", backdropPath: "/r9oTasGQofvkQY5vlUXglneF64Z.jpg", genres: "Action,Aventure,Drame", year: 2024, rating: 7.1, type: "movie", runtime: 148, cats: ["action", "aventure", "drame", "films"] },
  { tmdbId: 674324, title: "Killers of the Flower Moon", titleFr: "Killers of the Flower Moon", overview: "Quand l'huile est découverte sur les terres Osage, des meurtres mystérieux frappent la communauté.", posterPath: "/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg", backdropPath: "/1X7vow16X7CnCoexXh4H4F2yDJv.jpg", genres: "Drame,Crime,Histoire", year: 2023, rating: 7.6, type: "movie", runtime: 206, cats: ["drame", "thriller", "films"] },
  { tmdbId: 748783, title: "Poor Things", titleFr: "Poor Things", overview: "Bella Baxter est ramenée à la vie par un scientifique brillant et part à l'aventure.", posterPath: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg", backdropPath: "/aINqMbPJoEHBfzPQ6OaOwIpO3Y3.jpg", genres: "Science-Fiction,Drame,Comédie", year: 2023, rating: 7.9, type: "movie", runtime: 141, cats: ["science-fiction", "drame", "comedie", "films"] },
  { tmdbId: 299534, title: "Avengers: Endgame", titleFr: "Avengers : Fin du jeu", overview: "Les Avengers restants se regroupent pour inverser les actions de Thanos.", posterPath: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", backdropPath: "/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg", genres: "Action,Aventure,Science-Fiction", year: 2019, rating: 8.3, type: "movie", runtime: 181, cats: ["action", "aventure", "science-fiction", "films"] },
  { tmdbId: 299536, title: "Avengers: Infinity War", titleFr: "Avengers : Infinity War", overview: "Les Avengers se préparent à affronter Thanos qui cherche les Pierres d'Infinité.", posterPath: "/7WsyChQLEftFiDhRkZUHahFXChJ.jpg", backdropPath: "/4M9MZyJlpPQ9cOvjzXZtAOCGp0D.jpg", genres: "Action,Aventure,Science-Fiction", year: 2018, rating: 8.3, type: "movie", runtime: 149, cats: ["action", "aventure", "science-fiction", "films"] },
  { tmdbId: 634649, title: "Spider-Man: No Way Home", titleFr: "Spider-Man : No Way Home", overview: "Peter Parker demande l'aide de Doctor Strange quand son identité est révélée.", posterPath: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", backdropPath: "/iUytgtKGehEWnSmKD5J8NHcKykG.jpg", genres: "Action,Aventure,Fantastique", year: 2021, rating: 8.0, type: "movie", runtime: 148, cats: ["action", "aventure", "films"] },
  { tmdbId: 475557, title: "Joker", titleFr: "Joker", overview: "Arthur Fleck, un comédien raté, sombre dans la folie et devient le Joker.", posterPath: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", backdropPath: "/nMKdUUepR0i5zn0y1T4CsSB5ez.jpg", genres: "Drame,Crime,Thriller", year: 2019, rating: 8.2, type: "movie", runtime: 122, cats: ["drame", "thriller", "films"] },
  { tmdbId: 155, title: "The Dark Knight", titleFr: "The Dark Knight : Le Chevalier Noir", overview: "Batman affronte le Joker qui plonge Gotham City dans le chaos.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Crime,Drame", year: 2008, rating: 9.0, type: "movie", runtime: 152, cats: ["action", "thriller", "drame", "films"] },
  { tmdbId: 680, title: "Pulp Fiction", titleFr: "Pulp Fiction", overview: "Les vies de deux tueurs à gages, un boxeur et des voleurs s'entremêlent.", posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", genres: "Crime,Drame,Thriller", year: 1994, rating: 8.5, type: "movie", runtime: 154, cats: ["drame", "thriller", "films"] },
  { tmdbId: 550, title: "Fight Club", titleFr: "Fight Club", overview: "Un employé de bureau et un fabricant de savon forment un club de combat clandestin.", posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", genres: "Drame,Thriller", year: 1999, rating: 8.4, type: "movie", runtime: 139, cats: ["drame", "thriller", "films"] },
  { tmdbId: 603, title: "The Matrix", titleFr: "Matrix", overview: "Un programmeur découvre que la réalité est une simulation créée par des machines.", posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", genres: "Science-Fiction,Action", year: 1999, rating: 8.2, type: "movie", runtime: 136, cats: ["science-fiction", "action", "films"] },
  { tmdbId: 278, title: "The Shawshank Redemption", titleFr: "Les Évadés", overview: "Deux prisonniers se lient d'amitié au fil des années, trouvant réconfort et rédemption.", posterPath: "/9cjIGRjChCU7uSXkNbuZfbWMC0S.jpg", genres: "Drame", year: 1994, rating: 9.3, type: "movie", runtime: 142, cats: ["drame", "films"] },
  { tmdbId: 238, title: "The Godfather", titleFr: "Le Parrain", overview: "Le patriarche de la famille Corleone transmet le contrôle à son fils Michael.", posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", genres: "Crime,Drame", year: 1972, rating: 9.2, type: "movie", runtime: 175, cats: ["drame", "thriller", "films"] },
  { tmdbId: 597, title: "Titanic", titleFr: "Titanic", overview: "Un artiste pauvre et une jeune femme riche tombent amoureux sur le Titanic.", posterPath: "/9xjZS2rlVXM8fGos3HfVNHcjWWt.jpg", genres: "Drame,Romance", year: 1997, rating: 8.3, type: "movie", runtime: 194, cats: ["drame", "romance", "films"] },
  { tmdbId: 13, title: "Forrest Gump", titleFr: "Forrest Gump", overview: "L'histoire d'un homme à faible QI qui participe aux grands événements du 20ème siècle.", posterPath: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", genres: "Drame,Comédie", year: 1994, rating: 8.8, type: "movie", runtime: 142, cats: ["drame", "comedie", "films"] },
  { tmdbId: 76600, title: "Avatar: The Way of Water", titleFr: "Avatar : La Voie de l'Eau", overview: "Jake Sully et sa famille explorent les régions de Pandora.", posterPath: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", genres: "Science-Fiction,Aventure", year: 2022, rating: 7.6, type: "movie", runtime: 192, cats: ["science-fiction", "aventure", "films"] },
  { tmdbId: 361743, title: "Top Gun: Maverick", titleFr: "Top Gun : Maverick", overview: "Pete Mitchell est de retour pour entraîner une nouvelle génération de pilotes.", posterPath: "/jMLiTgCo0vX3uwCz3JGajf2BD4a.jpg", genres: "Action,Drame", year: 2022, rating: 8.2, type: "movie", runtime: 131, featured: true, featuredOrder: 6, cats: ["action", "drame", "films"] },
  { tmdbId: 502356, title: "The Super Mario Bros. Movie", titleFr: "Super Mario Bros. : Le Film", overview: "Mario voyage à travers le Royaume Champignon pour sauver son frère Luigi.", posterPath: "/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg", genres: "Animation,Aventure,Comédie", year: 2023, rating: 7.1, type: "movie", runtime: 92, cats: ["animation", "aventure", "comedie", "films"] },
  { tmdbId: 447365, title: "Guardians of the Galaxy Vol. 3", titleFr: "Les Gardiens de la Galaxie Vol. 3", overview: "Les Gardiens doivent protéger l'un d'entre eux alors que Quill fait face à son passé.", posterPath: "/r2J02Z2OpNTctfOSN1YDGii51I3.jpg", genres: "Action,Aventure,Comédie", year: 2023, rating: 7.9, type: "movie", runtime: 150, cats: ["action", "aventure", "comedie", "films"] },
  { tmdbId: 640, title: "Furiosa: A Mad Max Saga", titleFr: "Furiosa : Une saga Mad Max", overview: "L'histoire de Furiosa, enlevée enfant du Green Place, et sa quête de son foyer.", posterPath: "/iADOJ8Zymht2JPMoy3R7xceZprc.jpg", genres: "Action,Aventure,Science-Fiction", year: 2024, rating: 7.6, type: "movie", runtime: 148, cats: ["action", "aventure", "science-fiction", "films"] },
  { tmdbId: 447332, title: "Alien: Romulus", titleFr: "Alien : Romulus", overview: "Un groupe de jeunes explore une station spatiale abandonnée et rencontre une créature terrifiante.", posterPath: "/b33nnKl1GSFbao4l3fZDDqsMSF6.jpg", genres: "Horreur,Science-Fiction,Thriller", year: 2024, rating: 7.2, type: "movie", runtime: 119, cats: ["horreur", "science-fiction", "thriller", "films"] },
  { tmdbId: 940721, title: "Inside Out 2", titleFr: "Vice-Versa 2", overview: "Riley entre dans l'adolescence et de nouvelles émotions font leur apparition.", posterPath: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", genres: "Animation,Famille,Comédie", year: 2024, rating: 7.6, type: "movie", runtime: 96, cats: ["animation", "comedie", "films"] },
  { tmdbId: 696504, title: "The Wild Robot", titleFr: "Le Robot sauvage", overview: "Un robot échoué sur une île inhabée doit apprendre à s'adapter.", posterPath: "/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg", genres: "Animation,Aventure,Famille", year: 2024, rating: 8.1, type: "movie", runtime: 102, cats: ["animation", "aventure", "films"] },
  { tmdbId: 354912, title: "Coco", titleFr: "Coco", overview: "Miguel voyage dans le Pays des Morts pour découvrir ses racines familiales.", posterPath: "/gBmrsTq0kZwfbfx2SjMOJ2TrJvg.jpg", genres: "Animation,Famille,Musique", year: 2017, rating: 8.4, type: "movie", runtime: 105, cats: ["animation", "films"] },
  { tmdbId: 150540, title: "Inside Out", titleFr: "Vice-Versa", overview: "Les émotions d'une jeune fille la guident dans sa vie quotidienne.", posterPath: "/nHf61UzkfFno5dHMQ7u0NyrBPEw.jpg", genres: "Animation,Famille,Comédie", year: 2015, rating: 8.2, type: "movie", runtime: 95, cats: ["animation", "comedie", "films"] },
  { tmdbId: 14160, title: "Up", titleFr: "Là-haut", overview: "Un veuf âgé et un jeune scout partent pour l'Amérique du Sud dans une maison hissée par des ballons.", posterPath: "/7LqWmHcoPNpMGJlH3MBnSMiVPIR.jpg", genres: "Animation,Aventure,Comédie", year: 2009, rating: 8.3, type: "movie", runtime: 96, cats: ["animation", "aventure", "comedie", "films"] },
  { tmdbId: 10191, title: "How to Train Your Dragon", titleFr: "Dragons", overview: "Un jeune Viking fait amitié avec le dragon le plus redouté de tous.", posterPath: "/zXjkif5xVNBXSeRVWmOvqVHHAbl.jpg", genres: "Animation,Aventure,Famille", year: 2010, rating: 8.0, type: "movie", runtime: 98, cats: ["animation", "aventure", "films"] },
  { tmdbId: 9470, title: "Kung Fu Panda", titleFr: "Kung Fu Panda", overview: "Po, un panda paresseux, est choisi pour devenir le Guerrier Dragon.", posterPath: "/kYuZgp51nKwTkFNRsJStJBjwsJD.jpg", genres: "Animation,Action,Comédie", year: 2008, rating: 7.5, type: "movie", runtime: 92, cats: ["animation", "action", "comedie", "films"] },
  { tmdbId: 12, title: "Finding Nemo", titleFr: "Le Monde de Nemo", overview: "Un poisson-clown traverse l'océan pour retrouver son fils Nemo.", posterPath: "/7LqWmHcoPNpMGJlH3MBnSMiVPIR.jpg", genres: "Animation,Aventure,Famille", year: 2003, rating: 8.0, type: "movie", runtime: 100, cats: ["animation", "aventure", "films"] },
  { tmdbId: 1011985, title: "Wicked", titleFr: "Wicked", overview: "L'histoire de la sorcière verte de l'Oz, bien avant Dorothy.", posterPath: "/oHjVf3eS7Ygi5vLg3U9CcvhHUKp.jpg", genres: "Fantastique,Musique,Drame", year: 2024, rating: 7.2, type: "movie", runtime: 160, cats: ["drame", "films"] },
];

const SERIES: CDef[] = [
  { tmdbId: 1396, title: "Breaking Bad", titleFr: "Breaking Bad", overview: "Un professeur de chimie se lance dans la fabrication de méthamphétamine.", posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg", backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg", genres: "Drame,Crime,Thriller", year: 2008, rating: 9.5, type: "series", seasons: 5, featured: true, featuredOrder: 7, cats: ["drame", "thriller", "series"] },
  { tmdbId: 66732, title: "Stranger Things", titleFr: "Stranger Things", overview: "Quand un jeune garçon disparaît, une petite ville découvre un mystère surnaturel.", posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg", backdropPath: "/sNQDepN9dEZsTnQkP3VNy6OoF1X.jpg", genres: "Drame,Science-Fiction,Horreur", year: 2016, rating: 8.6, type: "series", seasons: 4, cats: ["drame", "science-fiction", "horreur", "series"] },
  { tmdbId: 100088, title: "The Last of Us", titleFr: "The Last of Us", overview: "Joel et Ellie voyagent à travers une Amérique post-apocalyptique.", posterPath: "/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg", backdropPath: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg", genres: "Drame,Action,Science-Fiction", year: 2023, rating: 8.8, type: "series", seasons: 2, featured: true, featuredOrder: 8, cats: ["drame", "action", "science-fiction", "series"] },
  { tmdbId: 71912, title: "The Witcher", titleFr: "The Witcher", overview: "Geralt de Riv, chasseur de monstres, lutte pour trouver sa place dans le monde.", posterPath: "/7WsyChQLEftFiDhRkZUHahFXChJ.jpg", genres: "Action,Aventure,Fantastique", year: 2019, rating: 8.0, type: "series", seasons: 3, cats: ["action", "aventure", "series"] },
  { tmdbId: 60574, title: "Peaky Blinders", titleFr: "Peaky Blinders", overview: "Une famille de gangsters dirigée par Tommy Shelby à Birmingham.", posterPath: "/bC6P1Ev2KHqFmqIDb7Lqg8C2eiT.jpg", genres: "Drame,Crime", year: 2013, rating: 8.8, type: "series", seasons: 6, cats: ["drame", "thriller", "series"] },
  { tmdbId: 70523, title: "Dark", titleFr: "Dark", overview: "La disparition d'un enfant lance quatre familles dans une quête effrayante.", posterPath: "/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg", genres: "Drame,Science-Fiction,Thriller", year: 2017, rating: 8.8, type: "series", seasons: 3, cats: ["drame", "science-fiction", "thriller", "series"] },
  { tmdbId: 93405, title: "Squid Game", titleFr: "Squid Game", overview: "Des joueurs fauchés participent à des jeux d'enfants mortels pour un prix colossal.", posterPath: "/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg", genres: "Drame,Thriller,Action", year: 2021, rating: 8.0, type: "series", seasons: 2, cats: ["drame", "thriller", "action", "series"] },
  { tmdbId: 119051, title: "Wednesday", titleFr: "Wednesday", overview: "Mercredi Addams enquête sur une série de meurtres dans son école.", posterPath: "/9PFonBhy4cQy7Jz20NpMygczOkv.jpg", genres: "Comédie,Horreur,Mystère", year: 2022, rating: 8.1, type: "series", seasons: 1, cats: ["comedie", "horreur", "series"] },
  { tmdbId: 1399, title: "Game of Thrones", titleFr: "Game of Thrones", overview: "Plusieurs familles nobles luttent pour le contrôle du Trône de Fer.", posterPath: "/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg", genres: "Drame,Aventure,Fantastique", year: 2011, rating: 8.5, type: "series", seasons: 8, cats: ["drame", "aventure", "series"] },
  { tmdbId: 82856, title: "The Mandalorian", titleFr: "The Mandalorian", overview: "Un chasseur de primes protège un enfant mystérieux dans les confins de la galaxie.", posterPath: "/sWgBv7LV2PRoQgkxwBdPCT2j4ff.jpg", genres: "Action,Aventure,Science-Fiction", year: 2019, rating: 8.3, type: "series", seasons: 3, cats: ["action", "aventure", "science-fiction", "series"] },
  { tmdbId: 94997, title: "House of the Dragon", titleFr: "La Maison du Dragon", overview: "La guerre civile des Targaryen frappe Westeros.", posterPath: "/z2sJd9cBdAXXaNmKzPDUBkUwOTg.jpg", genres: "Drame,Aventure,Fantastique", year: 2022, rating: 8.4, type: "series", seasons: 2, cats: ["drame", "aventure", "series"] },
  { tmdbId: 76479, title: "The Boys", titleFr: "The Boys", overview: "Des vigilants luttent contre des super-héros corrompus.", posterPath: "/mY7SeJhHfozNybNFr5ZVq2GJhgd.jpg", genres: "Action,Comédie,Science-Fiction", year: 2019, rating: 8.5, type: "series", seasons: 4, cats: ["action", "comedie", "science-fiction", "series"] },
  { tmdbId: 84958, title: "Loki", titleFr: "Loki", overview: "Loki est sorti de son temps et doit réparer la timeline.", posterPath: "/ykIqF4E6uHMOYV3TCkAUHfBRK2Y.jpg", genres: "Science-Fiction,Action", year: 2021, rating: 8.2, type: "series", seasons: 2, cats: ["science-fiction", "action", "series"] },
  { tmdbId: 67744, title: "Better Call Saul", titleFr: "Better Call Saul", overview: "Jimmy McGill se transforme en l'avocat Saul Goodman.", posterPath: "/4kaAeVAgYVVvXEk5X8uDI1yG2fq.jpg", genres: "Drame,Crime", year: 2015, rating: 8.8, type: "series", seasons: 6, cats: ["drame", "thriller", "series"] },
  { tmdbId: 71446, title: "Money Heist", titleFr: "La Casa de Papel", overview: "Un groupe de voleurs exécute des braquages sous la direction du Professeur.", posterPath: "/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg", genres: "Drame,Crime,Thriller", year: 2017, rating: 8.2, type: "series", seasons: 5, cats: ["drame", "thriller", "series"] },
  { tmdbId: 19885, title: "Sherlock", titleFr: "Sherlock", overview: "Version moderne des aventures de Sherlock Holmes et Dr. Watson.", posterPath: "/5YLd2w0knWKjO1lW4RBH3x1f5OX.jpg", genres: "Drame,Mystère,Crime", year: 2010, rating: 8.7, type: "series", seasons: 4, cats: ["drame", "thriller", "series"] },
  { tmdbId: 63315, title: "Narcos", titleFr: "Narcos", overview: "Le trafic de drogue en Colombie et la lutte contre les cartels.", posterPath: "/mMotT6lxWMTHF4tKl1sPr0WVKRT.jpg", genres: "Drame,Crime", year: 2015, rating: 8.8, type: "series", seasons: 3, cats: ["drame", "thriller", "series"] },
  { tmdbId: 14164, title: "True Detective", titleFr: "True Detective", overview: "Des détectives révèlent des secrets sombres lors de leurs enquêtes.", posterPath: "/lJloTOheuQSirSLXjahGEQs5k3I.jpg", genres: "Drame,Crime,Mystère", year: 2014, rating: 8.6, type: "series", seasons: 4, cats: ["drame", "thriller", "series"] },
  { tmdbId: 2316, title: "The Office", titleFr: "The Office", overview: "Les employés d'une entreprise de papier vivent des situations comiques sous la direction de Michael Scott.", posterPath: "/qWnJzyeZPOJacc7CqQt6hl3g2I3.jpg", genres: "Comédie", year: 2005, rating: 8.9, type: "series", seasons: 9, cats: ["comedie", "series"] },
];

const ANIME: CDef[] = [
  { tmdbId: 1429, title: "Attack on Titan", titleFr: "L'Attaque des Titans", overview: "L'humanité vit derrière des murs géants pour se protéger des Titans. Eren jure de les exterminer tous.", posterPath: "/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", genres: "Action,Animation,Drame", year: 2013, rating: 9.0, type: "anime", seasons: 4, cats: ["action", "animation", "drame", "anime"] },
  { tmdbId: 85937, title: "Demon Slayer", titleFr: "Demon Slayer : Kimetsu no Yaiba", overview: "Tanjiro Kamado devient chasseur de démons pour guérir sa soeur Nezuko.", posterPath: "/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg", genres: "Action,Animation,Fantastique", year: 2019, rating: 8.7, type: "anime", seasons: 4, cats: ["action", "animation", "anime"] },
  { tmdbId: 97456, title: "Jujutsu Kaisen", titleFr: "Jujutsu Kaisen", overview: "Yuji Itadori entre dans le monde des sorciers après avoir avalé un doigt maudit.", posterPath: "/fEP18fzY77mVDBGVbRCxVNmMnnc.jpg", genres: "Action,Animation,Fantastique", year: 2020, rating: 8.6, type: "anime", seasons: 2, cats: ["action", "animation", "anime"] },
  { tmdbId: 37854, title: "One Piece", titleFr: "One Piece", overview: "Monkey D. Luffy part à la recherche du légendaire trésor One Piece.", posterPath: "/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg", genres: "Action,Animation,Aventure", year: 1999, rating: 8.7, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 100939, title: "Chainsaw Man", titleFr: "Chainsaw Man", overview: "Denji fusionne avec son démon-chaîne de tronçonneuse.", posterPath: "/pMXdS8hhIDq5c8Jbq9GBjK8UvA7.jpg", genres: "Action,Animation,Horreur", year: 2022, rating: 8.4, type: "anime", seasons: 2, cats: ["action", "animation", "horreur", "anime"] },
  { tmdbId: 209916, title: "Solo Leveling", titleFr: "Solo Leveling", overview: "Sung Jinwoo gagne le pouvoir de monter en niveau sans limite.", posterPath: "/dXzv0DR8x3rFDWJfFozfuY5gFRg.jpg", genres: "Action,Animation,Fantastique", year: 2024, rating: 8.3, type: "anime", seasons: 2, cats: ["action", "animation", "anime"] },
  { tmdbId: 31887, title: "Fullmetal Alchemist: Brotherhood", titleFr: "Fullmetal Alchemist: Brotherhood", overview: "Deux frères cherchent la pierre philosophale pour restaurer leurs corps.", posterPath: "/RiE6u6p276kHpWJFHRmrYVwt6nF.jpg", genres: "Action,Animation,Aventure", year: 2009, rating: 9.1, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 31910, title: "Naruto Shippuden", titleFr: "Naruto Shippuden", overview: "Naruto revient pour sauver Sasuke et protéger le village.", posterPath: "/zAYRe2bJxpWTVrwwmBc00VFkAf4.jpg", genres: "Action,Animation,Aventure", year: 2007, rating: 8.6, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 65930, title: "My Hero Academia", titleFr: "My Hero Academia", overview: "Izuku Midoriya, né sans pouvoir, rêve de devenir le plus grand héros.", posterPath: "/ivOLM47yPw7hb8cTEfYwIyqGM5Y.jpg", genres: "Action,Animation,Comédie", year: 2016, rating: 8.1, type: "anime", seasons: 7, cats: ["action", "animation", "comedie", "anime"] },
  { tmdbId: 120089, title: "Spy x Family", titleFr: "Spy x Family", overview: "Un espion, une tueuse et une télépathe forment une fausse famille.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Animation,Comédie,Action", year: 2022, rating: 8.5, type: "anime", seasons: 2, cats: ["animation", "comedie", "action", "anime"] },
  { tmdbId: 13995, title: "Death Note", titleFr: "Death Note", overview: "Un étudiant découvre un carnet qui tue toute personne dont le nom est écrit.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Animation,Thriller,Mystère", year: 2006, rating: 8.9, type: "anime", seasons: 1, cats: ["animation", "thriller", "anime"] },
  { tmdbId: 90818, title: "Vinland Saga", titleFr: "Vinland Saga", overview: "Thorfinn cherche la vengeance contre l'homme qui a tué son père.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Animation,Drame", year: 2019, rating: 8.7, type: "anime", seasons: 3, cats: ["action", "animation", "drame", "anime"] },
  { tmdbId: 46260, title: "Dragon Ball Super", titleFr: "Dragon Ball Super", overview: "Goku et ses amis affrontent des ennemis d'autres univers.", posterPath: "/tWqFOjY1LYD4Txn7Xw48lrHk1NL.jpg", genres: "Action,Animation,Aventure", year: 2015, rating: 7.5, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 31911, title: "Naruto", titleFr: "Naruto", overview: "Naruto Uzumaki rêve de devenir Hokage.", posterPath: "/zAYRe2bJxpWTVrwwmBc00VFkAf4.jpg", genres: "Action,Animation,Aventure", year: 2002, rating: 8.4, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 37954, title: "Bleach: Thousand-Year Blood War", titleFr: "Bleach : La Guerre Sanglante de Mille Ans", overview: "Ichigo et les Shinigami affrontent l'invasion des Quincy.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Animation,Fantastique", year: 2022, rating: 8.7, type: "anime", seasons: 1, cats: ["action", "animation", "anime"] },
  { tmdbId: 12971, title: "Hunter x Hunter", titleFr: "Hunter x Hunter", overview: "Gon part à la recherche de son père et découvre le monde des chasseurs.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Animation,Aventure", year: 2011, rating: 9.1, type: "anime", seasons: 1, cats: ["action", "animation", "aventure", "anime"] },
  { tmdbId: 46064, title: "Tokyo Ghoul", titleFr: "Tokyo Ghoul", overview: "Ken Kaneki est transformé en demi-ghoul après une rencontre fatale.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Animation,Horreur", year: 2014, rating: 8.1, type: "anime", seasons: 2, cats: ["action", "animation", "horreur", "anime"] },
  { tmdbId: 62104, title: "One Punch Man", titleFr: "One Punch Man", overview: "Saitama peut vaincre n'importe qui d'un seul coup de poing.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Animation,Comédie", year: 2015, rating: 8.5, type: "anime", seasons: 2, cats: ["action", "animation", "comedie", "anime"] },
];

const MANGA: CDef[] = [
  { tmdbId: 1, title: "One Piece", titleFr: "One Piece", overview: "Les aventures de l'équipage au chapeau de paille dans leur quête du One Piece.", posterPath: "/cMD9Ygz11zjJzAovURpO75Qg7rT.jpg", genres: "Action,Aventure,Comédie", year: 1997, rating: 9.2, type: "manga", cats: ["action", "aventure", "comedie", "manga"] },
  { tmdbId: 2, title: "Naruto", titleFr: "Naruto", overview: "Le ninja Naruto Uzumaki rêve de devenir Hokage.", posterPath: "/zAYRe2bJxpWTVrwwmBc00VFkAf4.jpg", genres: "Action,Aventure", year: 1999, rating: 8.8, type: "manga", cats: ["action", "aventure", "manga"] },
  { tmdbId: 3, title: "Dragon Ball Super", titleFr: "Dragon Ball Super", overview: "Goku et ses amis affrontent de nouveaux ennemis venus d'autres univers.", posterPath: "/tWqFOjY1LYD4Txn7Xw48lrHk1NL.jpg", genres: "Action,Aventure,Comédie", year: 2015, rating: 7.8, type: "manga", cats: ["action", "aventure", "comedie", "manga"] },
  { tmdbId: 4, title: "Bleach", titleFr: "Bleach", overview: "Ichigo Kurosaki protège les âmes contre les Hollows.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Fantastique", year: 2001, rating: 8.5, type: "manga", cats: ["action", "aventure", "manga"] },
  { tmdbId: 5, title: "Chainsaw Man", titleFr: "Chainsaw Man", overview: "Denji fusionne avec le démon-chaîne de tronçonneuse.", posterPath: "/pMXdS8hhIDq5c8Jbq9GBjK8UvA7.jpg", genres: "Action,Horreur,Comédie", year: 2018, rating: 8.6, type: "manga", cats: ["action", "horreur", "comedie", "manga"] },
  { tmdbId: 6, title: "Solo Leveling", titleFr: "Solo Leveling", overview: "Sung Jinwoo obtient un pouvoir de level-up infini.", posterPath: "/dXzv0DR8x3rFDWJfFozfuY5gFRg.jpg", genres: "Action,Fantastique", year: 2018, rating: 8.7, type: "manga", cats: ["action", "aventure", "manga"] },
  { tmdbId: 7, title: "Jujutsu Kaisen", titleFr: "Jujutsu Kaisen", overview: "Yuji Itadori entre dans le monde des sorciers.", posterPath: "/fEP18fzY77mVDBGVbRCxVNmMnnc.jpg", genres: "Action,Fantastique", year: 2018, rating: 8.5, type: "manga", cats: ["action", "manga"] },
  { tmdbId: 8, title: "Demon Slayer", titleFr: "Demon Slayer : Kimetsu no Yaiba", overview: "Tanjiro devient chasseur de démons pour sauver Nezuko.", posterPath: "/xUfRZu2mi8jH6SzQEJGP6tjBuYj.jpg", genres: "Action,Fantastique", year: 2016, rating: 8.4, type: "manga", cats: ["action", "manga"] },
  { tmdbId: 9, title: "Spy x Family", titleFr: "Spy x Family", overview: "Un espion, une tueuse et une télépathe forment une famille.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Comédie,Action", year: 2019, rating: 8.3, type: "manga", cats: ["comedie", "action", "manga"] },
  { tmdbId: 10, title: "Vinland Saga", titleFr: "Vinland Saga", overview: "Thorfinn, un guerrier viking, cherche la paix.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Drame", year: 2005, rating: 8.8, type: "manga", cats: ["action", "drame", "manga"] },
  { tmdbId: 11, title: "One Punch Man", titleFr: "One Punch Man", overview: "Saitama cherche un adversaire digne de lui.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Comédie", year: 2012, rating: 8.5, type: "manga", cats: ["action", "comedie", "manga"] },
  { tmdbId: 12, title: "Attack on Titan", titleFr: "L'Attaque des Titans", overview: "L'humanité se bat contre des Titans géants.", posterPath: "/hTP1DtLGFamjfu8WqjnuQdP1n4i.jpg", genres: "Action,Drame", year: 2009, rating: 9.1, type: "manga", cats: ["action", "drame", "manga"] },
  { tmdbId: 13, title: "Death Note", titleFr: "Death Note", overview: "Light Yagami trouve un carnet qui tue toute personne dont le nom y est écrit.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Thriller,Mystère", year: 2003, rating: 9.0, type: "manga", cats: ["thriller", "manga"] },
  { tmdbId: 14, title: "Hunter x Hunter", titleFr: "Hunter x Hunter", overview: "Gon cherche son père dans le monde des chasseurs.", posterPath: "/qJ2tW6WMUDux911BTUgMe1nEWkv.jpg", genres: "Action,Aventure", year: 1998, rating: 9.0, type: "manga", cats: ["action", "aventure", "manga"] },
];

// ==================== BATCH SEED ====================

async function seed() {
  console.log("🌱 Seeding with real VidSrc multi-host embeds...");
  const t0 = Date.now();

  await db.contentCategory.deleteMany();
  await db.embedSource.deleteMany();
  await db.content.deleteMany();
  await db.category.deleteMany();

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
    db.category.create({ data: { name: "Films", slug: "films", type: "movie", order: 10 } }),
    db.category.create({ data: { name: "Séries", slug: "series", type: "series", order: 11 } }),
    db.category.create({ data: { name: "Anime", slug: "anime", type: "anime", order: 12 } }),
    db.category.create({ data: { name: "Manga", slug: "manga", type: "manga", order: 13 } }),
  ]);
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // Collect ALL data first, then batch insert
  const allContent: CDef[] = [...MOVIES, ...SERIES, ...ANIME, ...MANGA];
  const allEmbeds: any[] = [];
  const allCategories: any[] = [];
  const contentIdMap = new Map<number, string>(); // tmdbId -> id

  // Create all content in batch
  console.log(`  Creating ${allContent.length} content items...`);
  const createdContent = await db.content.createMany({
    data: allContent.map((d) => ({
      tmdbId: d.tmdbId,
      title: d.title,
      titleFr: d.titleFr,
      overview: d.overview,
      overviewFr: d.overview,
      posterPath: d.posterPath,
      backdropPath: d.backdropPath || null,
      releaseDate: d.year ? `${d.year}-01-01` : null,
      rating: d.rating,
      voteCount: Math.floor(d.rating * 1200),
      type: d.type,
      year: d.year,
      genres: d.genres,
      runtime: d.runtime || null,
      seasons: d.seasons || null,
      featured: d.featured || false,
      featuredOrder: d.featuredOrder || null,
    })),
  });

  // Fetch all created content to get IDs
  const contentItems = await db.content.findMany({ select: { id: true, tmdbId: true, type: true, seasons: true } });
  for (const c of contentItems) {
    if (c.tmdbId) contentIdMap.set(c.tmdbId, c.id);
  }

  // Build embeds
  console.log("  Building embeds...");
  for (const d of allContent) {
    const contentId = contentIdMap.get(d.tmdbId);
    if (!contentId) continue;

    if (d.type === "movie") {
      for (const e of getMovieEmbeds(d.tmdbId)) {
        allEmbeds.push({ contentId, serverName: e.serverName, serverType: "embed", hostProvider: e.hostProvider, url: e.url, lang: e.lang, quality: e.quality, isActive: true });
      }
    } else if (d.type === "manga") {
      allEmbeds.push({ contentId, serverName: "Lecteur 1", serverType: "manga", hostProvider: "manga", url: `https://mangareader.to/read/${contentId}`, lang: "fr", isActive: true });
      allEmbeds.push({ contentId, serverName: "Lecteur 2", serverType: "manga", hostProvider: "manga", url: `https://mangadex.org/title/${contentId}`, lang: "fr", isActive: true });
    } else {
      const numSeasons = Math.min(d.seasons || 1, 2);
      for (let s = 1; s <= numSeasons; s++) {
        const epCount = s === 1 ? 3 : 2;
        for (let ep = 1; ep <= epCount; ep++) {
          for (const e of getSeriesEmbeds(d.tmdbId, s, ep)) {
            allEmbeds.push({ contentId, serverName: e.serverName, serverType: "embed", hostProvider: e.hostProvider, url: e.url, lang: e.lang, quality: e.quality, isActive: true, season: e.season, episode: e.episode });
          }
        }
      }
    }

    // Categories
    for (const slug of d.cats) {
      const catId = catMap[slug];
      if (catId) allCategories.push({ contentId, categoryId: catId });
    }
  }

  // Batch insert embeds (in chunks to avoid SQLite limits)
  console.log(`  Inserting ${allEmbeds.length} embeds in batches...`);
  const CHUNK = 500;
  for (let i = 0; i < allEmbeds.length; i += CHUNK) {
    await db.embedSource.createMany({ data: allEmbeds.slice(i, i + CHUNK) });
  }

  // Batch insert categories
  console.log(`  Inserting ${allCategories.length} category links...`);
  if (allCategories.length > 0) {
    await db.contentCategory.createMany({ data: allCategories });
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s!`);
  console.log(`   📽️  Movies: ${MOVIES.length} × 5 hosts = ${MOVIES.length * 5} embeds`);
  console.log(`   📺  Series: ${SERIES.length} (S1:3ep + S2:2ep) × 5 hosts = ${allEmbeds.filter(e => { const t = SERIES.find(s => contentIdMap.get(s.tmdbId) === e.contentId); return t; }).length} embeds`);
  console.log(`   🎌  Anime: ${ANIME.length} (S1:3ep + S2:2ep) × 5 hosts`);
  console.log(`   📚  Manga: ${MANGA.length} × 2 lecteurs`);
  console.log(`   🌐  Providers: VidSrc, VidSrc Pro, Embed.su, AutoEmbed, 2Embed`);
  console.log(`   📊  Total: ${contentItems.length} contenus, ${allEmbeds.length} sources embed`);
}

seed().catch((e) => { console.error("Seed error:", e); process.exit(1); })
  .finally(() => { db.$disconnect(); process.exit(0); });