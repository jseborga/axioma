/* ===========================================================
   AXIOMA · Concursos de trivia · banco de preguntas
   Vive solo en el servidor: el navegador recibe una pregunta cada
   vez y nunca la respuesta, así nadie puede consultar el banco
   durante un concurso con premio. No comparte preguntas con la
   trivia de práctica (public/rapidos-motor.js), que sí es pública.

   Cada pregunta: [nivel, categoría, pregunta, correcta, otra, otra, otra]
   Nivel 1 fácil · 2 medio · 3 difícil. Las operaciones matemáticas
   se generan aparte, sin límite, con la misma escala de niveles.
   =========================================================== */
import AMPLIACION from "./banco/index.js";

export var CATEGORIAS={geo:"Geografía",bol:"Bolivia",lat:"Latinoamérica",his:"Historia",cie:"Ciencia",nat:"Naturaleza",
  sal:"Cuerpo humano y salud",amb:"Medio ambiente",dep:"Deportes",cul:"Arte y cultura",lit:"Literatura",mus:"Música",
  cin:"Cine y series",mit:"Mitología",len:"Lengua",ing:"Inglés",tec:"Tecnología",eco:"Economía",gas:"Gastronomía",mat:"Cálculo"};

/* El banco original. Los concursos empezados antes de ampliar el banco
   siguen usando solo este, para que su secuencia no cambie a mitad. */
var BANCO_V1=[
/* ---------- geografía ---------- */
[1,"geo","¿Cuál es la capital de Francia?","París","Lyon","Marsella","Niza"],
[1,"geo","¿Cuál es la capital de Italia?","Roma","Milán","Venecia","Nápoles"],
[1,"geo","¿Cuál es la capital de México?","Ciudad de México","Guadalajara","Monterrey","Cancún"],
[1,"geo","¿En qué país está la Gran Muralla?","China","Japón","Mongolia","Corea del Sur"],
[1,"geo","¿En qué país está la Estatua de la Libertad?","Estados Unidos","Francia","Canadá","Reino Unido"],
[1,"geo","¿Qué país es famoso por sus canguros?","Australia","Nueva Zelanda","Sudáfrica","Argentina"],
[1,"geo","¿Qué país tiene una hoja de arce en su bandera?","Canadá","Suiza","Japón","Austria"],
[1,"geo","¿Qué país tiene una bandera blanca con un círculo rojo en el centro?","Japón","China","Corea del Sur","Bangladés"],
[1,"geo","¿Qué océano baña las costas de Chile?","El Pacífico","El Atlántico","El Índico","El Ártico"],
[1,"geo","¿Qué idioma es el oficial de Brasil?","El portugués","El español","El francés","El inglés"],
[1,"geo","¿Qué canal une el Atlántico con el Pacífico en Centroamérica?","El canal de Panamá","El canal de Suez","El canal de Kiel","El canal de Corinto"],
[2,"geo","¿Cuál es la capital de Alemania?","Berlín","Múnich","Hamburgo","Fráncfort"],
[2,"geo","¿Cuál es la capital de Portugal?","Lisboa","Oporto","Coímbra","Braga"],
[2,"geo","¿Cuál es la capital de Japón?","Tokio","Kioto","Osaka","Hiroshima"],
[2,"geo","¿Cuál es la capital de Egipto?","El Cairo","Alejandría","Luxor","Guiza"],
[2,"geo","¿Cuál es la capital de Uruguay?","Montevideo","Punta del Este","Salto","Colonia del Sacramento"],
[2,"geo","¿Cuál es la capital de Ecuador?","Quito","Guayaquil","Cuenca","Loja"],
[2,"geo","¿Cuál es la capital de Venezuela?","Caracas","Maracaibo","Valencia","Mérida"],
[2,"geo","¿Cuál es la capital de Cuba?","La Habana","Santiago de Cuba","Varadero","Camagüey"],
[2,"geo","¿Qué río atraviesa París?","El Sena","El Támesis","El Rin","El Danubio"],
[2,"geo","¿Qué río atraviesa Londres?","El Támesis","El Sena","El Tíber","El Elba"],
[2,"geo","¿Entre qué dos países están las cataratas del Iguazú?","Argentina y Brasil","Paraguay y Bolivia","Venezuela y Colombia","Perú y Ecuador"],
[2,"geo","¿Cuál es el país más grande de Sudamérica?","Brasil","Argentina","Perú","Colombia"],
[2,"geo","Además de Bolivia, ¿qué país sudamericano no tiene salida al mar?","Paraguay","Uruguay","Ecuador","Venezuela"],
[2,"geo","¿A qué país pertenece la isla de Pascua?","Chile","Perú","Ecuador","Francia"],
[2,"geo","¿Cuál es la montaña más alta de África?","El Kilimanjaro","El monte Kenia","El Atlas","El Ruwenzori"],
[2,"geo","¿Qué mar baña a la vez las costas de Italia, Grecia y Egipto?","El Mediterráneo","El Caribe","El mar Negro","El mar Rojo"],
[2,"geo","¿En qué ciudad está el museo del Louvre?","París","Londres","Madrid","Roma"],
[2,"geo","Según la ONU, ¿qué país es el más poblado del mundo desde 2023?","India","China","Estados Unidos","Indonesia"],
[3,"geo","¿Cuál es la capital de Nueva Zelanda?","Wellington","Auckland","Christchurch","Queenstown"],
[3,"geo","¿Cuál es la capital de Turquía?","Ankara","Estambul","Esmirna","Antalya"],
[3,"geo","¿Cuál es la capital de Marruecos?","Rabat","Casablanca","Marrakech","Fez"],
[3,"geo","¿En qué ciudad tiene su sede el gobierno federal de Suiza?","Berna","Zúrich","Ginebra","Basilea"],
[3,"geo","¿Cuál es la capital de Kenia?","Nairobi","Mombasa","Kampala","Adís Abeba"],
[3,"geo","¿Cuál es la capital de Nigeria?","Abuya","Lagos","Kano","Ibadán"],
[3,"geo","¿Cuál es la capital de Vietnam?","Hanói","Ho Chi Minh","Da Nang","Hue"],
[3,"geo","¿Cuál es la capital de Pakistán?","Islamabad","Karachi","Lahore","Peshawar"],
[3,"geo","¿Cuál es la capital de Honduras?","Tegucigalpa","San Pedro Sula","Managua","San Salvador"],
[3,"geo","¿Cuál es el río más largo de Europa?","El Volga","El Danubio","El Rin","El Dniéper"],
[3,"geo","¿Cuál es el país más extenso de África?","Argelia","República Democrática del Congo","Sudán","Libia"],
[3,"geo","¿Qué país tiene la mayor parte de la superficie del lago Titicaca?","Perú","Bolivia","Chile","Argentina"],
[3,"geo","¿Qué estrecho separa Asia de América?","El estrecho de Bering","El de Gibraltar","El de Magallanes","El del Bósforo"],

/* ---------- Bolivia ---------- */
[1,"bol","¿Cuántos departamentos tiene Bolivia?","9","8","10","12"],
[1,"bol","¿De qué colores es la bandera de Bolivia?","Rojo, amarillo y verde","Rojo, blanco y azul","Verde, blanco y rojo","Azul, amarillo y rojo"],
[1,"bol","¿Con qué apodo se conoce a la selección boliviana de fútbol?","La Verde","La Roja","La Albiceleste","La Tricolor"],
[1,"bol","¿Qué ciudad es la sede de gobierno de Bolivia?","La Paz","Sucre","Santa Cruz de la Sierra","Cochabamba"],
[2,"bol","¿Qué ciudad boliviana es conocida como la «Ciudad Blanca»?","Sucre","Potosí","Tarija","Oruro"],
[2,"bol","¿Qué ciudad boliviana es conocida como la «Ciudad Jardín»?","Cochabamba","Santa Cruz de la Sierra","Trinidad","Cobija"],
[2,"bol","¿Cuál es la ciudad más poblada de Bolivia?","Santa Cruz de la Sierra","El Alto","La Paz","Cochabamba"],
[2,"bol","¿Cuál es la capital del departamento del Beni?","Trinidad","Riberalta","Guayaramerín","Rurrenabaque"],
[2,"bol","¿Cuál es la capital del departamento de Pando?","Cobija","Riberalta","Trinidad","Puerto Suárez"],
[2,"bol","¿Qué guerra enfrentó a Bolivia y Paraguay entre 1932 y 1935?","La Guerra del Chaco","La Guerra del Pacífico","La Guerra del Acre","La Guerra de la Triple Alianza"],
[2,"bol","¿En qué guerra perdió Bolivia su salida al mar?","La Guerra del Pacífico","La Guerra del Chaco","La Guerra del Acre","La Guerra Federal"],
[2,"bol","¿Cerca de qué lago están las ruinas de Tiwanaku?","El Titicaca","El Poopó","El Uru Uru","El Coipasa"],
[2,"bol","¿En qué ciudad se celebra la Fiesta del Gran Poder?","La Paz","Oruro","Potosí","Sucre"],
[2,"bol","¿Cómo se llama la feria paceña de miniaturas dedicada al Ekeko?","Alasitas","Gran Poder","Urkupiña","Todos Santos"],
[2,"bol","¿Qué parque nacional de La Paz es famoso por su enorme biodiversidad?","Madidi","Noel Kempff Mercado","Amboró","Sajama"],
[2,"bol","¿Qué ciudad vecina de La Paz está a más de 4000 metros de altura?","El Alto","Viacha","Achocalla","Oruro"],
[2,"bol","¿Qué club boliviano de fútbol es conocido como «La Academia»?","Bolívar","The Strongest","Jorge Wilstermann","Oriente Petrolero"],
[2,"bol","¿En qué estadio de La Paz juega la selección boliviana?","Hernando Siles","Félix Capriles","Ramón Tahuichi Aguilera","Jesús Bermúdez"],
[2,"bol","¿Qué tubérculo se deshidrata con el frío para obtener el chuño?","La papa","La yuca","La oca","El camote"],
[2,"bol","¿Qué pan típico cruceño se hace con almidón de yuca y queso?","El cuñapé","La sopaipilla","La marraqueta","El buñuelo"],
[3,"bol","¿Cuál es la montaña más alta de Bolivia?","El Sajama","El Illimani","El Huayna Potosí","El Illampu"],
[3,"bol","¿Cuál es el departamento más extenso de Bolivia?","Santa Cruz","Beni","Potosí","La Paz"],
[3,"bol","¿Quién fue el primer presidente de Bolivia?","Simón Bolívar","Antonio José de Sucre","Andrés de Santa Cruz","José Ballivián"],
[3,"bol","¿De qué uva se destila el singani?","Moscatel de Alejandría","Cabernet Sauvignon","Malbec","Tannat"],
[3,"bol","¿Con qué fruta deshidratada se prepara el mocochinchi?","El durazno","La manzana","La pera","La ciruela"],
[3,"bol","¿Quién escribió la novela «Juan de la Rosa»?","Nataniel Aguirre","Alcides Arguedas","Franz Tamayo","Adela Zamudio"],
[3,"bol","¿Quién escribió la novela «Raza de bronce»?","Alcides Arguedas","Nataniel Aguirre","Jaime Saenz","Óscar Cerruto"],
[3,"bol","¿En qué ciudad nació la escritora Adela Zamudio?","Cochabamba","Sucre","La Paz","Tarija"],

/* ---------- historia ---------- */
[1,"his","¿Qué imperio construyó el Coliseo?","El romano","El griego","El otomano","El persa"],
[2,"his","¿Qué líder sudafricano pasó 27 años en prisión y después fue presidente?","Nelson Mandela","Desmond Tutu","Kofi Annan","Mahatma Gandhi"],
[2,"his","¿En qué año comenzó la Primera Guerra Mundial?","1914","1918","1939","1905"],
[2,"his","¿Qué emperador francés fue derrotado en Waterloo?","Napoleón Bonaparte","Luis XIV","Carlomagno","Luis XVI"],
[2,"his","¿En qué país comenzó la Revolución Industrial?","Gran Bretaña","Francia","Alemania","Estados Unidos"],
[2,"his","¿En qué año se declaró la independencia de Estados Unidos?","1776","1789","1812","1810"],
[2,"his","¿En qué año llegó el ser humano a la Luna?","1969","1959","1972","1965"],
[2,"his","¿De qué navegante toma su nombre el continente americano?","Américo Vespucio","Cristóbal Colón","Fernando de Magallanes","Hernán Cortés"],
[2,"his","¿Qué país regaló la Estatua de la Libertad a Estados Unidos?","Francia","Reino Unido","España","Italia"],
[3,"his","¿En qué año cayó el Imperio romano de Occidente?","476","1453","800","312"],
[3,"his","¿En qué año tomaron los otomanos Constantinopla?","1453","1492","1204","1517"],
[3,"his","¿Qué año se toma como inicio de la Revolución francesa?","1789","1776","1815","1848"],
[3,"his","¿En qué año se disolvió la Unión Soviética?","1991","1989","1985","1993"],
[3,"his","¿Qué gobernante inca capturó Pizarro en Cajamarca en 1532?","Atahualpa","Huáscar","Manco Cápac","Pachacútec"],
[3,"his","¿Quién completó la primera vuelta al mundo tras la muerte de Magallanes?","Juan Sebastián Elcano","Cristóbal Colón","Vasco da Gama","Américo Vespucio"],
[3,"his","¿Qué descubrió Howard Carter en 1922?","La tumba de Tutankamón","Las ruinas de Troya","Machu Picchu","Pompeya"],
[3,"his","¿En qué ciudad fue asesinado John F. Kennedy?","Dallas","Nueva York","Washington","Chicago"],
[3,"his","¿Qué filósofo griego fue maestro de Alejandro Magno?","Aristóteles","Platón","Sócrates","Pitágoras"],
[3,"his","¿Qué barco llevó a los peregrinos ingleses a Norteamérica en 1620?","El Mayflower","La Santa María","El Beagle","El Endeavour"],

/* ---------- ciencia ---------- */
[1,"cie","¿Cuál es el satélite natural de la Tierra?","La Luna","Fobos","Titán","Europa"],
[1,"cie","¿Qué estrella está en el centro del sistema solar?","El Sol","Sirio","La estrella Polar","Alfa Centauri"],
[1,"cie","¿A qué temperatura se congela el agua pura al nivel del mar?","0 °C","100 °C","−10 °C","4 °C"],
[1,"cie","¿Cuántos grados mide un ángulo recto?","90","180","45","60"],
[2,"cie","¿Cómo se llama la galaxia en la que está el sistema solar?","La Vía Láctea","Andrómeda","La Nube de Magallanes","El Triángulo"],
[2,"cie","¿Cuál es el gas más abundante en la atmósfera terrestre?","El nitrógeno","El oxígeno","El dióxido de carbono","El argón"],
[2,"cie","¿En qué parte de la célula está la mayor parte del ADN?","En el núcleo","En la membrana","En los ribosomas","En la vacuola"],
[2,"cie","¿Cuántos dientes tiene un adulto con la dentadura completa?","32","28","30","36"],
[2,"cie","¿Qué científico propuso la evolución por selección natural?","Charles Darwin","Gregor Mendel","Jean-Baptiste Lamarck","Louis Pasteur"],
[2,"cie","¿Quién descubrió la penicilina?","Alexander Fleming","Louis Pasteur","Marie Curie","Robert Koch"],
[2,"cie","¿Qué científica ganó premios Nobel en dos ciencias distintas?","Marie Curie","Rosalind Franklin","Ada Lovelace","Lise Meitner"],
[2,"cie","¿Qué científico enunció las tres leyes del movimiento?","Isaac Newton","Galileo Galilei","Johannes Kepler","Albert Einstein"],
[2,"cie","¿Qué planeta tiene la Gran Mancha Roja?","Júpiter","Marte","Saturno","Neptuno"],
[2,"cie","¿Cuál es el planeta más caliente del sistema solar?","Venus","Mercurio","Marte","Júpiter"],
[2,"cie","¿Qué órgano filtra la sangre y produce la orina?","El riñón","El hígado","El páncreas","El bazo"],
[2,"cie","¿Qué parte del ojo le da su color?","El iris","La retina","La pupila","La córnea"],
[2,"cie","¿Qué elemento químico tiene el símbolo Fe?","El hierro","El flúor","El fósforo","El francio"],
[2,"cie","¿Qué elemento químico tiene el símbolo Ag?","La plata","El oro","El argón","El aluminio"],
[2,"cie","¿Cómo se llama el paso de sólido a líquido?","Fusión","Evaporación","Sublimación","Condensación"],
[2,"cie","¿Qué capa de la atmósfera nos protege de la radiación ultravioleta?","La capa de ozono","La troposfera","La ionosfera","La exosfera"],
[2,"cie","¿En qué unidad se mide la potencia eléctrica?","En vatios","En voltios","En amperios","En ohmios"],
[2,"cie","¿Qué matemático griego da nombre a un teorema sobre triángulos rectángulos?","Pitágoras","Euclides","Arquímedes","Tales de Mileto"],
[2,"cie","¿Cuánto vale aproximadamente el número pi?","3,1416","2,7183","1,6180","3,1614"],
[2,"cie","¿Cuántos grados suman los ángulos interiores de un triángulo?","180","360","90","270"],
[2,"cie","¿Cómo se llama un polígono de ocho lados?","Octágono","Hexágono","Decágono","Heptágono"],
[2,"cie","¿Qué número romano vale 50?","L","C","D","X"],
[3,"cie","¿Cuál es el número atómico del carbono?","6","12","8","14"],
[3,"cie","¿Qué gas noble se usa en los letreros luminosos rojos?","El neón","El argón","El helio","El kriptón"],
[3,"cie","¿Cuál es el hueso más pequeño del cuerpo humano?","El estribo","El yunque","El martillo","La falange distal"],
[3,"cie","¿Cuánto tarda aproximadamente la luz del Sol en llegar a la Tierra?","Unos 8 minutos","Unos 8 segundos","Unas 8 horas","Un día"],
[3,"cie","¿Qué grupo sanguíneo se considera donante universal?","O negativo","AB positivo","A positivo","B negativo"],
[3,"cie","¿Qué hormona falta en la diabetes tipo 1?","La insulina","La adrenalina","La tiroxina","La melatonina"],
[3,"cie","¿Qué planeta tarda más en girar sobre sí mismo que en dar la vuelta al Sol?","Venus","Mercurio","Marte","Urano"],
[3,"cie","¿Cuántos corazones tiene un pulpo?","3","1","2","8"],
[3,"cie","¿Cuál es la unidad de fuerza del Sistema Internacional?","El newton","El julio","El vatio","El pascal"],
[3,"cie","¿Qué año es MMXXVI en números romanos?","2026","2016","2046","2024"],
[3,"cie","¿Qué elemento químico tiene el símbolo Na?","El sodio","El nitrógeno","El níquel","El neón"],
[3,"cie","¿Qué número romano vale 500?","D","M","C","L"],

/* ---------- naturaleza ---------- */
[1,"nat","¿Cuál es el animal más alto del mundo?","La jirafa","El elefante","El camello","El avestruz"],
[1,"nat","¿Qué animal es conocido como el rey de la selva?","El león","El tigre","El elefante","El gorila"],
[1,"nat","¿Cuál de estos mamíferos puede volar?","El murciélago","El pingüino","La ardilla","El delfín"],
[1,"nat","¿Qué animal es famoso por cambiar de color para camuflarse?","El camaleón","La iguana","La tortuga","El cocodrilo"],
[1,"nat","¿Qué tipo de animal es la ballena?","Un mamífero","Un pez","Un anfibio","Un reptil"],
[1,"nat","¿Cómo se llaman los animales que solo comen plantas?","Herbívoros","Carnívoros","Omnívoros","Insectívoros"],
[1,"nat","¿Qué parte de la planta absorbe el agua del suelo?","La raíz","La hoja","La flor","El fruto"],
[1,"nat","¿En qué estación del año pierden sus hojas muchos árboles?","En otoño","En primavera","En verano","En invierno"],
[1,"nat","¿Cuántas patas tiene un insecto?","6","8","4","10"],
[2,"nat","¿Cuál es el felino más grande del mundo?","El tigre","El león","El jaguar","El leopardo"],
[2,"nat","¿Qué ave puede volar hacia atrás?","El colibrí","El halcón","El gorrión","El pelícano"],
[2,"nat","¿Qué forma el arcoíris?","La luz del sol al atravesar gotas de agua","El reflejo del mar en las nubes","El polvo del aire","El viento frío"],
[2,"nat","¿De qué se alimenta sobre todo el panda gigante?","De bambú","De pescado","De eucalipto","De frutas"],
[2,"nat","¿Qué es un koala?","Un marsupial","Un oso","Un roedor","Un primate"],
[2,"nat","¿Qué gas toman las plantas del aire para la fotosíntesis?","El dióxido de carbono","El oxígeno","El nitrógeno","El hidrógeno"],
[3,"nat","¿Cuál es la especie de árbol más alta del mundo?","La secuoya roja","El baobab","El eucalipto","El ceibo"],
[3,"nat","¿Qué animal andino da la fibra más fina y valiosa?","La vicuña","La llama","La alpaca","El guanaco"],
[3,"nat","¿Qué mamífero terrestre tiene la gestación más larga?","El elefante","La jirafa","El rinoceronte","El caballo"],
[3,"nat","¿En cuántos compartimentos se divide el estómago de una vaca?","4","2","3","1"],

/* ---------- deportes ---------- */
[1,"dep","¿Cada cuántos años se juega el Mundial de fútbol masculino?","4","2","3","5"],
[1,"dep","¿Qué deporte practicaba Michael Jordan?","El baloncesto","El béisbol","El fútbol americano","El tenis"],
[1,"dep","¿En qué deporte destaca Rafael Nadal?","El tenis","El pádel","El golf","El fútbol"],
[1,"dep","¿Qué deporte se juega con un bate y cuatro bases?","El béisbol","El críquet","El golf","El hockey"],
[2,"dep","¿En cuántos cuartos se divide un partido de baloncesto?","4","2","3","5"],
[2,"dep","¿Cuánto mide una maratón?","42,195 km","40 km","21,097 km","50 km"],
[2,"dep","¿En qué ciudad se celebraron los primeros Juegos Olímpicos modernos, en 1896?","Atenas","París","Londres","Roma"],
[2,"dep","¿Qué país organizó los Juegos Olímpicos de 2016?","Brasil","China","Reino Unido","Japón"],
[2,"dep","¿Qué deporte japonés enfrenta a luchadores muy corpulentos dentro de un círculo?","El sumo","El judo","El kárate","El kendo"],
[2,"dep","¿Con qué apodo se conoce al club The Strongest?","El Tigre","El León","El Cóndor","El Puma"],
[3,"dep","¿Cuántos sets hay que ganar para llevarse un partido masculino de Grand Slam?","3","2","4","5"],
[3,"dep","¿Cuántos jugadores tiene en el campo un equipo de rugby union?","15","11","13","12"],
[3,"dep","¿Qué selección ganó el primer Mundial de fútbol, en 1930?","Uruguay","Argentina","Brasil","Italia"],
[3,"dep","¿Cuántos puntos vale un touchdown en el fútbol americano?","6","7","3","2"],

/* ---------- arte y cultura ---------- */
[1,"cul","¿Qué película de Disney tiene como protagonista a un león llamado Simba?","El rey león","Madagascar","Tarzán","Zootopia"],
[1,"cul","¿Cómo se llama el vaquero de «Toy Story»?","Woody","Buzz","Andy","Jessie"],
[1,"cul","¿En qué saga aparecen Luke Skywalker y Darth Vader?","Star Wars","Star Trek","Dune","Matrix"],
[1,"cul","¿Qué cantante colombiana interpreta «Hips Don't Lie»?","Shakira","Karol G","Juanes","Carlos Vives"],
[1,"cul","¿Cuántas notas tiene la escala musical tradicional (do, re, mi…)?","7","8","5","12"],
[1,"cul","¿Qué se celebra el 25 de diciembre?","La Navidad","El Año Nuevo","La Pascua","El Carnaval"],
[1,"cul","¿Qué país celebra el Día de Muertos con altares y calaveras de azúcar?","México","España","Argentina","Chile"],
[1,"cul","¿Quién escribió «Romeo y Julieta»?","William Shakespeare","Miguel de Cervantes","Molière","Dante Alighieri"],
[1,"cul","¿Qué color se obtiene al mezclar azul y amarillo?","Verde","Morado","Naranja","Marrón"],
[2,"cul","¿Quién pintó «La noche estrellada»?","Vincent van Gogh","Claude Monet","Pablo Picasso","Salvador Dalí"],
[2,"cul","¿Quién pintó el «Guernica»?","Pablo Picasso","Salvador Dalí","Joan Miró","Francisco de Goya"],
[2,"cul","¿Quién compuso «Las cuatro estaciones»?","Antonio Vivaldi","Johann Sebastian Bach","Wolfgang Amadeus Mozart","Frédéric Chopin"],
[2,"cul","¿Quién pintó el techo de la Capilla Sixtina?","Miguel Ángel","Rafael","Leonardo da Vinci","Botticelli"],
[2,"cul","¿Qué famosa escultura de Miguel Ángel se conserva en Florencia?","El David","El pensador","La Venus de Milo","El discóbolo"],
[2,"cul","¿A quién se atribuye tradicionalmente «La Odisea»?","A Homero","A Virgilio","A Sófocles","A Platón"],
[2,"cul","¿Quién dirigió la película «Titanic» (1997)?","James Cameron","Steven Spielberg","Martin Scorsese","Christopher Nolan"],
[2,"cul","¿De qué país es el grupo ABBA?","Suecia","Noruega","Dinamarca","Finlandia"],
[2,"cul","¿Con qué apodo se conoce a Elvis Presley?","El Rey del Rock","El Príncipe del Pop","El Jefe","La Voz"],
[2,"cul","¿Qué instrumento andino de viento está hecho de varios tubos de caña unidos?","La zampoña","La quena","El charango","La tarka"],
[3,"cul","¿Qué poeta chileno ganó el Nobel de Literatura en 1971?","Pablo Neruda","Gabriela Mistral","Vicente Huidobro","Nicanor Parra"],
[3,"cul","¿Qué poeta nicaragüense encabezó el modernismo literario?","Rubén Darío","José Martí","Amado Nervo","Octavio Paz"],
[3,"cul","¿Quién escribió «La metamorfosis»?","Franz Kafka","Albert Camus","Hermann Hesse","Thomas Mann"],
[3,"cul","¿Qué muralista mexicano fue esposo de Frida Kahlo?","Diego Rivera","José Clemente Orozco","David Alfaro Siqueiros","Rufino Tamayo"],
[3,"cul","¿Quién escribió la novela «Rayuela»?","Julio Cortázar","Jorge Luis Borges","Ernesto Sabato","Adolfo Bioy Casares"],

/* ---------- lengua ---------- */
[1,"len","¿Qué palabra es lo contrario de «alto»?","Bajo","Grande","Largo","Ancho"],
[2,"len","¿Qué palabra es lo contrario de «generoso»?","Tacaño","Amable","Alegre","Dadivoso"],
[2,"len","¿Cómo se llaman las palabras que se leen igual al derecho y al revés, como «reconocer»?","Palíndromos","Sinónimos","Homófonos","Anagramas"],
[2,"len","¿Qué clase de palabra es «rápidamente»?","Un adverbio","Un adjetivo","Un verbo","Un sustantivo"],
[2,"len","¿Cuál está bien escrita?","Examen","Exámen","Exsamen","Egzamen"],
[2,"len","Completa: «___ muchas personas en la fiesta».","Había","Habían","A ver","Haber"],
[2,"len","¿Cuál de estas palabras es esdrújula?","Música","Canción","Árbol","Reloj"],
[3,"len","¿Cuál es el plural de «régimen»?","Regímenes","Régimenes","Regimenes","Régimens"],
[3,"len","¿Cuál de estas palabras está bien escrita?","Exhibición","Exibición","Exhivición","Exivición"],
[3,"len","¿Qué figura literaria es «tus dientes son perlas»?","Una metáfora","Una hipérbole","Una onomatopeya","Una aliteración"],
[3,"len","¿Qué significa «efímero»?","Pasajero","Eterno","Enorme","Frágil"],

/* ---------- tecnología ---------- */
[1,"tec","¿Qué empresa desarrolla Windows?","Microsoft","Apple","Google","IBM"],
[2,"tec","¿Quién fundó Microsoft junto a Paul Allen?","Bill Gates","Steve Jobs","Mark Zuckerberg","Larry Page"],
[2,"tec","¿Qué red social de fotos compró Facebook en 2012?","Instagram","Snapchat","Pinterest","TikTok"],
[2,"tec","¿Cuántos megabytes tiene un gigabyte en informática tradicional?","1024","1000","512","2048"],
[3,"tec","¿Qué significan las siglas PDF?","Portable Document Format","Printed Data File","Public Document Form","Personal Digital File"],
[3,"tec","¿Quién es considerada la primera programadora de la historia?","Ada Lovelace","Grace Hopper","Marie Curie","Hedy Lamarr"],
[3,"tec","¿En qué año salió a la venta el primer iPhone?","2007","2005","2009","2010"],

/* ---------- gastronomía ---------- */
[1,"gas","¿De qué fruta se hace el vino?","De la uva","De la manzana","De la fresa","De la pera"],
[2,"gas","¿De qué país es plato bandera el ceviche?","Perú","México","Chile","Argentina"],
[2,"gas","¿Qué bebida andina se elabora con maíz fermentado?","La chicha","El singani","El api","El mocochinchi"],
[2,"gas","¿Qué grano andino, rico en proteína, se conoce como «grano de oro»?","La quinua","El arroz","El trigo","La avena"],
[2,"gas","¿De qué país es originaria la paella?","España","Italia","Portugal","México"],
[3,"gas","¿De qué país es típico el gulash?","Hungría","Alemania","Polonia","Rusia"],
[3,"gas","¿Qué especia, la más cara del mundo, se obtiene de los estigmas de una flor?","El azafrán","La canela","La vainilla","El cardamomo"]
];

/* banco completo: el original y las ampliaciones por áreas (src/banco/),
   con un «¿Sabías que…?» opcional como octavo elemento */
export var BANCO=BANCO_V1.concat(AMPLIACION);

/* ---------- azar reproducible ---------- */
export function semilla(txt){
  var h=0x811c9dc5, i; txt=String(txt);
  for(i=0;i<txt.length;i++){h^=txt.charCodeAt(i); h=Math.imul(h,0x01000193);}
  return h>>>0;
}
export function rng(s){var a=s>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};}
function entre(r,a,b){return a+Math.floor(r()*(b-a+1));}
function uno(r,l){return l[Math.floor(r()*l.length)];}
export function baraja(a,r){for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t;}return a;}

/* coloca la correcta en una posición al azar entre las cuatro */
function opciones(correcta,otras,r){
  var o=[correcta].concat(otras), orden=baraja([0,1,2,3],r);
  return {o:orden.map(function(k){return o[k];}),c:orden.indexOf(0)};
}

/* ---------- operaciones matemáticas ---------- */
function distractores(res,r,extra){
  var cand=[res+1,res-1,res+2,res-2,res+10,res-10,res+5,res-5], vistos={}, out=[];
  if(extra)cand=extra.concat(cand);
  var s=String(res); if(s.length>=2){var inv=Number(s.split("").reverse().join(""));cand.unshift(inv);}
  vistos[res]=1;
  baraja(cand,r).forEach(function(v){ if(out.length<3&&v>=0&&!vistos[v]){vistos[v]=1;out.push(v);} });
  var k=3; while(out.length<3){ if(!vistos[res+k]){vistos[res+k]=1;out.push(res+k);} k++; }
  return out;
}
export function matematica(nivel,r){
  var a,b,c,t,res,extra=null,p;
  if(nivel===1){
    var ti=entre(r,0,2);
    if(ti===0){a=entre(r,11,59);b=entre(r,11,39);t="¿Cuánto es "+a+" + "+b+"?";res=a+b;}
    else if(ti===1){a=entre(r,30,99);b=entre(r,11,a-5);t="¿Cuánto es "+a+" − "+b+"?";res=a-b;}
    else{a=entre(r,2,9);b=entre(r,2,9);t="¿Cuánto es "+a+" × "+b+"?";res=a*b;extra=[a*(b+1),a*(b-1)];}
  }else if(nivel===2){
    var t2=entre(r,0,4);
    if(t2===0){a=entre(r,120,899);b=entre(r,45,299);t="¿Cuánto es "+a+" + "+b+"?";res=a+b;}
    else if(t2===1){a=entre(r,6,12);b=entre(r,6,12);t="¿Cuánto es "+a+" × "+b+"?";res=a*b;extra=[a*(b+1),(a-1)*b];}
    else if(t2===2){b=entre(r,3,9);res=entre(r,4,15);a=b*res;t="¿Cuánto es "+a+" ÷ "+b+"?";}
    else if(t2===3){p=uno(r,[10,20,25,50]);b=entre(r,2,20)*20;res=b*p/100;t="¿Cuánto es el "+p+" % de "+b+"?";}
    else{a=entre(r,2,9);b=entre(r,3,12);res=a+4*b;t="¿Qué número sigue? "+[a,a+b,a+2*b,a+3*b].join(", ")+", …";extra=[res+b,res-1];}
  }else{
    var t3=entre(r,0,5);
    if(t3===0){a=entre(r,13,49);b=entre(r,3,9);t="¿Cuánto es "+a+" × "+b+"?";res=a*b;extra=[a*b+b,a*b-b,a*(b+1)];}
    else if(t3===1){a=entre(r,2,20);b=entre(r,2,9);c=entre(r,2,9);t="¿Cuánto es "+a+" + "+b+" × "+c+"?";res=a+b*c;extra=[(a+b)*c];}
    else if(t3===2){a=entre(r,11,25);
      if(r()<0.5){t="¿Cuánto es "+a+"²?";res=a*a;extra=[a*2,a*a+a];}
      else{t="¿Cuál es la raíz cuadrada de "+(a*a)+"?";res=a;extra=[a+1,a-1];}}
    else if(t3===3){p=uno(r,[15,30,35,40,75]);b=entre(r,2,12)*20;res=b*p/100;t="¿Cuánto es el "+p+" % de "+b+"?";}
    else if(t3===4){c=uno(r,[3,4,5,6,8]);a=uno(r,{3:[2],4:[3],5:[2,3,4],6:[5],8:[3,5,7]}[c]);   /* fracción ya simplificada */
      b=c*entre(r,3,15);res=b/c*a;t="¿Cuánto es "+a+"/"+c+" de "+b+"?";extra=[b/c];}
    else{a=entre(r,2,5);b=entre(r,2,3);res=a*Math.pow(b,4);t="¿Qué número sigue? "+[a,a*b,a*b*b,a*b*b*b].join(", ")+", …";extra=[a*b*b*b+a*b*b,res+a];}
  }
  var op=opciones(String(res),distractores(res,r,extra).map(String),r);
  return {cat:"mat",nivel:nivel,q:t,o:op.o,c:op.c};
}

/* ---------- la secuencia de un jugador ----------
   Siempre la misma para la misma semilla, así el servidor no tiene que
   guardarla: la regenera en cada petición. Sin preguntas repetidas; una
   de cada cuatro es de cálculo si el concurso lo incluye.
   dificultad: 1 fácil · 2 medio · 3 difícil · 4 progresiva */
function nivelEn(dif,i,r){
  if(dif===1)return 1;
  if(dif===2)return r()<0.7?2:1;
  if(dif===3)return r()<0.7?3:2;
  return i<8?1:i<18?2:3;
}
export function secuencia(seed,dif,conMates,n){
  var BANCO=BANCO_V1, r=rng(seed), pool={1:[],2:[],3:[]}, ptr={1:0,2:0,3:0}, out=[], i;
  BANCO.forEach(function(q,j){pool[q[0]].push(j);});
  baraja(pool[1],r); baraja(pool[2],r); baraja(pool[3],r);
  for(i=0;i<n;i++){
    var l=nivelEn(dif,i,r), q=null;
    if(!(conMates&&i%4===3)){
      var orden=l===1?[1,2,3]:l===2?[2,1,3]:[3,2,1];
      for(var k=0;k<3&&!q;k++){
        var lv=orden[k];
        if(ptr[lv]<pool[lv].length){
          var b=BANCO[pool[lv][ptr[lv]++]], op=opciones(b[3],b.slice(4),r);
          q={cat:b[1],nivel:b[0],q:b[2],o:op.o,c:op.c};
        }
      }
    }
    out.push(q||matematica(l,r));
  }
  return out;
}

/* ---------- secuencia desde un banco propio ----------
   pool: preguntas congeladas al crear el cuestionario, [{id,q,opts,answer,level,topic}].
   Cada jugador recibe n al azar, sin repetir, con las opciones barajadas;
   en dificultad progresiva se ordenan de fácil a difícil. */
export function secuenciaPool(seed,pool,n,progresiva){
  var r=rng(seed), idx=baraja(pool.map(function(_,i){return i;}),r).slice(0,Math.min(n,pool.length));
  if(progresiva)idx.sort(function(a,b){return (pool[a].level||2)-(pool[b].level||2);});
  return idx.map(function(i){
    var p=pool[i], t=p.tipo||"opcion";
    /* numérica y texto libre no tienen opciones; verdadero/falso mantiene su orden */
    if(t==="numerica"||t==="abierta")return {id:p.id,tema:p.topic||"",nivel:p.level||2,q:p.q,o:[],c:-1,tipo:t,num:p.num||null,
      modelo:t==="abierta"?(p.opts[0]||""):"",img:p.img||null,oimg:null,des:p.des||""};
    var orden=t==="vf"?[0,1]:baraja(p.opts.map(function(_,k){return k;}),r);
    var out={id:p.id,tema:p.topic||"",nivel:p.level||2,q:p.q,o:orden.map(function(k){return p.opts[k];}),c:orden.indexOf(p.answer)};
    if(p.tipo){out.tipo=t;out.img=p.img||null;out.oimg=p.oimg?orden.map(function(k){return p.oimg[k]||null;}):null;out.des=p.des||"";}
    return out;
  });
}

/* ===========================================================
   Secuencias con áreas temáticas y sin repetir lo ya visto
   Cada pregunta tiene un identificador estable (derivado del texto).
   Una secuencia se describe con fichas: "q<id>" para una pregunta del
   banco y "m<nivel>" para una operación. Las fichas se guardan (en los
   concursos, al empezar cada participante), y la pregunta concreta, con
   sus opciones barajadas, se regenera siempre igual desde la semilla.
   =========================================================== */
export function qid(b){return semilla(b[2]).toString(36);}
var POR_ID={};
BANCO.forEach(function(b){POR_ID[qid(b)]=b;});
export var AREAS=Object.keys(CATEGORIAS).filter(function(k){return k!=="mat";});
/* preguntas por área (para mostrar cuántas hay al elegir) */
export function cuentaAreas(){
  var n={}; AREAS.forEach(function(k){n[k]=0;}); BANCO.forEach(function(b){if(n[b[1]]!=null)n[b[1]]++;});
  return AREAS.map(function(k){return {id:k,nombre:CATEGORIAS[k],n:n[k]};});
}
export function limpiaAreas(a){
  if(!Array.isArray(a))return [];
  var out=[]; a.forEach(function(x){x=String(x); if(AREAS.indexOf(x)>=0&&out.indexOf(x)<0)out.push(x);});
  return out.length===AREAS.length?[]:out;             /* todas = sin filtro */
}
/* cuántas preguntas del banco hacen falta y cuántas hay en esas áreas */
export function hacenFalta(n,conMates){var k=0;for(var i=0;i<n;i++)if(!(conMates&&i%4===3))k++;return k;}
export function disponibles(areas){
  if(!areas||!areas.length)return BANCO.length;
  return BANCO.filter(function(b){return areas.indexOf(b[1])>=0;}).length;
}
/* opts: {areas:[…], evita:[qid…] de la más antigua a la más reciente} */
export function fichas(seed,dif,conMates,n,opts){
  opts=opts||{};
  var r=rng(seed), areas=opts.areas&&opts.areas.length?opts.areas:null, visto={}, out=[], i, lv;
  (opts.evita||[]).forEach(function(id,k){visto[id]=k+1;});
  var nuevas={1:[],2:[],3:[]}, vistas={1:[],2:[],3:[]}, ptr={1:0,2:0,3:0}, ptrV={1:0,2:0,3:0};
  BANCO.forEach(function(b){
    if(areas&&areas.indexOf(b[1])<0)return;
    var id=qid(b); (visto[id]?vistas:nuevas)[b[0]].push(id);
  });
  for(lv=1;lv<=3;lv++){
    baraja(nuevas[lv],r);
    vistas[lv].sort(function(a,b){return visto[a]-visto[b];});   /* si no queda otra, las vistas hace más tiempo */
  }
  for(i=0;i<n;i++){
    var l=nivelEn(dif,i,r), f=null;
    if(!(conMates&&i%4===3)){
      var orden=l===1?[1,2,3]:l===2?[2,1,3]:[3,2,1];
      for(var k=0;k<3&&!f;k++){lv=orden[k]; if(ptr[lv]<nuevas[lv].length)f="q"+nuevas[lv][ptr[lv]++];}
      for(k=0;k<3&&!f;k++){lv=orden[k]; if(ptrV[lv]<vistas[lv].length)f="q"+vistas[lv][ptrV[lv]++];}
    }
    out.push(f||("m"+l));
  }
  return out;
}
/* de fichas a preguntas: cada una con su propio azar, estable */
export function materializa(seed,lista){
  return lista.map(function(f,i){
    var r=rng(semilla(seed+":"+i));
    if(f.charAt(0)==="q"){
      var b=POR_ID[f.slice(1)];
      if(b){var op=opciones(b[3],b.slice(4,7),r); return {id:f.slice(1),cat:b[1],nivel:b[0],q:b[2],o:op.o,c:op.c,dato:b[7]||""};}
      f="m2";                                            /* pregunta retirada del banco: una operación en su lugar */
    }
    return matematica(+f.slice(1)||2,r);
  });
}
