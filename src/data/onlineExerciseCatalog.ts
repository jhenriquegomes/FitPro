import { Exercise } from '../types';
import freeExerciseDbJson from './freeExerciseDb.json';

const CURATED_ONLINE_EXERCISES: Exercise[] = [
  // --- COSTAS ---
  {
    id: 'ex-net-barra-fixa',
    name: 'Barra Fixa Pronada (Pull-Up)',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Bíceps', 'Ombros'],
    equipment: 'Peso corporal',
    level: 'Avançado',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Segure a barra com pegada pronada (palmas para frente), um pouco mais aberta que a largura dos ombros. Corpo suspenso e escápulas ativadas.',
    movement: 'Puxe o peito em direção à barra deprimindo e aduzindo as escápulas. Passe o queixo da barra e desça de forma controlada até estender os braços.',
    breathing: 'Expire durante a subida (fase de esforço) e inspire durante a descida controlada.',
    executionSteps: [
      'Ative a musculatura escapular antes de começar a flexionar os cotovelos.',
      'Puxe com o pensamento de levar os cotovelos para os bolsos de trás da calça.',
      'Evite balançar as pernas ou dar impulso (kipping).',
      'Desça de maneira suave controlando a descida por 2 a 3 segundos.'
    ],
    commonMistakes: [
      'Cruzar e balançar o quadril usando impulso para subir.',
      'Não realizar a extensão completa dos braços na fase inferior.',
      'Encolher os ombros em direção às orelhas no topo do movimento.'
    ],
    executionTips: [
      'Se não conseguir fazer repetições completas, utilize um elástico de assistência ou faça descidas excêntricas lentas.'
    ],
    recommendedSets: 4,
    recommendedReps: '6-10',
    recommendedRestSec: 120
  },
  {
    id: 'ex-net-remada-cavalinho',
    name: 'Remada Cavalinho (T-Bar Row)',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Bíceps', 'Ombros'],
    equipment: 'Barra',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Com a barra entre as pernas e o pegador triangular acoplado, flexione levemente os joelhos e incline o tronco à frente a ~45 graus mantendo a lombar neutra.',
    movement: 'Puxe a carga em direção à região inferior do abdômen, apertando as escápulas no final do movimento. Desça alongando os dorsais sem arquear a coluna.',
    breathing: 'Puxe o ar antes de começar e solte na contração máxima.',
    executionSteps: [
      'Trave o abdômen e mantenha os calcanhares bem firmes no chão.',
      'Puxe a barra levando os cotovelos para trás junto ao tronco.',
      'Segure 1 segundo no topo sentindo a contração no meio das costas.',
      'Desça controlando a carga até alongar os braços.'
    ],
    commonMistakes: [
      'Ficar quase de pé para puxar cargas além da capacidade.',
      'Arredondar a lombar colocando estresse excessivo nos discos vertebrais.'
    ],
    executionTips: [
      'Mantenha o peito sempre estufado e o queixo neutro.'
    ],
    recommendedSets: 4,
    recommendedReps: '8-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-face-pull',
    name: 'Face Pull com Corda na Polia',
    primaryMuscle: 'Ombros',
    secondaryMuscles: ['Costas'],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Ajuste a polia na altura dos olhos com a corda dupla. Dê dois passos para trás, mantenha os joelhos semi-flexionados e abdômen firme.',
    movement: 'Puxe a corda em direção ao rosto, abrindo as mãos e girando os punhos para trás (rotação externa) para que as mãos fiquem na linha das orelhas.',
    breathing: 'Expire ao puxar a corda e inspire ao retornar à posição inicial.',
    executionSteps: [
      'Segure a corda com os polegares voltados para você.',
      'Puxe em direção à testa/olhos enquanto afasta as pontas da corda.',
      'Faça uma rotação externa de ombro no final, com cotovelos altos.',
      'Pause por 1 segundo na contração máxima.'
    ],
    commonMistakes: [
      'Usar carga excessiva e balançar o corpo para trás.',
      'Manter os cotovelos baixos, transformando em remada alta.'
    ],
    executionTips: [
      'Excelente exercício para a saúde articular dos ombros e ativação do deltóide posterior e manguito rotador.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-pulldown-bracos-estendidos',
    name: 'Pulldown com Braços Estendidos (Corda/Barra)',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Tríceps', 'Abdômen'],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé em frente à polia alta, segure a barra reta ou corda com os braços quase retos e tronco levemente inclinado.',
    movement: 'Empurre a barra para baixo em arco até tocar as coxas, contraindo fortemente o grande dorsal.',
    breathing: 'Inspire no topo e expire ao descer a barra até o quadril.',
    executionSteps: [
      'Mantenha uma leve flexão nos cotovelos para proteger as articulações.',
      'Concentre a força nos lados das costas (asas).',
      'Segure 1 segundo contraindo no quadril.',
      'Retorne lentamente até o alongamento máximo acima da cabeça.'
    ],
    commonMistakes: [
      'Dobrar e estender os braços como em um tríceps na polia.',
      'Fazer força com o pescoço e trapézio superior.'
    ],
    executionTips: [
      'Pense em "esmagar laranjas" debaixo das axilas durante a descida.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },

  // --- PERNAS & GLÚTEOS ---
  {
    id: 'ex-net-agachamento-bulgaro',
    name: 'Agachamento Búlgaro com Halteres',
    primaryMuscle: 'Pernas',
    secondaryMuscles: ['Glúteos', 'Panturrilhas'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Apoie o peito de um dos pés em um banco atrás de você. Dê um passo largo à frente com a perna de apoio, segurando um halter em cada mão.',
    movement: 'Desça o quadril verticalmente até que a coxa da frente fique paralela ao chão e o joelho de trás quase toque o solo. Empurre com o calcanhar frontal.',
    breathing: 'Inspire na descida e expire ao subir com firmeza.',
    executionSteps: [
      'Mantenha o tronco com uma discreta inclinação para frente para recrutar mais glúteo e quadríceps.',
      'Distribua o peso principalmente no calcanhar da perna da frente.',
      'Desça de forma profunda e controlada.',
      'Empurre o chão de volta para a posição inicial sem travar os joelhos.'
    ],
    commonMistakes: [
      'Colocar o pé da frente muito próximo ao banco, sobrecarregando a patela.',
      'Deixar o joelho da perna de apoio colapsar para dentro (valgo dinâmico).'
    ],
    executionTips: [
      'Se estiver difícil equilibrar, faça primeiro apenas com o peso do corpo ou segurando em um apoio.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12 cada perna',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-stiff-halteres',
    name: 'Stiff Romeno com Halteres (RDL)',
    primaryMuscle: 'Pernas',
    secondaryMuscles: ['Glúteos', 'Costas'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé com pés na largura dos ombros, segure dois halteres na frente das coxas. Joelhos levemente destravados e peito estufado.',
    movement: 'Empurre o quadril para trás como se quisesse tocar a parede atrás de você, descendo os halteres rentes às pernas até sentir alongar a parte posterior da coxa.',
    breathing: 'Inspire na descida mantendo a respiração diafragmática e expire ao estender o quadril no topo.',
    executionSteps: [
      'O movimento é um giro no quadril (hinge), não agachamento.',
      'Mantenha a coluna perfeitamente alinhada e escápulas aduzidas.',
      'Desça os pesos até logo abaixo dos joelhos ou meia canela.',
      'Contraia os glúteos e isquiotibiais para retornar à posição ereta.'
    ],
    commonMistakes: [
      'Arredondar a coluna lombar na descida.',
      'Flexionar excessivamente os joelhos transformando o stiff em agachamento.'
    ],
    executionTips: [
      'Pense em afastar o quadril o máximo possível para trás enquanto a cabeça permanece neutra.'
    ],
    recommendedSets: 4,
    recommendedReps: '10-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-elevacao-pelvica',
    name: 'Elevação Pélvica com Barra (Hip Thrust)',
    primaryMuscle: 'Glúteos',
    secondaryMuscles: ['Pernas', 'Abdômen'],
    equipment: 'Barra',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sente-se no chão com as costas apoiadas em um banco na altura das escápulas. Role uma barra acolchoada sobre o quadril com pés firmes no solo.',
    movement: 'Empurre com a força dos calcanhares elevando o quadril até formar uma linha reta entre ombros, quadril e joelhos. Aperte os glúteos no topo por 1 a 2 segundos.',
    breathing: 'Inspire embaixo e solte o ar enquanto empurra a barra para cima.',
    executionSteps: [
      'Mantenha o queixo apontando para o peito durante todo o movimento.',
      'Pés afastados na largura dos ombros com pontas levemente voltadas para fora.',
      'Suba até a extensão completa do quadril sem arquear a lombar.',
      'Desça de forma controlada até quase tocar o chão.'
    ],
    commonMistakes: [
      'Hiperextender a coluna lombar em vez de contrair os glúteos.',
      'Deixar os pés muito longe ou muito perto do banco.'
    ],
    executionTips: [
      'Use um protetor de barra espesso para conforto na sínfise púbica.'
    ],
    recommendedSets: 4,
    recommendedReps: '8-12',
    recommendedRestSec: 120
  },
  {
    id: 'ex-net-coice-gluteo-cabo',
    name: 'Glúteo Coice na Polia Baixa',
    primaryMuscle: 'Glúteos',
    secondaryMuscles: ['Pernas'],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Prenda a tornozeleira na perna e conecte à polia baixa. Apoie as mãos na estrutura do aparelho, com tronco ligeiramente inclinado para frente.',
    movement: 'Estenda a perna para trás e para cima em arco, contraindo o glúteo no topo. Retorne controlando o peso sem encostar o pé no chão.',
    breathing: 'Expire ao estender a perna para trás e inspire no retorno.',
    executionSteps: [
      'Mantenha o quadril nivelado, sem girar o tronco para os lados.',
      'Dê foco ao aperto voluntário no topo do movimento.',
      'Mantenha a perna de apoio levemente flexionada para estabilidade.'
    ],
    commonMistakes: [
      'Jogar a perna com impulso usando a lombar para levantar o peso.',
      'Girar a bacia para o lado ao chutar para trás.'
    ],
    executionTips: [
      'Menos peso com cadência lenta garante isolamento total das fibras do glúteo máximo.'
    ],
    recommendedSets: 3,
    recommendedReps: '12-15 cada perna',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-cadeira-flexora',
    name: 'Cadeira Flexora Sentada',
    primaryMuscle: 'Pernas',
    secondaryMuscles: ['Panturrilhas'],
    equipment: 'Máquinas',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sente-se no aparelho com o rolete posicionado acima do tendão de Aquiles e a almofada superior travando as coxas firmemente.',
    movement: 'Puxe os calcanhares para baixo e para trás flexionando os joelhos ao máximo. Segure 1 segundo e retorne alongando os isquiotibiais.',
    breathing: 'Solte o ar na flexão e puxe o ar ao retornar para a extensão.',
    executionSteps: [
      'Ajuste o encosto para que o joelho fique alinhado ao eixo de rotação da máquina.',
      'Segure firme nas manoplas mantendo a bacia presa ao assento.',
      'Controle a subida em 3 segundos.'
    ],
    commonMistakes: [
      'Deixar o quadril levantar do assento durante a contração.',
      'Soltar o peso de forma brusca no retorno.'
    ],
    executionTips: [
      'Mantenha os pés em dorsiflexão (pontas apontadas para as canelas) para maior ativação muscular.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 60
  },

  // --- PEITO ---
  {
    id: 'ex-net-paralelas-peito',
    name: 'Paralelas com Foco em Peito (Chest Dips)',
    primaryMuscle: 'Peito',
    secondaryMuscles: ['Tríceps', 'Ombros'],
    equipment: 'Peso corporal',
    level: 'Avançado',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Suba nas barras paralelas com os braços estendidos. Incline o tronco para frente a cerca de 30° e flexione levemente os joelhos.',
    movement: 'Desça flexionando os cotovelos para fora até que o peito sinta um bom alongamento (aproximadamente 90° nos cotovelos). Empurre com o peitoral de volta ao topo.',
    breathing: 'Inspire na descida e expire com força ao empurrar o corpo para cima.',
    executionSteps: [
      'Mantenha o queixo recolhido e o tronco inclinado à frente durante todo o trajeto.',
      'Abra ligeiramente os cotovelos para enfatizar as fibras do peitoral inferior.',
      'Desça de forma controlada sem desabar nas articulações dos ombros.'
    ],
    commonMistakes: [
      'Ficar com o tronco totalmente reto, jogando o foco quase todo no tríceps.',
      'Descer além da amplitude segura se faltar mobilidade glenoumeral.'
    ],
    executionTips: [
      'Quando dominar com o peso corporal, adicione peso com um cinto de sobrecarga.'
    ],
    recommendedSets: 3,
    recommendedReps: '8-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-crucifixo-inclinado-halter',
    name: 'Crucifixo Inclinado com Halteres',
    primaryMuscle: 'Peito',
    secondaryMuscles: ['Ombros'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Deite-se em um banco inclinado a 30° com halteres erguidos acima do peito e cotovelos com leve curvatura fixa.',
    movement: 'Abra os braços em arco controlado até sentir um alongamento agradável no peitoral clavicular. Feche abraçando em direção ao topo.',
    breathing: 'Inspire enquanto abre os braços e expire ao aproximar os pesos acima do peito.',
    executionSteps: [
      'Mantenha o ângulo dos cotovelos congelado durante toda a série.',
      'Foque na sensação de estiramento das fibras superiores do peito.',
      'Não bata os halteres no topo para não perder a tensão contínua.'
    ],
    commonMistakes: [
      'Transformar o crucifixo em um supino dobrando os cotovelos.',
      'Descer os braços abaixo da linha do ombro de forma descontrolada.'
    ],
    executionTips: [
      'Imagine que você está abraçando um barril largo no movimento de subida.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-15',
    recommendedRestSec: 75
  },
  {
    id: 'ex-net-flexao-diamante',
    name: 'Flexão Diamante (Diamond Push-Up)',
    primaryMuscle: 'Tríceps',
    secondaryMuscles: ['Peito', 'Ombros', 'Abdômen'],
    equipment: 'Peso corporal',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Posição de prancha alta com as mãos unidas sob o peito, formando um diamante com os polegares e indicadores.',
    movement: 'Desça o peito em direção às mãos mantendo os cotovelos fechados próximos ao tronco. Empurre com o tríceps estendendo os braços.',
    breathing: 'Inspire na descida e solte o ar na subida.',
    executionSteps: [
      'Mantenha o core firme e glúteos travados sem deixar o quadril cair.',
      'Desça até o esterno quase encostar nas mãos.',
      'Empurre estendendo os cotovelos com foco no tríceps.'
    ],
    commonMistakes: [
      'Deixar os cotovelos abrirem excessivamente para os lados.',
      'Arquear a lombar durante o movimento.'
    ],
    executionTips: [
      'Se estiver muito difícil, faça apoiando os joelhos no chão até ganhar força.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-15',
    recommendedRestSec: 60
  },

  // --- OMBROS & TRAPÉZIO ---
  {
    id: 'ex-net-elevacao-lateral-cabo',
    name: 'Elevação Lateral na Polia Baixa',
    primaryMuscle: 'Ombros',
    secondaryMuscles: ['Trapézio' as any],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé ao lado da polia ajustada na altura do tornozelo. Segure o puxador com a mão oposta passando o cabo por trás do corpo ou pela frente.',
    movement: 'Eleve o braço lateralmente em arco até a linha do ombro com o cotovelo levemente flexionado. Segure 1 segundo e desça resistindo à tração do cabo.',
    breathing: 'Expire na elevação e inspire controlando a descida.',
    executionSteps: [
      'Mantenha o punho firme e polegar ligeiramente apontado para baixo no topo.',
      'Sinta a tensão constante que o cabo oferece desde o primeiro centímetro.',
      'Não eleve acima da linha paralela ao chão para evitar compensação no trapézio.'
    ],
    commonMistakes: [
      'Dar tranco com o quadril para iniciar a puxada.',
      'Usar carga alta demais e flexionar o cotovelo em 90 graus.'
    ],
    executionTips: [
      'A polia oferece torque constante mesmo no ponto inicial, tornando-a superior aos halteres para hipertrofia do deltóide lateral.'
    ],
    recommendedSets: 4,
    recommendedReps: '12-15 cada braço',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-desenvolvimento-arnold',
    name: 'Desenvolvimento Arnold com Halteres',
    primaryMuscle: 'Ombros',
    secondaryMuscles: ['Tríceps', 'Peito'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado com as costas apoiadas, segure os halteres na altura do queixo com as palmas voltadas para você (pegada supinada).',
    movement: 'Enquanto empurra os halteres para cima, gire os punhos para que no topo as palmas fiquem voltadas para frente. Reverta o giro na descida.',
    breathing: 'Solte o ar enquanto empurra e gira para cima; inspire na descida.',
    executionSteps: [
      'Inicie a rotação suavemente durante a subida.',
      'Não encoste os halteres com impacto no topo.',
      'Desça retornando à pegada supinada na frente do peito.'
    ],
    commonMistakes: [
      'Girar rápido demais no início do movimento.',
      'Tirar a lombar do encosto.'
    ],
    executionTips: [
      'Trabalha as três cabeças do deltóide em um único movimento fluido.'
    ],
    recommendedSets: 3,
    recommendedReps: '8-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-encolhimento-halteres',
    name: 'Encolhimento de Ombros com Halteres (Shrugs)',
    primaryMuscle: 'Costas',
    secondaryMuscles: ['Ombros'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé com pés na largura dos ombros, segure halteres pesados ao lado do corpo com os braços estendidos e postura reta.',
    movement: 'Eleve os ombros diretamente para cima em direção às orelhas o mais alto possível. Segure a contração por 2 segundos e desça controladamente.',
    breathing: 'Expire ao elevar os ombros e inspire ao descer.',
    executionSteps: [
      'Movimento puramente vertical (subir e descer).',
      'Aperte o trapézio no ápice do movimento.',
      'Alongue totalmente na descida sem perder a postura do tronco.'
    ],
    commonMistakes: [
      'Girar os ombros em círculos (altamente prejudicial à articulação glenoumeral).',
      'Dobrar os cotovelos para ajudar a puxar o peso.'
    ],
    executionTips: [
      'Use straps se a sua pegada nos dedos falhar antes do trapézio.'
    ],
    recommendedSets: 4,
    recommendedReps: '12-15',
    recommendedRestSec: 60
  },

  // --- BÍCEPS & ANTEBRAÇO ---
  {
    id: 'ex-net-rosca-scott-halter',
    name: 'Rosca Scott Unilateral com Halter',
    primaryMuscle: 'Bíceps',
    secondaryMuscles: ['Corpo inteiro'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Apoie o braço no banco Scott com a axila encaixada no topo do apoio. Segure o halter com a palma voltada para cima.',
    movement: 'Flexione o cotovelo erguendo o halter até a contração máxima do bíceps. Desça lentamente até quase a extensão total do braço.',
    breathing: 'Solte o ar na subida e inspire durante a descida controlada.',
    executionSteps: [
      'Não descanse o peso no topo do movimento (mantenha tensão ativa).',
      'Desça em 3 segundos sem estalar o cotovelo na parte inferior.',
      'Mantenha o tronco e o ombro estáveis no banco.'
    ],
    commonMistakes: [
      'Jogar o ombro para trás para ajudar a subir a carga.',
      'Estender bruscamente o cotovelo sob alta tensão (risco de lesão no tendão).'
    ],
    executionTips: [
      'Isola o bíceps braquial eliminando qualquer possibilidade de impulso com o corpo.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12 cada braço',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-rosca-zottman',
    name: 'Rosca Zottman com Halteres',
    primaryMuscle: 'Bíceps',
    secondaryMuscles: ['Corpo inteiro'],
    equipment: 'Halteres',
    level: 'Intermediário',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé, segure os halteres ao lado das coxas com palmas voltadas para a frente (supinadas).',
    movement: 'Suba o peso normalmente como uma rosca direta. No topo, gire os punhos 180° para que as palmas fiquem voltadas para baixo (pronadas) e desça devagar.',
    breathing: 'Expire na subida supinada e inspire na descida pronada.',
    executionSteps: [
      'Suba com foco no bíceps braquial.',
      'Gire os punhos no topo sem descer os cotovelos.',
      'Desça em 3 segundos sentindo a queimação intensa nos antebraços e braquiorradial.'
    ],
    commonMistakes: [
      'Girar os punhos enquanto desce o peso ao invés de girar no topo estático.',
      'Usar halteres pesados demais perdendo o controle da descida.'
    ],
    executionTips: [
      'Um dos melhores exercícios do mundo para construir bíceps espessos e antebraços imponentes simultaneamente.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },

  // --- TRÍCEPS ---
  {
    id: 'ex-net-triceps-frances-halter',
    name: 'Tríceps Francês Sentado com Halter',
    primaryMuscle: 'Tríceps',
    secondaryMuscles: ['Ombros'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado com a coluna ereta, segure um halter pesado com ambas as mãos apoiadas sob as anilhas superiores, braços estendidos acima da cabeça.',
    movement: 'Flexione os cotovelos baixando o halter atrás da cabeça até sentir o alongamento máximo da cabeça longa do tríceps. Estenda os braços de volta ao alto.',
    breathing: 'Inspire na descida atrás da cabeça e expire estendendo ao topo.',
    executionSteps: [
      'Mantenha os cotovelos voltados para frente o máximo possível.',
      'Abdômen firme para evitar hiperlordose lombar.',
      'Desça profundamente para recrutar a cabeça longa do tríceps.'
    ],
    commonMistakes: [
      'Abrir os cotovelos em excesso para os lados.',
      'Bater o halter na nuca.'
    ],
    executionTips: [
      'A posição acima da cabeça coloca a cabeça longa do tríceps em estiramento passivo máximo, otimizando o estímulo hipertrófico.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-12',
    recommendedRestSec: 75
  },

  // --- CORE & ABDÔMEN ---
  {
    id: 'ex-net-elevacao-pernas-barra',
    name: 'Elevação de Pernas na Barra Fixa (Hanging Leg Raise)',
    primaryMuscle: 'Abdômen',
    secondaryMuscles: ['Pernas'],
    equipment: 'Peso corporal',
    level: 'Avançado',
    type: 'Hipertrofia',
    imageUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Pendure-se em uma barra fixa com pegada na largura dos ombros. Corpo alinhado e sem balanço.',
    movement: 'Contraia o abdômen e eleve as pernas estendidas até ficarem paralelas ao chão (ou até tocar a barra). Desça de forma controlada sem pegar impulso.',
    breathing: 'Solte todo o ar dos pulmões ao elevar as pernas; inspire na descida.',
    executionSteps: [
      'Gire a bacia para frente ao subir para contrair o reto abdominal (não apenas flexores de quadril).',
      'Controle o balanço do corpo no retorno.',
      'Se as pernas estendidas forem difíceis, comece flexionando os joelhos em 90°.'
    ],
    commonMistakes: [
      'Balançar o corpo como um pêndulo para jogar as pernas para cima.',
      'Mover apenas as pernas sem flexionar a coluna vertebral.'
    ],
    executionTips: [
      'Exercício rei para fortalecimento da parede inferior do abdômen e estabilidade lombar.'
    ],
    recommendedSets: 3,
    recommendedReps: '10-15',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-roda-abdominal',
    name: 'Abdominal na Roda (Ab Wheel Rollout)',
    primaryMuscle: 'Abdômen',
    secondaryMuscles: ['Ombros', 'Costas'],
    equipment: 'Peso corporal',
    level: 'Avançado',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Ajoelhe-se em um colchonete segurando as manoplas da roda no chão abaixo dos ombros.',
    movement: 'Role a roda para a frente estendendo o corpo o máximo que conseguir sem perder a contração abdominal. Puxe a roda de volta flexionando o abdômen.',
    breathing: 'Inspire ao rolar para a frente e expire com força ao puxar de volta.',
    executionSteps: [
      'Mantenha uma leve curvatura em C na coluna (retroversão pélvica) para proteger a lombar.',
      'Não deixe o quadril desabar.',
      'Trabalhe a força anti-extensão do core.'
    ],
    commonMistakes: [
      'Deixar a coluna lombar arquear para baixo (causando dor lombar).',
      'Puxar com o quadril primeiro em vez de contrair o abdômen.'
    ],
    executionTips: [
      'Coloque uma anilha ou parede na frente para limitar o percurso até ganhar força total.'
    ],
    recommendedSets: 3,
    recommendedReps: '8-12',
    recommendedRestSec: 90
  },
  {
    id: 'ex-net-pallof-press',
    name: 'Pallof Press na Polia (Anti-Rotação de Core)',
    primaryMuscle: 'Abdômen',
    secondaryMuscles: ['Ombros'],
    equipment: 'Cabos',
    level: 'Iniciante',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé lateralmente à polia na altura do peito, segure o pegador com ambas as mãos coladas ao esterno.',
    movement: 'Estenda os braços à frente sem deixar o tronco girar em direção à máquina. Segure a contração por 2 segundos e retorne ao peito.',
    breathing: 'Respire normalmente enquanto mantém a tensão isométrica forte no abdômen.',
    executionSteps: [
      'Pés afastados na largura dos ombros e joelhos semi-flexionados.',
      'Resista bravamente à força de rotação do cabo.',
      'Mantenha o tronco e a bacia apontados para frente.'
    ],
    commonMistakes: [
      'Girar os ombros em direção à máquina.',
      'Usar carga muito pesada que quebre a estabilidade da postura.'
    ],
    executionTips: [
      'Um dos exercícios mais recomendados por fisioterapeutas esportivos para prevenir hérnias e fortalecer oblíquos.'
    ],
    recommendedSets: 3,
    recommendedReps: '12 cada lado',
    recommendedRestSec: 45
  },

  // --- KETTLEBELL & FUNCIONAL ---
  {
    id: 'ex-net-kettlebell-swing',
    name: 'Kettlebell Swing Russo',
    primaryMuscle: 'Glúteos',
    secondaryMuscles: ['Pernas', 'Costas', 'Ombros'],
    equipment: 'Kettlebell',
    level: 'Intermediário',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Pés ligeiramente mais largos que os ombros, kettlebell no chão à sua frente. Incline o tronco segurando a alça com ambas as mãos.',
    movement: 'Puxe o kettlebell entre as pernas e projete o quadril explosivamente para frente, fazendo o peso subir até a altura do peito pela força dos glúteos e pernas.',
    breathing: 'Expire com força e rapidez no topo da projeção; inspire na descida.',
    executionSteps: [
      'A força vem do quadril (hip hinge explosivo), não dos braços.',
      'Mantenha as costas retas e o peito aberto.',
      'No topo, fique ereto travando glúteos e abdômen como uma prancha em pé.'
    ],
    commonMistakes: [
      'Agachar demais (transformando o swing em agachamento).',
      'Elevar o peso com a força dos ombros e braços.'
    ],
    executionTips: [
      'Excelente para queima calórica intensa, potência de quadril e resistência cardiovascular.'
    ],
    recommendedSets: 4,
    recommendedReps: '15-20',
    recommendedRestSec: 60
  },
  {
    id: 'ex-net-farmers-walk',
    name: 'Farmer\'s Walk (Caminhada do Fazendeiro)',
    primaryMuscle: 'Corpo inteiro',
    secondaryMuscles: ['Ombros', 'Costas', 'Abdômen'],
    equipment: 'Halteres',
    level: 'Iniciante',
    type: 'Força',
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Em pé entre dois halteres ou kettlebells pesados no chão. Agache com postura perfeita e levante os pesos esticando o corpo ereto.',
    movement: 'Caminhe com passos curtos e ritmados mantendo o peito estufado, ombros firmes para trás e abdômen totalmente travado por 30 a 50 metros.',
    breathing: 'Respiração curta e controlada mantendo a pressão intra-abdominal.',
    executionSteps: [
      'Não deixe os ombros caírem para a frente.',
      'Mantenha o olhar no horizonte e a marcha estável.',
      'Sinta a força na pegada das mãos e estabilização de todo o corpo.'
    ],
    commonMistakes: [
      'Balançar os pesos de um lado para o outro.',
      'Andar curvado para frente sob carga pesada.'
    ],
    executionTips: [
      'Desenvolve pegada de aço, estabilidade do core e densidade muscular no trapézio.'
    ],
    recommendedSets: 3,
    recommendedReps: '40 metros',
    recommendedRestSec: 90
  },

  // --- MOBILIDADE & PREVENÇÃO ---
  {
    id: 'ex-net-mobilidade-quadril-9090',
    name: 'Transição de Quadril 90/90',
    primaryMuscle: 'Glúteos',
    secondaryMuscles: ['Pernas'],
    equipment: 'Peso corporal',
    level: 'Iniciante',
    type: 'Mobilidade',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    initialPosition: 'Sentado no chão, posicione uma perna à frente em ângulo de 90° e a outra para trás também em 90°, com o tronco ereto.',
    movement: 'Gire suavemente os joelhos e o quadril para o lado oposto sem tirar os calcanhares do solo, alternando a rotação interna e externa do quadril.',
    breathing: 'Inspire no centro e expire suavemente ao inclinar sobre a perna dianteira.',
    executionSteps: [
      'Mantenha a coluna o mais neutra possível.',
      'Segure 3 a 5 segundos em cada lado sentindo o alívio na articulação coxofemoral.',
      'Se necessário, apoie as mãos atrás no início.'
    ],
    commonMistakes: [
      'Forçar a amplitude além do conforto articular.',
      'Girar de forma rápida e descontrolada.'
    ],
    executionTips: [
      'Essencial para destravar o agachamento profundo e proteger a lombar.'
    ],
    recommendedSets: 2,
    recommendedReps: '10 transições',
    recommendedRestSec: 30
  }
];

export const FREE_EXERCISE_DB_CATALOG: Exercise[] = freeExerciseDbJson as Exercise[];

export const ONLINE_EXERCISE_CATALOG: Exercise[] = [
  ...CURATED_ONLINE_EXERCISES,
  ...FREE_EXERCISE_DB_CATALOG
];

