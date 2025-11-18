import { randomFillSync, createHash } from 'crypto';

export interface FunnyNameOptions {
    capitalized?: boolean;
    hyphenate?: boolean;
    seed?: string | number;     // <── NEW OPTION
}

export class FunnyNameService {
    private static readonly WORDS = {
        adjectives: [
            'lumbering', 'stumpy', 'lumpy', 'rambling', 'mumbling', 'clumsy',
            'snoring', 'wandering', 'grumbling', 'bumbling', 'puffy', 'dreary',
            'lanky', 'soggy', 'bouncy', 'squishy', 'wonky', 'flimsy', 'quirky'
        ],
        adverbs: [
            'gently', 'oddly', 'barely', 'briskly', 'roughly', 'softly',
            'weirdly', 'wildly', 'slowly', 'boldly', 'curiously', 'brightly'
        ],
        nouns: [
            'stumpy', 'lumpy', 'beetle', 'badger', 'gnome', 'puffball',
            'muffin', 'mushroom', 'walrus', 'pebble', 'goblin',
            'weasel', 'bug', 'marshmallow', 'twiglet'
        ],
        gerunds: [
            'stumbling', 'rambling', 'bubbling', 'fluttering', 'trembling',
            'shuffling', 'smoldering', 'muttering', 'twirling', 'sniffing'
        ]
    } as const;

    // --------------------------------------------------------------------
    // SEEDED RNG  (xmur3 + mulberry32)
    // --------------------------------------------------------------------
    private static createSeededRandom(seed: string | number) {
        if (typeof seed === 'number') seed = seed.toString();

        // Hash the seed so long strings work consistently
        const hash = createHash('sha256').update(seed).digest();

        // convert first 4 bytes to a 32-bit seed
        let s =
            (hash[0] << 24) |
            (hash[1] << 16) |
            (hash[2] << 8) |
            (hash[3]);

        // PRNG: mulberry32
        return function (max: number) {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            const rnd = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            return Math.floor(rnd * max);
        };
    }

    // Unseeded crypto RNG fallback
    private static cryptoRand(max: number) {
        const buf = new Uint32Array(1);
        randomFillSync(buf);
        return buf[0] % max;
    }

    private static pick<T>(randFn: (max: number) => number, arr: ReadonlyArray<T>): T {
        return arr[randFn(arr.length)];
    }

    private static capitalize(str: string): string {
        return str.replace(/\b\w/g, c => c.toUpperCase());
    }

    private static maybeHyphenate(randFn: (max: number) => number, str: string): string {
        const useHyphen = randFn(100) < 30;
        return str.replace(' ', useHyphen ? '-' : ' ');
    }

    private static readonly PATTERNS: ((w: typeof FunnyNameService.WORDS, r: (max: number) => number) => string)[] = [
        (w, r) => `${this.pick(r, w.adjectives)} ${this.pick(r, w.nouns)}`,
        (w, r) => `${this.pick(r, w.adverbs)} ${this.pick(r, w.gerunds)}`,
        (w, r) => `${this.pick(r, w.adjectives)} ${this.pick(r, w.adjectives)} ${this.pick(r, w.nouns)}`,
        (w, r) => `${this.pick(r, w.adjectives)} ${this.pick(r, w.gerunds)}`,
        (w, r) => `${this.pick(r, w.gerunds)} ${this.pick(r, w.nouns)}`
    ];

    // --------------------------------------------------------------------
    // MAIN API
    // --------------------------------------------------------------------
    static generate(opts: FunnyNameOptions = {}): string {
        const randFn = opts.seed !== undefined
            ? this.createSeededRandom(opts.seed)
            : this.cryptoRand.bind(this);

        const pattern = this.PATTERNS[randFn(this.PATTERNS.length)];

        let name = pattern(this.WORDS, randFn);

        if (opts.hyphenate) name = this.maybeHyphenate(randFn, name);
        if (opts.capitalized) name = this.capitalize(name);

        return name;
    }

    static generateMany(count: number, opts: FunnyNameOptions = {}): string[] {
        const res = [];
        for (let i = 0; i < count; i++) res.push(this.generate(opts));
        return res;
    }
}
