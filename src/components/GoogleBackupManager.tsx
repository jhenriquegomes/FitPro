import React, { useState, useEffect } from 'react';
import { 
  googleSignIn, 
  googleSignOut, 
  getGoogleAccessToken, 
  setGoogleAccessToken,
  initGoogleAuth,
  auth
} from '../services/googleAuth';
import { GoogleDriveService, DriveBackupFile } from '../services/googleDrive';
import { db } from '../services/db';
import { 
  Cloud, 
  CloudRain, 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  LogOut, 
  HardDrive,
  ShieldCheck
} from 'lucide-react';

interface GoogleBackupManagerProps {
  onDataRestored?: () => void;
}

export function GoogleBackupManager({ onDataRestored }: GoogleBackupManagerProps) {
  const [currentUser, setCurrentUser] = useState(() => db.getCurrentUser());
  const [googleUser, setGoogleUser] = useState(() => auth.currentUser);
  const [accessToken, setToken] = useState<string | null>(() => getGoogleAccessToken());
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmRestoreFile, setConfirmRestoreFile] = useState<DriveBackupFile | null>(null);
  const [scopePermissionWarning, setScopePermissionWarning] = useState(false);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setToken(token);
        fetchDriveBackups(token);
      },
      () => {
        setGoogleUser(null);
        setToken(null);
        setScopePermissionWarning(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchDriveBackups = async (token: string) => {
    try {
      setScopePermissionWarning(false);
      const list = await GoogleDriveService.listBackups(token);
      setBackups(list);
    } catch (e: unknown) {
      console.warn('Could not list Google Drive backups:', e);
      const errStr = e instanceof Error ? e.message : String(e);
      if (errStr.includes('403') || errStr.includes('insuficientes')) {
        setScopePermissionWarning(true);
        setStatusMessage({
          type: 'error',
          text: 'Permissões do Google Drive precisam ser autorizadas. Clique em "Autorizar Acesso ao Drive" abaixo.'
        });
      }
    }
  };

  const handleGoogleLogin = async (forceConsent = false) => {
    setIsLoadingAuth(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn(forceConsent);
      setGoogleUser(result.firebaseUser);
      setToken(result.accessToken);

      // Link or sync with FitPro user
      const updatedUser = db.linkGoogleAccount({
        name: result.name,
        email: result.email,
        photoUrl: result.photoUrl
      });
      setCurrentUser(updatedUser);

      setStatusMessage({
        type: 'success',
        text: `Conectado com sucesso como ${result.email}! Backup do Google Drive ativado.`
      });

      // Load existing backups in their drive
      await fetchDriveBackups(result.accessToken);
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (
        errorObj?.code === 'auth/popup-closed-by-user' ||
        errorObj?.code === 'auth/cancelled-popup-request'
      ) {
        setStatusMessage({
          type: 'info',
          text: 'Conexão com a Conta Google cancelada.'
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Erro ao conectar com o Google';
        setStatusMessage({
          type: 'error',
          text: msg
        });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setToken(null);
    setBackups([]);
    setStatusMessage({
      type: 'info',
      text: 'Desconectado da conta Google.'
    });
  };

  const handleCreateBackup = async () => {
    if (!accessToken) {
      setStatusMessage({
        type: 'error',
        text: 'Faça login com sua conta Google primeiro para autorizar o Drive.'
      });
      return;
    }

    setIsBackingUp(true);
    setStatusMessage(null);

    try {
      const payload = db.getDriveBackupPayload();
      const existing = backups.find(b => b.name.toLowerCase().includes('fitpro-backup'));
      
      const saved = await GoogleDriveService.saveBackup(accessToken, payload, existing?.id);
      
      setStatusMessage({
        type: 'success',
        text: `Backup salvo com sucesso no Google Drive (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})!`
      });

      await fetchDriveBackups(accessToken);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar backup no Google Drive.';
      setStatusMessage({
        type: 'error',
        text: msg
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleExecuteRestore = async (file: DriveBackupFile) => {
    if (!accessToken) return;
    setIsRestoring(true);
    setStatusMessage(null);

    try {
      const payload = await GoogleDriveService.downloadBackup(accessToken, file.id);
      const success = db.restoreDriveBackupPayload(payload);

      if (success) {
        setStatusMessage({
          type: 'success',
          text: 'Dados restaurados com sucesso do seu Google Drive!'
        });
        setConfirmRestoreFile(null);
        if (onDataRestored) {
          onDataRestored();
        }
      } else {
        throw new Error('Falha ao aplicar dados do backup.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao restaurar arquivo do Google Drive.';
      setStatusMessage({
        type: 'error',
        text: msg
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!accessToken) return;
    try {
      await GoogleDriveService.deleteBackup(accessToken, fileId);
      setBackups(prev => prev.filter(b => b.id !== fileId));
      setStatusMessage({
        type: 'info',
        text: 'Backup removido do Google Drive.'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao remover backup.';
      setStatusMessage({
        type: 'error',
        text: msg
      });
    }
  };

  const isConnected = !!googleUser && !!accessToken;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#12161c] border border-neutral-800 space-y-4 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              Google Drive & Backup em Nuvem
            </h2>
            <p className="text-[11px] text-neutral-400">
              Mantenha seus treinos, cargas e evolução protegidos na sua conta Google
            </p>
          </div>
        </div>

        {isConnected && (
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conectado
          </span>
        )}
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-red-500/15 border border-red-500/30 text-red-300'
              : 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {!isConnected ? (
        <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800/80 space-y-3">
          <p className="text-xs text-neutral-300 leading-relaxed">
            Faça login com sua conta Google para sincronizar automaticamente ou salvar backups dos seus treinos, rotinas personalizadas e histórico de evolução diretamente no seu Google Drive.
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoadingAuth}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoadingAuth ? (
              <RefreshCw className="w-4 h-4 animate-spin text-neutral-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            )}
            <span>{isLoadingAuth ? 'Conectando ao Google...' : 'Entrar com o Google & Conectar Drive'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected User Badge */}
          <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {googleUser?.photoURL && googleUser.photoURL.trim() !== '' ? (
                <img
                  src={googleUser.photoURL.trim()}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-9 h-9 rounded-full border border-neutral-700 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center">
                  {googleUser?.displayName?.[0] || 'G'}
                </div>
              )}
              <div>
                <div className="font-bold text-white text-xs">{googleUser?.displayName || 'Conta Google'}</div>
                <div className="text-neutral-400 text-[11px]">{googleUser?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchDriveBackups(accessToken)}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                title="Atualizar lista de backups"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-red-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            </div>
          </div>

          {/* Scope Permission Warning Notice */}
          {scopePermissionWarning && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs text-amber-200">
                  <span className="font-bold block text-white">Autorização pendente para o Google Drive</span>
                  Clique em autorizar para conceder permissão de salvar e carregar backups no Drive.
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleGoogleLogin(true)}
                disabled={isLoadingAuth}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] shrink-0 transition-colors shadow-sm"
              >
                {isLoadingAuth ? 'Autorizando...' : 'Autorizar Acesso ao Drive'}
              </button>
            </div>
          )}

          {/* Backup Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleCreateBackup}
              disabled={isBackingUp}
              className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 transition-all active:scale-95 disabled:opacity-60"
            >
              {isBackingUp ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
              ) : (
                <UploadCloud className="w-4 h-4 text-black" />
              )}
              <span>{isBackingUp ? 'Salvando no Google Drive...' : 'Salvar Backup Agora no Google Drive'}</span>
            </button>
          </div>

          {/* Existing Drive Backups List */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              Backups Encontrados no seu Google Drive ({backups.length})
            </h3>

            {backups.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/60 text-center text-neutral-500 text-xs">
                Nenhum backup encontrado ainda no seu Google Drive. Clique em "Salvar Backup Agora" acima para gerar sua primeira cópia em nuvem.
              </div>
            ) : (
              <div className="space-y-2">
                {backups.map(file => {
                  const dateStr = file.modifiedTime
                    ? new Date(file.modifiedTime).toLocaleString([], {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Data desconhecida';

                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{file.name}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                            FitPro Oficial
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Última sincronização: {dateStr}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setConfirmRestoreFile(file)}
                          disabled={isRestoring}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(file.id)}
                          className="p-1.5 rounded-xl bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Excluir do Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal to Restore */}
      {confirmRestoreFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#13171f] border border-neutral-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <DownloadCloud className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Restaurar do Google Drive?</h3>
              <p className="text-xs text-neutral-400">
                Restaurar o backup substitui os treinos e histórico locais pelos dados salvos no seu Google Drive. Deseja continuar?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRestoreFile(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleExecuteRestore(confirmRestoreFile)}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5"
              >
                {isRestoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isRestoring ? 'Restaurando...' : 'Confirmar e Restaurar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
