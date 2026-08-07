import client from '../api/client';

interface EleveSansPhoto { matricule: string; nom: string; prenom: string; }

export async function recupererPdf(url: string): Promise<Blob> {
  try {
    const response = await client.get(url, { responseType: 'blob' });
    return new Blob([response.data], { type: 'application/pdf' });
  } catch (err) {
    const reponse = (err as { response?: { data?: Blob } })?.response;

    if (reponse?.data instanceof Blob) {
      let messageServeur: string | null = null;
      let elevesSansPhoto: EleveSansPhoto[] | null = null;

      try {
        const texte = await reponse.data.text();
        const json = JSON.parse(texte);
        messageServeur = json.message ?? null;
        elevesSansPhoto = json.eleves_sans_photo ?? null;
      } catch {
        // réponse non-JSON — messageServeur reste null, le message générique prend le relais plus bas
      }

      if (messageServeur) {
        const suffixe = elevesSansPhoto && elevesSansPhoto.length > 0
          ? ' — ' + elevesSansPhoto.map((e) => `${e.prenom} ${e.nom} (${e.matricule})`).join(', ')
          : '';
        throw new Error(messageServeur + suffixe);
      }
    }

    throw new Error('Erreur lors de la génération du PDF.');
  }
}

/**
 * Ouvre un onglet vide immédiatement (dans le geste utilisateur, pour éviter le blocage
 * de pop-up des navigateurs), puis y charge le PDF une fois récupéré. Le visualiseur PDF
 * natif du navigateur prend le relais — zoom, impression, téléchargement déjà intégrés.
 */
export async function genererEtOuvrirPdf(url: string): Promise<void> {
  const nouvelOnglet = window.open('', '_blank');
  try {
    const blob = await recupererPdf(url);
    const blobUrl = window.URL.createObjectURL(blob);
    if (nouvelOnglet) {
      nouvelOnglet.location.href = blobUrl;
    } else {
      window.open(blobUrl, '_blank');
    }
  } catch (err) {
    nouvelOnglet?.close();
    throw err;
  }
}