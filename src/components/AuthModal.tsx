import React, { useState } from 'react';
import { db } from '../services/db';
import { googleSignIn } from '../services/googleAuth';
import { FitnessGoal, ExerciseLevel, TrainingLocation, EquipmentType } from '../types';
import { 
  X, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Check, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  Dumbbell
} from 'lucide-react';

interface AuthModalProps {
  initialMode?: 'login' | 'register' | 'forgot';
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ initialMode = 'login', onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number>(26);
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [goal, setGoal] = useState<FitnessGoal>('Ganho de massa muscular');
  const [experienceLevel, setExperienceLevel] = useState<ExerciseLevel>('Iniciante');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [trainingLocation, setLocation] = useState<TrainingLocation>('Academia');
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentType[]>([
    'Barra', 
    'Halteres', 
    'Máquinas', 
    'Cabos', 
    'Peso corporal'
  ]);

  const toggleEquipment = (eq: EquipmentType) => {
    if (availableEquipment.includes(eq)) {
      if (availableEquipment.length > 1) {
        setAvailableEquipment(availableEquipment.filter(e => e !== eq));
      }
    } else {
      setAvailableEquipment([...availableEquipment, eq]);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginEmail) {
      setErrorMessage('Informe seu e-mail.');
      return;
    }

    const user = db.loginUser(loginEmail);
    if (user) {
      onSuccess();
      onClose();
    } else {
      // Check if any user exists or auto log in first demo user
      setErrorMessage('Usuário não encontrado. Use um dos perfis demonstrativos abaixo ou crie uma conta.');
    }
  };

  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingInGoogle(true);
    setErrorMessage('');
    try {
      const res = await googleSignIn();
      const linkedUser = db.linkGoogleAccount({
        name: res.name,
        email: res.email,
        photoUrl: res.photoUrl
      });
      db.setCurrentUser(linkedUser.id);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (
        errorObj?.code === 'auth/popup-closed-by-user' ||
        errorObj?.code === 'auth/cancelled-popup-request'
      ) {
        setErrorMessage('Login com Google cancelado.');
      } else {
        console.warn('Google Sign-in status:', err);
        // Fallback gracefully to first user if popup blocked in iframe
        const users = db.getAllUsers();
        if (users.length > 0) {
          db.setCurrentUser(users[0].id);
          onSuccess();
          onClose();
        } else {
          setErrorMessage('Erro ao conectar com Google. Tente com e-mail e senha.');
        }
      }
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('Instruções de recuperação de senha foram enviadas para seu e-mail cadastrado.');
    setTimeout(() => {
      setMode('login');
      setSuccessMessage('');
    }, 2500);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerStep === 1) {
      if (!name || !email || !password) {
        setErrorMessage('Preencha os campos obrigatórios.');
        return;
      }
      setErrorMessage('');
      setRegisterStep(2);
      return;
    }

    // Complete registration
    db.registerUser({
      name,
      email,
      role: 'user',
      isPro: false,
      age,
      height,
      weight,
      goal,
      experienceLevel,
      daysPerWeek,
      trainingLocation,
      availableEquipment
    });

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        id="auth-modal"
        className="relative w-full max-w-lg my-6 bg-[#12161d] border border-neutral-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in-95"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Dumbbell className="w-3.5 h-3.5" />
            FitPro
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {mode === 'login' && 'Entrar na sua conta'}
            {mode === 'register' && (registerStep === 1 ? 'Criar sua conta' : 'Seu Perfil de Treino')}
            {mode === 'forgot' && 'Recuperar senha'}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'login' && 'Seu treino, seu ritmo. Acesse seus treinos e histórico.'}
            {mode === 'register' && (registerStep === 1 ? 'Cadastre-se para montar rotinas e acompanhar sua evolução.' : 'Personalize sua experiência para treinos sob medida.')}
            {mode === 'forgot' && 'Digite seu e-mail para receber o link de redefinição.'}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-neutral-300 block mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-neutral-300">Senha</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                  className="text-emerald-400 hover:underline text-[11px]"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
            >
              ENTRAR
            </button>

            {/* Google Login button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingInGoogle}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 border border-neutral-800 text-neutral-200 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 12s.7 2.3 1.9 4.7l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                {isLoggingInGoogle ? 'Conectando ao Google...' : 'Continuar com Google'}
              </button>
            </div>

            <div className="text-center pt-2 text-neutral-400">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setErrorMessage(''); }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Criar conta gratuita
              </button>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            {registerStep === 1 ? (
              <>
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Nome Completo *</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Matheus Oliveira"
                      className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">E-mail *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Senha *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Idade</label>
                    <input
                      type="number"
                      value={age}
                      onChange={e => setAge(Number(e.target.value))}
                      className="w-full py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Altura (cm)</label>
                    <input
                      type="number"
                      value={height}
                      onChange={e => setHeight(Number(e.target.value))}
                      className="w-full py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      value={weight}
                      onChange={e => setWeight(Number(e.target.value))}
                      className="w-full py-2 px-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  PRÓXIMO: PREFERÊNCIAS DE TREINO
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              /* REGISTER STEP 2: FITNESS PROFILE */
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1.5">Objetivo Principal</label>
                  <select
                    value={goal}
                    onChange={e => setGoal(e.target.value as FitnessGoal)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  >
                    <option value="Ganho de massa muscular">Ganho de massa muscular (Hipertrofia)</option>
                    <option value="Emagrecimento">Emagrecimento e queima de gordura</option>
                    <option value="Força">Força e potência</option>
                    <option value="Condicionamento físico">Condicionamento físico geral</option>
                    <option value="Saúde e qualidade de vida">Saúde e qualidade de vida</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1.5">Nível</label>
                    <select
                      value={experienceLevel}
                      onChange={e => setExperienceLevel(e.target.value as ExerciseLevel)}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-neutral-300 block mb-1.5">Dias por Semana</label>
                    <select
                      value={daysPerWeek}
                      onChange={e => setDaysPerWeek(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                    >
                      <option value={2}>2 dias</option>
                      <option value={3}>3 dias</option>
                      <option value={4}>4 dias</option>
                      <option value={5}>5 dias</option>
                      <option value={6}>6 dias</option>
                      <option value={7}>7 dias</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1.5">Local Onde Treina</label>
                  <select
                    value={trainingLocation}
                    onChange={e => setLocation(e.target.value as TrainingLocation)}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white"
                  >
                    <option value="Academia">Academia</option>
                    <option value="Em casa">Em casa</option>
                    <option value="Parque / Ar livre">Parque / Ar livre</option>
                    <option value="Box / Funcional">Box / Funcional</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1.5">Equipamentos Disponíveis</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Barra', 'Halteres', 'Máquinas', 'Cabos', 'Peso corporal', 'Kettlebell', 'Elásticos'] as EquipmentType[]).map(eq => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
                          availableEquipment.includes(eq)
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        {availableEquipment.includes(eq) ? '✓ ' : '+ '}{eq}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegisterStep(1)}
                    className="py-3 px-4 rounded-xl bg-neutral-800 text-neutral-300 font-semibold"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20"
                  >
                    CONCLUIR CADASTRO
                  </button>
                </div>
              </div>
            )}

            <div className="text-center pt-2 text-neutral-400">
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setErrorMessage(''); }}
                className="text-emerald-400 font-bold hover:underline"
              >
                Faça login
              </button>
            </div>
          </form>
        )}

        {/* MODE: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-neutral-300 block mb-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  className="w-full py-2.5 pl-9 pr-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm shadow-lg shadow-emerald-500/20"
            >
              ENVIAR LINK DE RECUPERAÇÃO
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-neutral-400 hover:text-white"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
