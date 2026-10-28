export interface DriveBackupFile {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  description?: string;
}

export interface DriveBackupPayload {
  version: string;
  appName: string;
  exportedAt: string;
  userEmail: string;
  data: {
    user: unknown;
    workouts: unknown[];
    weeklySchedule: unknown[];
    history: unknown[];
    records: unknown[];
    settings: unknown;
    customExercises?: unknown[];
  };
}

export class GoogleDriveService {
  /**
   * Search and list all FitPro backups in the user's Google Drive.
   */
  public static async listBackups(accessToken: string): Promise<DriveBackupFile[]> {
    const query = encodeURIComponent("name contains 'fitpro-backup' and trashed = false");
    const fields = encodeURIComponent('files(id, name, modifiedTime, size, description)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Failed to list Google Drive backups:', res.status, errText);
      if (res.status === 403) {
        throw new Error('Permissões de acesso ao Google Drive insuficientes (403). Por favor, desconecte e reconecte autorizando o acesso ao Google Drive.');
      }
      throw new Error(`Erro ao consultar backups no Google Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []) as DriveBackupFile[];
  }

  /**
   * Upload or update a backup file in Google Drive.
   */
  public static async saveBackup(
    accessToken: string,
    backupPayload: DriveBackupPayload,
    existingFileId?: string
  ): Promise<DriveBackupFile> {
    const fileName = 'fitpro-backup.json';
    const fileContent = JSON.stringify(backupPayload, null, 2);

    if (existingFileId) {
      // Update existing file content
      const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
      const updateRes = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.error('Failed to update Google Drive backup:', updateRes.status, errText);
        if (updateRes.status === 403) {
          throw new Error('Permissões de acesso ao Google Drive insuficientes (403). Desconecte e reconecte para renovar o acesso.');
        }
        throw new Error(`Erro ao atualizar backup no Google Drive (${updateRes.status}).`);
      }

      const updated = await updateRes.json();
      return {
        id: updated.id,
        name: fileName,
        modifiedTime: new Date().toISOString(),
        description: 'FitPro — Backup em Nuvem',
      };
    }

    // Create new file with multipart upload
    const boundary = '-------fitpro_drive_boundary_' + Date.now();
    const metadata = {
      name: fileName,
      description: `Backup do FitPro (${backupPayload.exportedAt})`,
      mimeType: 'application/json',
    };

    const multipartBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      fileContent +
      `\r\n` +
      `--${boundary}--`;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('Failed to create file on Google Drive:', errText);
      if (createRes.status === 403) {
        throw new Error('Permissões de acesso ao Google Drive insuficientes (403). Desconecte e reconecte para renovar o acesso.');
      }
      throw new Error(`Erro ao salvar backup no Google Drive (${createRes.status}).`);
    }

    const created = await createRes.json();
    return {
      id: created.id,
      name: created.name || fileName,
      modifiedTime: new Date().toISOString(),
      description: metadata.description,
    };
  }

  /**
   * Download and parse a backup file from Google Drive.
   */
  public static async downloadBackup(accessToken: string, fileId: string): Promise<DriveBackupPayload> {
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao baixar backup do Google Drive (${res.status}).`);
    }

    const json = await res.json();
    if (!json.data || !json.data.workouts) {
      throw new Error('O arquivo selecionado no Google Drive não é um backup válido do FitPro.');
    }

    return json as DriveBackupPayload;
  }

  /**
   * Delete a backup file from Google Drive.
   */
  public static async deleteBackup(accessToken: string, fileId: string): Promise<boolean> {
    const deleteUrl = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 404) {
      throw new Error(`Erro ao excluir backup do Google Drive (${res.status}).`);
    }

    return true;
  }
}
