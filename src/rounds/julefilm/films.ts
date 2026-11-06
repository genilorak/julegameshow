// Julefilmer og -serier med tre hint hver, fra vanskelig til lett.
export interface Film {
  id: string;
  title: string;
  year: string;
  emoji: string;
  hints: [string, string, string];
}

export const FILMS: Film[] = [
  { id: 'alene', title: 'Alene hjemme', year: '1990', emoji: '🏠', hints: ['En stor familie reiser på juleferie og glemmer noe ganske viktig.', 'To innbruddstyver får malingsbokser i hodet og går på spiker.', 'Kevin, Chicago og et ansikt med hendene på kinnene.'] },
  { id: 'askepott', title: 'Tre nøtter til Askepott', year: '1973', emoji: '🌰', hints: ['En tsjekkisk-tysk film som har gått på norsk TV hver jul i flere tiår.', 'En hvit hest, en ugle og en prins som liker å jakte.', 'Tre små nøtter med magisk innhold.'] },
  { id: 'grevinnen', title: 'Grevinnen og hovmesteren', year: '1963', emoji: '🐯', hints: ['Svart-hvitt, under tjue minutter og fast på NRK lille julaften.', 'Fire gjester som ikke er der. Hovmesteren må skåle for dem alle.', '«Same procedure as last year, Miss Sophie?»'] },
  { id: 'love', title: 'Love Actually', year: '2003', emoji: '💌', hints: ['Mange kjærlighetshistorier i London de siste ukene før jul.', 'En britisk statsminister danser gjennom Downing Street.', 'Plakater i døra: «To me, you are perfect.»'] },
  { id: 'grinchen', title: 'Grinchen', year: '2000', emoji: '💚', hints: ['Han bor på toppen av et fjell sammen med hunden sin.', 'Han hater julen og vil stjele den fra byen nedenfor.', 'Grønn, pelskledd og med et hjerte som er to størrelser for lite.'] },
  { id: 'diehard', title: 'Die Hard', year: '1988', emoji: '🏢', hints: ['Et julebord i en skyskraper i Los Angeles går helt galt.', 'Helten må gå barbeint på knust glass.', 'John McClane og «Yippee-ki-yay».'] },
  { id: 'elf', title: 'Elf', year: '2003', emoji: '🧝', hints: ['En voksen mann har vokst opp blant svært små kolleger.', 'Han har lønnesirup på spagettien til frokost.', 'Will Ferrell i grønn drakt reiser til New York for å finne faren sin.'] },
  { id: 'polar', title: 'Polarekspressen', year: '2004', emoji: '🚂', hints: ['En gutt som tviler på julenissen får besøk midt på natta.', 'Animert, og Tom Hanks spiller flere av rollene.', 'Et tog med billett som blir klippet, og målet er Nordpolen.'] },
  { id: 'julestjernen', title: 'Reisen til julestjernen', year: '1976 og 2012', emoji: '⭐', hints: ['Norsk eventyrfilm om ei lita prinsesse som blir borte i skogen.', 'Kongen lover at den som finner henne skal få belønning.', 'Sonja leter etter stjerna som har forsvunnet fra himmelen.'] },
  { id: 'blafjell', title: 'Jul i Blåfjell', year: '1999', emoji: '🏔️', hints: ['NRK-julekalender som mange voksne i dag husker fra barndommen.', 'Nissene bor inne i et fjell og driver med noe hemmelig.', 'Ei jente som heter Lovise oppdager blånissene.'] },
  { id: 'holiday', title: 'The Holiday', year: '2006', emoji: '🔁', hints: ['To kvinner har hatt et elendig år med kjærligheten.', 'De bytter hus over jula: et lite hus i England mot en villa i Los Angeles.', 'Cameron Diaz, Kate Winslet og Jude Law.'] },
  { id: 'snekker', title: 'Snekker Andersen og Julenissen', year: '2016', emoji: '🔨', hints: ['Norsk familiefilm bygget på en historie av Alf Prøysen.', 'En pappa vil kle seg ut som nisse på julaften for barna sine.', 'Han møter den ekte julenissen, og de bytter plass.'] },
];

export const filmById = (id: string) => FILMS.find((f) => f.id === id);
