import { Exercise, MuscleGroup, EquipmentType, Workout, WeeklyScheduleDay, PersonalRecord } from '../types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Pernas',
  'Glúteos',
  'Abdômen',
  'Panturrilhas',
  'Cardio',
  'Corpo inteiro'
];

export const EQUIPMENT_LIST: EquipmentType[] = [
  'Halteres',
  'Barra',
  'Máquinas',
  'Cabos',
  'Peso corporal',
  'Kettlebell',
  'Elásticos',
  'Cardio/Esteira'
];

export const SEED_EXERCISES: Exercise[] = [
  {
    id: 'ex-supino-reto',
    name: 'Supino Reto com Barra',
    primaryMuscle: 'Peito',
    secondaryMuscles: ['Tríceps', 'Ombros'],
    equipment: 'Barra',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Deite-se no banco reto com os olhos diretamente sob a barra. Pés firmes no chão, escápulas retraídas e glúteos em contato com o estofado.',
    movement: 'Segure a barra com pegada ligeiramente mais larga que os ombros. Destrave e desça a barra de forma controlada até tocar suavemente a linha média do peitoral, empurrando em seguida até a extensão dos braços sem travar bruscamente os cotovelos.',
    breathing: 'Inspire profundamente durante a descida (fase excêntrica) e expire com força ao empurrar a barra para cima (fase concêntrica).',
    executionSteps: [
      'Retraia e deprima as escápulas criando uma base sólida no banco.',
      'Mantenha os cotovelos a aproximadamente 45 a 70 graus do tronco.',
      'Desça a barra controladamente em 2 a 3 segundos até o meio do peito.',
      'Empurre o peso de forma explosiva contraindo o peitoral.'
    ],
    commonMistakes: [
      'Bater a barra com força no peito para pegar impulso.',
      'Abrir os cotovelos em 90 graus, sobrecarregando os ombros.',
      'Tirar a lombar ou os glúteos do banco durante a fase de subida.',
      'Tirar os calcanhares do chão.'
    ],
    executionTips: [
      'Imagine que você está tentando "dobrar" a barra para fora com as mãos para ativar os dorsais e estabilizar o ombro.',
      'Use sempre presilhas de segurança nas anilhas.'
    ],
    recommendedSets: 4,
    recommendedReps: '8-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-supino-inclinado-halter',
    name: 'Supino Inclinado com Halteres',
    primaryMuscle: 'Peito',
    secondaryMuscles: ['Ombros', 'Tríceps'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Banco inclinado a 30° ou 45°. Sente-se segurando os halteres apoiados nas coxas e deite-se impulsionando os pesos para o alto.',
    movement: 'Desça os halteres alinhados à porção superior do peito abrindo os braços em arco controlado. Empurre para cima até se aproximarem no topo.',
    breathing: 'Inspire na descida e solte o ar na subida.',
    executionSteps: [
      'Ajuste o banco em inclinação de 30° a 45°.',
      'Mantenha as escápulas unidas durante todo o exercício.',
      'Desça até sentir um bom alongamento no feixe clavicular do peitoral.',
      'Concentre a força no peito superior ao empurrar.'
    ],
    commonMistakes: [
      'Inclinação excessiva do banco (>60°), transformando o movimento em treino de ombro.',
      'Bater os halteres com força no topo do movimento.'
    ],
    executionTips: [
      'Manter os pulsos neutros e firmes para evitar dores articulares.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },
  {
    id: 'ex-crossover-polia',
    name: 'Crossover na Polia Média/Alta',
    primaryMuscle: 'Peito',
    secondaryMuscles: ['Ombros'],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé no meio da estação de cabos, um pé à frente para estabilidade, tronco levemente inclinado para frente.',
    movement: 'Com cotovelos semiflexionados, puxe as manoplas para frente e para baixo em arco amplo até as mãos quase se tocarem à frente do abdômen.',
    breathing: 'Inspire ao abrir os braços e expire ao apertar as mãos à frente.',
    executionSteps: [
      'Mantenha uma leve flexão fixa nos cotovelos durante todo o trajeto.',
      'Esmague o peitoral por 1 segundo no ponto de contração máxima.',
      'Retorne de forma lenta e resistida.'
    ],
    commonMistakes: [
      'Transformar o movimento em um supino flexionando e estendendo os braços.',
      'Balançar o tronco para gerar inércia.'
    ],
    executionTips: [
      'Mantenha os ombros abaixados e o abdômen contraído.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-puxada-frontal',
    name: 'Puxada Frontal Aberta (Pulley)',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Bíceps', 'Ombros'],
    equipment: 'Máquinas',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado na máquina com os joelhos travados no apoio acolchoado. Segure a barra com pegada pronada mais larga que a largura dos ombros.',
    movement: 'Inicie puxando as escápulas para baixo e para trás, trazendo a barra em direção à parte superior do peito enquanto abre o peitoral.',
    breathing: 'Expire ao puxar a barra até o peito e inspire enquanto os braços sobem de volta.',
    executionSteps: [
      'Estabilize a bacia e os pés firmes no chão.',
      'Inicie a tração pelas costas (depressão escapular), não dobrando os cotovelos primeiro.',
      'Traga a barra até a fúrcula esternal.',
      'Alongue totalmente os dorsais no topo de cada repetição.'
    ],
    commonMistakes: [
      'Inclinar excessivamente o tronco para trás virando quase uma remada.',
      'Puxar a barra por trás do pescoço (risco desnecessário para o manguito).',
      'Soltar a barra subitamente no topo.'
    ],
    executionTips: [
      'Pense em puxar apontando os cotovelos para os bolsos da bermuda.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },
  {
    id: 'ex-remada-curvada',
    name: 'Remada Curvada com Barra',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Bíceps', 'Ombros', 'Pernas'],
    equipment: 'Barra',
    level: 'Avançado',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Pés na largura do quadril, joelhos levemente destravados. Incline o tronco para frente a cerca de 45° mantendo a coluna neutra e firme.',
    movement: 'Puxe a barra em linha reta em direção ao umbigo, comprimindo as escápulas no topo antes de descer controladamente.',
    breathing: 'Expire ao puxar a barra para o umbigo e inspire ao descer.',
    executionSteps: [
      'Ative fortemente o abdômen e lombar para proteger a coluna.',
      'Segure a barra com pegada pronada ou supinada.',
      'Conduza os cotovelos rentes ao tronco.',
      'Segure 1 segundo no topo sentindo os dorsais e romboides.'
    ],
    commonMistakes: [
      'Curvar as costas (arredondamento lombar perigoso).',
      'Usar impulso das pernas saltitando no movimento.'
    ],
    executionTips: [
      'Se sentir a lombar cansada, apoie a cabeça num banco ou opte pela remada cavalinho.'
    ],
    recommendedSets: 4,
    recommendedReps: '8-10',
    recommendedRestSec: 90
  },
  {
    id: 'ex-desenvolvimento-halteres',
    name: 'Desenvolvimento de Ombros com Halteres',
    primaryMuscle: 'Ombros',
    secondaryMuscles: ['Tríceps'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado em banco com encosto reto vertical ou levemente inclinado (80°). Halteres na altura dos ombros, palmas viradas para frente.',
    movement: 'Empurre os halteres para cima em linha vertical até quase estender os cotovelos no topo. Desça até os halteres atingirem a altura das orelhas.',
    breathing: 'Expire na subida da carga e inspire ao descer.',
    executionSteps: [
      'Mantenha as costas e a lombar bem apoiadas no encosto.',
      'Cotovelos levemente à frente da linha do tronco (plano escapular).',
      'Desça de forma lenta sentindo os deltoides.'
    ],
    commonMistakes: [
      'Arquear excessivamente a coluna lombar.',
      'Bater os halteres em cima.'
    ],
    executionTips: [
      'Mantenha os antebraços sempre perpendiculares ao chão.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },
  {
    id: 'ex-elevacao-lateral',
    name: 'Elevação Lateral com Halteres',
    primaryMuscle: 'Ombros',
    secondaryMuscles: [],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé, pés na largura dos ombros, halteres ao lado das coxas com leve flexão nos joelhos e cotovelos.',
    movement: 'Eleve os braços lateralmente até a altura dos ombros, liderando o movimento pelos cotovelos. Desça em velocidade controlada.',
    breathing: 'Solte o ar na elevação e puxe o ar ao abaixar os braços.',
    executionSteps: [
      'Mantenha os cotovelos ligeiramente flexionados.',
      'Eleve até que os cotovelos atinjam a linha dos ombros.',
      'Não eleve acima da linha dos ombros para não pinçar tendões.'
    ],
    commonMistakes: [
      'Dar tranco com o corpo para levantar o peso.',
      'Encolher os ombros ativando o trapézio em vez do deltoide lateral.'
    ],
    executionTips: [
      'Pense em empurrar as paredes ao lado em vez de apenas levantar os pesos.'
    ],
    recommendedSets: 4,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-rosca-direta',
    name: 'Rosca Direta com Barra W',
    primaryMuscle: 'Bíceps',
    secondaryMuscles: [],
    equipment: 'Barra',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé com a postura ereta, abdômen firme. Segure a barra W na largura dos ombros com pegada supinada.',
    movement: 'Flexione os cotovelos erguendo a barra em direção aos ombros sem projetar os cotovelos para frente. Desça controlando até a quase extensão.',
    breathing: 'Expire ao flexionar os cotovelos e inspire na descida.',
    executionSteps: [
      'Fixe os cotovelos ao lado das costelas.',
      'Não movimente o quadril ou balance as costas.',
      'Faça contração de pico no topo apertando o bíceps.'
    ],
    commonMistakes: [
      'Balançar o tronco para impulsionar a carga.',
      'Descolar os cotovelos para frente no final da subida.'
    ],
    executionTips: [
      'A barra W alivia a tensão e a sobrecarga nos punhos em comparação com a barra reta.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 60
  },
  {
    id: 'ex-rosca-martelo',
    name: 'Rosca Martelo com Halteres',
    primaryMuscle: 'Bíceps',
    secondaryMuscles: ['Ombros'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé ou sentado, halteres ao lado do corpo com as palmas voltadas uma para a outra (pegada neutra).',
    movement: 'Flexione os cotovelos elevando os halteres mantendo as palmas sempre frente a frente. Desça suavemente.',
    breathing: 'Expire na subida e inspire na descida.',
    executionSteps: [
      'Mantenha os ombros para trás e o peito estufado.',
      'Foco no braquial e braquiorradial (antebraço).'
    ],
    commonMistakes: [
      'Girar o punho no meio do trajeto perdendo a pegada neutra.'
    ],
    executionTips: [
      'Pode ser feito de forma simultânea ou alternada.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-triceps-corda',
    name: 'Tríceps Corda na Polia Alta',
    primaryMuscle: 'Tríceps',
    secondaryMuscles: [],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Posicione-se de frente para a polia alta com corda. Incline o tronco ligeiramente para frente, cotovelos colados às costelas.',
    movement: 'Estenda os braços para baixo até o travamento suave dos cotovelos, abrindo as pontas da corda no final para maior contração do tríceps.',
    breathing: 'Solte o ar na extensão e inspire ao retornar à posição de 90°.',
    executionSteps: [
      'Mantenha os cotovelos como eixos fixos estáticos.',
      'Abra as mãos no final do curso forçando a cabeça lateral do tríceps.',
      'Volte devagar até formar 90 graus nos cotovelos.'
    ],
    commonMistakes: [
      'Subir as mãos até o queixo e mover os cotovelos para frente e para trás.',
      'Usar o peso do corpo para empurrar a corda.'
    ],
    executionTips: [
      'Segure 1 segundo na contração máxima de cada repetição.'
    ],
    recommendedSets: 4,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-triceps-testa',
    name: 'Tríceps Testa com Barra W',
    primaryMuscle: 'Tríceps',
    secondaryMuscles: [],
    equipment: 'Barra',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Deitado em banco reto, barra segurada acima do peito com braços verticais ou levemente inclinados para trás da cabeça.',
    movement: 'Flexione apenas os antebraços descendo a barra em direção ao topo da testa ou logo atrás da cabeça. Estenda os braços voltando ao topo.',
    breathing: 'Inspire ao descer a barra e expire ao empurrar.',
    executionSteps: [
      'Mantenha os cotovelos apontados para o teto e paralelos.',
      'Não permita que os cotovelos abram para os lados.',
      'Extensão completa sem desencaixar as escápulas.'
    ],
    commonMistakes: [
      'Abrir os cotovelos excessivamente durante a descida.',
      'Bater a barra na cabeça por falta de controle de carga.'
    ],
    executionTips: [
      'Manter os braços ligeiramente inclinados para trás em vez de 90° mantém a tensão no tríceps mesmo no topo.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },
  {
    id: 'ex-agachamento-livre',
    name: 'Agachamento Livre com Barra',
    primaryMuscle: 'Pernas',
    secondaryMuscles: ['Glúteos', 'Abdômen'],
    equipment: 'Barra',
    level: 'Avançado',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Barra apoiada no trapézio superior (high bar) ou nos deltoides posteriores (low bar). Pés na largura dos ombros com pontas ligeiramente apontadas para fora.',
    movement: 'Inicie flexionando os quadris e joelhos simultaneamente, descendo até as coxas quebrarem a linha paralela ao chão. Empurre pelo centro dos pés para subir.',
    breathing: 'Inspire e trave a respiração diafragmática (manobra de Valsalva) na descida; expire após passar o ponto de maior esforço na subida.',
    executionSteps: [
      'Mantenha o peito aberto e o olhar à frente.',
      'Joelhos devem seguir sempre a direção das pontas dos pés.',
      'Distribua a pressão em três pontos do pé: dedão, dedinho e calcanhar.',
      'Mantenha a coluna neutra sem arredondar a lombar na base.'
    ],
    commonMistakes: [
      'Colapso em valgo (joelhos caindo para dentro).',
      'Arredondamento da lombar no fundo (butt wink).',
      'Elevar os calcanhares do solo durante o agachamento.'
    ],
    executionTips: [
      'Trabalhe a mobilidade de tornozelo e quadril antes de aumentar a carga.'
    ],
    recommendedSets: 4,
    recommendedReps: '6-10',
    recommendedRestSec: 120
  },
  {
    id: 'ex-leg-press-45',
    name: 'Leg Press 45º',
    primaryMuscle: 'Pernas',
    secondaryMuscles: ['Glúteos'],
    equipment: 'Máquinas',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado com as costas e lombar totalmente coladas no encosto. Pés posicionados na plataforma na largura dos ombros.',
    movement: 'Destrave a máquina e desça a plataforma flexionando os joelhos até cerca de 90°. Empurre a plataforma com os calcanhares sem travar os joelhos no final.',
    breathing: 'Inspire ao descer a plataforma e expire ao empurrar.',
    executionSteps: [
      'Nunca descole o quadril do assento na descida máxima.',
      'Mantenha os joelhos alinhados com os pés.',
      'Segure firme nas manoplas de apoio para manter o tronco travado.'
    ],
    commonMistakes: [
      'Hiperextender os joelhos ("travar as pernas") com muita carga no topo.',
      'Tirar a lombar do encosto colocando carga perigosa na coluna.'
    ],
    executionTips: [
      'Posição dos pés mais alta na plataforma foca mais em glúteos e posteriores; mais baixa enfatiza quadríceps.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-cadeira-extensora',
    name: 'Cadeira Extensora',
    primaryMuscle: 'Pernas',
    secondaryMuscles: [],
    equipment: 'Máquinas',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado com as costas no encosto e o rolo almofadado ajustado sobre a linha dos tornozelos.',
    movement: 'Estenda as pernas para cima contraindo os quadríceps. Segure 1 segundo no topo e desça lentamente até quase a posição inicial.',
    breathing: 'Expire na subida e inspire ao descer a carga.',
    executionSteps: [
      'Ajuste o eixo da máquina para coincidir exatamente com a articulação do joelho.',
      'Mantenha as pontas dos pés apontadas para cima.',
      'Não deixe o peso bater entre as repetições.'
    ],
    commonMistakes: [
      'Dar tranco rápido sem controle da fase negativa.',
      'Descolar as nádegas do assento puxando o corpo.'
    ],
    executionTips: [
      'Excelente para pré-exaustão ou finalizador metabólico de pernas.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-elevacao-pelvica',
    name: 'Elevação Pélvica com Barra',
    primaryMuscle: 'Glúteos',
    secondaryMuscles: ['Pernas'],
    equipment: 'Barra',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Escápulas apoiadas na borda de um banco estofado estável. Barra com almofada protetora sobre o quadril, pés firmes no chão.',
    movement: 'Empurre o quadril para cima com os calcanhares até formar uma linha reta entre os joelhos, quadril e ombros. Segure e contraia os glúteos.',
    breathing: 'Expire ao subir e contrair os glúteos; inspire ao descer o quadril.',
    executionSteps: [
      'Mantenha o queixo ligeiramente recolhido olhando para frente, não para o teto.',
      'Aperte os glúteos no ponto mais alto por 2 segundos.',
      'Desça até quase tocar o chão antes da próxima repetição.'
    ],
    commonMistakes: [
      'Hiperextender a coluna lombar no topo em vez de usar o quadril.',
      'Colocar os pés muito longe ou muito perto, mudando o foco muscular.'
    ],
    executionTips: [
      'No ponto alto, os joelhos devem formar um ângulo de 90° em relação às canelas.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-elevacao-panturrilha',
    name: 'Elevação de Panturrilha em Pé',
    primaryMuscle: 'Panturrilhas',
    secondaryMuscles: [],
    equipment: 'Máquinas',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Pontas dos pés apoiadas na borda de um degrau ou máquina, calcanhares livres no ar. Joelhos praticamente estendidos.',
    movement: 'Desça os calcanhares ao máximo sentindo alongamento profundo na panturrilha. Suba o mais alto possível na ponta dos pés.',
    breathing: 'Expire na subida e inspire no alongamento para baixo.',
    executionSteps: [
      'Segure 2 segundos no ponto mais baixo para eliminar a energia elástica do tendão de Aquiles.',
      'Eleve com força máxima e pause 1 segundo no topo.',
      'Mantenha o ritmo lento e metódico.'
    ],
    commonMistakes: [
      'Ficar quicando rapidamente aproveitando o rebote do tendão.',
      'Dobrar e esticar os joelhos usando impulso das coxas.'
    ],
    executionTips: [
      'Panturrilhas respondem incrivelmente bem a pausas de alongamento no ponto baixo.'
    ],
    recommendedSets: 4,
    recommendedReps: '15-20',
    recommendedRestSec: 45
  },
  {
    id: 'ex-prancha-isometrica',
    name: 'Prancha Abdominal Isométrica',
    primaryMuscle: 'Abdômen',
    secondaryMuscles: ['Ombros', 'Glúteos'],
    equipment: 'Peso corporal',
    level: 'Iniciante',
    type: 'Resistência',
    imageUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Deitado de bruços, apoie os antebraços e as pontas dos pés no solo. Cotovelos alinhados sob os ombros.',
    movement: 'Mantenha o corpo em linha reta e estática, ativando forte abdômen, glúteos e pernas sem deixar a lombar cair.',
    breathing: 'Mantenha respiração constante e suave pelo nariz, sem prender o ar.',
    executionSteps: [
      'Encolha o umbigo em direção à coluna.',
      'Aperte os glúteos e contraia os quadríceps.',
      'Mantenha a cabeça neutra alinhada com a coluna.'
    ],
    commonMistakes: [
      'Deixar o quadril despencar arqueando a lombar.',
      'Elevar o bumbum como uma tenda aliviando o abdômen.'
    ],
    executionTips: [
      'Foque em tempo sob máxima tensão: 30 a 60 segundos com perfeição valem mais que 3 minutos relaxados.'
    ],
    recommendedSets: 3,
    recommendedReps: '45 seg',
    recommendedRestSec: 45
  },
  {
    id: 'ex-esteira-hiit',
    name: 'Corrida Intervalada (HIIT na Esteira)',
    primaryMuscle: 'Cardio',
    secondaryMuscles: ['Pernas', 'Panturrilhas'],
    equipment: 'Cardio/Esteira',
    level: 'Intermediário',
    type: 'Cardio',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Aquecimento de 3 minutos em caminhada rápida a 5.5 km/h.',
    movement: 'Alterne 45 segundos de corrida em alta velocidade (11-14 km/h) com 45 segundos de caminhada moderada para recuperação (5-6 km/h).',
    breathing: 'Respiração rítmica cadenciada com a passada.',
    executionSteps: [
      'Aqueça bem as articulações antes de iniciar os tiros.',
      'Mantenha a postura ereta e os braços em 90 graus balançando paralelamente.',
      'Pise com o médio-pé, evitando pisada forte no calcanhar.'
    ],
    commonMistakes: [
      'Segurar no painel da esteira durante os tiros rápidos.',
      'Parar bruscamente a esteira sem volta à calma.'
    ],
    executionTips: [
      'Excelente para elevar o VO2 máx e acelerar a queima calórica pós-treino (EPOC).'
    ],
    recommendedSets: 1,
    recommendedReps: '20 min',
    recommendedRestSec: 60
  },
  {
    id: 'ex-burpee-funcional',
    name: 'Burpee Completo com Salto',
    primaryMuscle: 'Corpo inteiro',
    secondaryMuscles: ['Peito', 'Pernas', 'Ombros', 'Abdômen'],
    equipment: 'Peso corporal',
    level: 'Intermediário',
    type: 'Resistência',
    imageUrl: 'https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé, pés na largura dos ombros e braços ao lado do corpo.',
    movement: 'Agache e apoie as mãos no chão. Salte com as pernas para trás caindo em prancha, realize uma flexão tocando o peito no solo. Empurre, puxe os pés de volta e salte alto com os braços estendidos.',
    breathing: 'Inspire ao descer e expire forte ao saltar.',
    executionSteps: [
      'Movimento contínuo e fluido com aterrisagem suave amortecendo nos joelhos.',
      'Mantenha o core rígido durante a flexão no solo.'
    ],
    commonMistakes: [
      'Deixar a lombar desabar na posição de prancha.',
      'Aterrissar com os joelhos travados esticados.'
    ],
    executionTips: [
      'Comece no seu ritmo e aumente a cadência conforme ganha condicionamento.'
    ],
    recommendedSets: 4,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  }
];

export const DEFAULT_WORKOUTS: Workout[] = [
  {
    id: 'workout-a-peito-triceps',
    userId: 'default-user',
    title: 'Treino A — Peito e Tríceps',
    description: 'Foco em hipertrofia de peitorais com finalização em tríceps.',
    category: 'Hipertrofia',
    estimatedDurationMin: 50,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    exercises: [
      {
        id: 'we-1',
        exerciseId: 'ex-supino-reto',
        exerciseName: 'Supino Reto com Barra',
        sets: 4,
        reps: 10,
        loadKg: 60,
        restTimeSec: 90,
        notes: 'Aquecer com barra vazia antes da primeira série.',
        order: 0
      },
      {
        id: 'we-2',
        exerciseId: 'ex-supino-inclinado-halter',
        exerciseName: 'Supino Inclinado com Halteres',
        sets: 4,
        reps: 12,
        loadKg: 22,
        restTimeSec: 75,
        notes: 'Atenção ao feixe clavicular e cadência controlada.',
        order: 1
      },
      {
        id: 'we-3',
        exerciseId: 'ex-crossover-polia',
        exerciseName: 'Crossover na Polia Média/Alta',
        sets: 3,
        reps: 15,
        loadKg: 15,
        restTimeSec: 60,
        notes: 'Contração de 1 segundo no pico do movimento.',
        order: 2
      },
      {
        id: 'we-4',
        exerciseId: 'ex-triceps-corda',
        exerciseName: 'Tríceps Corda na Polia Alta',
        sets: 4,
        reps: 12,
        loadKg: 25,
        restTimeSec: 60,
        notes: 'Abrir bem as cordas na finalização.',
        order: 3
      },
      {
        id: 'we-5',
        exerciseId: 'ex-triceps-testa',
        exerciseName: 'Tríceps Testa com Barra W',
        sets: 3,
        reps: 10,
        loadKg: 20,
        restTimeSec: 75,
        notes: 'Cotovelos estáveis e paralelos.',
        order: 4
      }
    ]
  },
  {
    id: 'workout-b-costas-biceps',
    userId: 'default-user',
    title: 'Treino B — Costas e Bíceps',
    description: 'Densidade e largura dorsal associada a braquiais e bíceps.',
    category: 'Hipertrofia',
    estimatedDurationMin: 50,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    exercises: [
      {
        id: 'we-6',
        exerciseId: 'ex-puxada-frontal',
        exerciseName: 'Puxada Frontal Aberta (Pulley)',
        sets: 4,
        reps: 12,
        loadKg: 55,
        restTimeSec: 75,
        notes: 'Alongamento total no topo.',
        order: 0
      },
      {
        id: 'we-7',
        exerciseId: 'ex-remada-curvada',
        exerciseName: 'Remada Curvada com Barra',
        sets: 4,
        reps: 8,
        loadKg: 50,
        restTimeSec: 90,
        notes: 'Travar o abdômen e focar na retração escapular.',
        order: 1
      },
      {
        id: 'we-8',
        exerciseId: 'ex-rosca-direta',
        exerciseName: 'Rosca Direta com Barra W',
        sets: 3,
        reps: 10,
        loadKg: 24,
        restTimeSec: 60,
        notes: 'Sem balançar o quadril.',
        order: 2
      },
      {
        id: 'we-9',
        exerciseId: 'ex-rosca-martelo',
        exerciseName: 'Rosca Martelo com Halteres',
        sets: 3,
        reps: 12,
        loadKg: 14,
        restTimeSec: 60,
        notes: 'Pegada neutra e firme.',
        order: 3
      }
    ]
  },
  {
    id: 'workout-c-pernas-panturrilhas',
    userId: 'default-user',
    title: 'Treino C — Pernas e Glúteos',
    description: 'Quadríceps, posteriores, glúteos e panturrilhas completos.',
    category: 'Força & Hipertrofia',
    estimatedDurationMin: 60,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    exercises: [
      {
        id: 'we-10',
        exerciseId: 'ex-agachamento-livre',
        exerciseName: 'Agachamento Livre com Barra',
        sets: 4,
        reps: 8,
        loadKg: 80,
        restTimeSec: 120,
        notes: 'Descer quebrando o paralelo se a mobilidade permitir.',
        order: 0
      },
      {
        id: 'we-11',
        exerciseId: 'ex-leg-press-45',
        exerciseName: 'Leg Press 45º',
        sets: 4,
        reps: 12,
        loadKg: 160,
        restTimeSec: 90,
        notes: 'Não travar as articulações no topo.',
        order: 1
      },
      {
        id: 'we-12',
        exerciseId: 'ex-cadeira-extensora',
        exerciseName: 'Cadeira Extensora',
        sets: 3,
        reps: 15,
        loadKg: 45,
        restTimeSec: 60,
        notes: 'Isometria de 1s no topo.',
        order: 2
      },
      {
        id: 'we-13',
        exerciseId: 'ex-elevacao-pelvica',
        exerciseName: 'Elevação Pélvica com Barra',
        sets: 4,
        reps: 12,
        loadKg: 70,
        restTimeSec: 90,
        notes: 'Aperto máximo nos glúteos.',
        order: 3
      },
      {
        id: 'we-14',
        exerciseId: 'ex-elevacao-panturrilha',
        exerciseName: 'Elevação de Panturrilha em Pé',
        sets: 4,
        reps: 15,
        loadKg: 50,
        restTimeSec: 45,
        notes: 'Pausa no ponto mais baixo para eliminar rebote.',
        order: 4
      }
    ]
  },
  {
    id: 'workout-d-ombros-abdomen',
    userId: 'default-user',
    title: 'Treino D — Ombros e Abdômen',
    description: 'Deltoides 3D e fortalecimento do core.',
    category: 'Hipertrofia',
    estimatedDurationMin: 45,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    exercises: [
      {
        id: 'we-15',
        exerciseId: 'ex-desenvolvimento-halteres',
        exerciseName: 'Desenvolvimento de Ombros com Halteres',
        sets: 4,
        reps: 10,
        loadKg: 18,
        restTimeSec: 75,
        notes: 'Movimento vertical com postura firme.',
        order: 0
      },
      {
        id: 'we-16',
        exerciseId: 'ex-elevacao-lateral',
        exerciseName: 'Elevação Lateral com Halteres',
        sets: 4,
        reps: 14,
        loadKg: 10,
        restTimeSec: 60,
        notes: 'Cotovelos guiando o movimento.',
        order: 1
      },
      {
        id: 'we-17',
        exerciseId: 'ex-prancha-isometrica',
        exerciseName: 'Prancha Abdominal Isométrica',
        sets: 3,
        reps: 45,
        loadKg: 0,
        restTimeSec: 45,
        notes: 'Tempo: 45 segundos por série.',
        order: 2
      }
    ]
  },
  {
    id: 'workout-e-cardio',
    userId: 'default-user',
    title: 'Treino E — Cardio & Condicionamento',
    description: 'Queima calórica intensa e resistência cardiovascular.',
    category: 'Cardio',
    estimatedDurationMin: 35,
    createdAt: '2026-03-01T10:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
    exercises: [
      {
        id: 'we-18',
        exerciseId: 'ex-esteira-hiit',
        exerciseName: 'Corrida Intervalada (HIIT na Esteira)',
        sets: 1,
        reps: 20,
        loadKg: 0,
        restTimeSec: 60,
        notes: '20 minutos totais intercalando tiros.',
        order: 0
      },
      {
        id: 'we-19',
        exerciseId: 'ex-burpee-funcional',
        exerciseName: 'Burpee Completo com Salto',
        sets: 4,
        reps: 12,
        loadKg: 0,
        restTimeSec: 60,
        notes: 'Máxima explosão e ritmo.',
        order: 1
      }
    ]
  }
];

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleDay[] = [
  { dayOfWeek: 'SEGUNDA', workoutId: 'workout-a-peito-triceps', isRest: false, notes: 'Peito + Tríceps' },
  { dayOfWeek: 'TERÇA', workoutId: 'workout-b-costas-biceps', isRest: false, notes: 'Costas + Bíceps' },
  { dayOfWeek: 'QUARTA', workoutId: null, isRest: true, notes: 'Descanso e recuperação' },
  { dayOfWeek: 'QUINTA', workoutId: 'workout-c-pernas-panturrilhas', isRest: false, notes: 'Pernas + Glúteos' },
  { dayOfWeek: 'SEXTA', workoutId: 'workout-d-ombros-abdomen', isRest: false, notes: 'Ombros + Abdômen' },
  { dayOfWeek: 'SÁBADO', workoutId: 'workout-e-cardio', isRest: false, notes: 'Cardio & Funcional' },
  { dayOfWeek: 'DOMINGO', workoutId: null, isRest: true, notes: 'Descanso' },
];

export const INITIAL_PRS: PersonalRecord[] = [
  {
    id: 'pr-1',
    userId: 'default-user',
    exerciseId: 'ex-supino-reto',
    exerciseName: 'Supino Reto com Barra',
    maxLoadKg: 60,
    repsAtMax: 10,
    achievedDate: '2026-03-08'
  },
  {
    id: 'pr-2',
    userId: 'default-user',
    exerciseId: 'ex-agachamento-livre',
    exerciseName: 'Agachamento Livre com Barra',
    maxLoadKg: 80,
    repsAtMax: 8,
    achievedDate: '2026-03-06'
  },
  {
    id: 'pr-3',
    userId: 'default-user',
    exerciseId: 'ex-rosca-direta',
    exerciseName: 'Rosca Direta com Barra W',
    maxLoadKg: 25,
    repsAtMax: 10,
    achievedDate: '2026-03-07'
  },
  {
    id: 'pr-4',
    userId: 'default-user',
    exerciseId: 'ex-leg-press-45',
    exerciseName: 'Leg Press 45º',
    maxLoadKg: 160,
    repsAtMax: 12,
    achievedDate: '2026-03-06'
  }
];
