import os
import glob
import logging
import re
from typing import List, Optional
import concurrent.futures

from markitdown import MarkItDown
from langchain_text_splitters import RecursiveCharacterTextSplitter

# ============================================================================
# CONFIGURATION
# ============================================================================
# Chemins par défaut (peuvent être modifiés via variables d'environnement ou instanciation)
INPUT_DIR = os.getenv("PDF_INPUT_DIR", "data/data_bpi")
OUTPUT_DIR = os.getenv("PDF_OUTPUT_DIR", "data/output_markdowns")

# Paramètres de découpage sémantique (Chunking)
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", 15000))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", 1500))
CHUNK_SEPARATOR = os.getenv("CHUNK_SEPARATOR", "\n\n---CHUNK_SEPARATOR---\n\n")

# ============================================================================
# LOGGING SETUP
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)


class PDFPreprocessor:
    """
    Un pipeline robuste pour extraire, nettoyer et découper sémantiquement
    des fichiers PDF en documents Markdown.
    """

    def __init__(
        self,
        input_dir: str = INPUT_DIR,
        output_dir: str = OUTPUT_DIR,
        chunk_size: int = CHUNK_SIZE,
        chunk_overlap: int = CHUNK_OVERLAP
    ):
        """
        Initialise le préprocesseur PDF avec les paramètres de configuration.

        Args:
            input_dir (str): Sous-répertoire contenant les fichiers PDF bruts.
            output_dir (str): Sous-répertoire de destination pour les fichiers .md.
            chunk_size (int): Taille de chaque chunk (en caractères).
            chunk_overlap (int): Chevauchement entre chunks pour préserver le contexte.
        """
        self.input_dir = os.path.abspath(input_dir)
        self.output_dir = os.path.abspath(output_dir)
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Initialisation de MarkItDown
        self.md_parser = MarkItDown()

        # Initialisation du Splitter LangChain
        # L'ordre des séparateurs privilégie la préservation des structures logiques
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", " ", ""],
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            is_separator_regex=False,
        )

        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """
        Vérifie et crée les répertoires d'entrée et de sortie si nécessaire.
        """
        if not os.path.exists(self.input_dir):
            logger.warning(f"Le répertoire d'entrée est introuvable: {self.input_dir}. Création du répertoire.")
            os.makedirs(self.input_dir, exist_ok=True)

        if not os.path.exists(self.output_dir):
            logger.info(f"Création du répertoire de sortie: {self.output_dir}")
            os.makedirs(self.output_dir, exist_ok=True)

    def extract_markdown(self, pdf_path: str) -> Optional[str]:
        """
        Extrait le contenu Markdown d'un PDF via MarkItDown.

        Args:
            pdf_path (str): Chemin vers le fichier PDF cible.

        Returns:
            Optional[str]: Texte Markdown extrait, ou None en cas d'échec.
        """
        try:
            logger.info(f"Extraction du contenu depuis: {pdf_path}")
            result = self.md_parser.convert(pdf_path)
            return result.text_content
        except Exception as e:
            logger.error(f"Erreur lors de l'extraction de {pdf_path}: {e}")
            return None

    def clean_text(self, text: str) -> str:
        """
        Nettoie et normalise le texte Markdown brut (post-extraction).

        Args:
            text (str): Texte Markdown brut extrait.

        Returns:
            str: Texte Markdown nettoyé, lissé et libre d'artefacts.
        """
        if not text:
            return ""

        # 1. Normalisation : Suppression des lignes vides excessives
        cleaned = re.sub(r'\n{3,}', '\n\n', text)
        
        # 2. Normalisation : Suppression des double espaces et espaces en fin de ligne
        cleaned = re.sub(r' {2,}', ' ', cleaned)
        cleaned = re.sub(r'[ \t]+$', '', cleaned, flags=re.MULTILINE)
        
        # 3. Nettoyage d'Artefacts : Suppression heuristique de numérotations isolées
        # Par exemple 'Page 15' ou '15' isolé sur une ligne (si non capturé par MarkItDown)
        cleaned = re.sub(r'(?i)^\s*page\s*\d+\s*$\n', '', cleaned, flags=re.MULTILINE)
        
        return cleaned.strip()

    def chunk_text(self, text: str) -> List[str]:
        """
        Découpe un texte Markdown nettoyé en morceaux (chunks) sémantiquement cohérents.

        Args:
            text (str): Le texte Markdown complet.

        Returns:
            List[str]: Une liste ordonnée de fragments de texte (chunks).
        """
        logger.debug("Découpage sémantique en chunks...")
        return self.text_splitter.split_text(text)

    def save_chunks(self, chunks: List[str], original_filename: str) -> str:
        """
        Assemble et sauvegarde les chunks dans un fichier Markdown unifié avec séparateurs.

        Args:
            chunks (List[str]): Les blocs de texte découpés.
            original_filename (str): Le nom du fichier PDF source.

        Returns:
            str: Le chemin d'accès du fichier Markdown final sauvegardé.
        """
        base_name = os.path.splitext(os.path.basename(original_filename))[0]
        output_filename = f"{base_name}.md"
        output_path = os.path.join(self.output_dir, output_filename)

        try:
            with open(output_path, "w", encoding="utf-8") as file:
                file.write(CHUNK_SEPARATOR.join(chunks))
            logger.info(f"Succès: {len(chunks)} chunks sauvegardés dans {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Erreur lors de la sauvegarde dans {output_path}: {e}")
            raise

    def process_file(self, pdf_path: str) -> bool:
        """
        Exécute le pipeline de bout-en-bout pour un seul fichier PDF.

        Args:
            pdf_path (str): Chemin système du fichier PDF à traiter.

        Returns:
            bool: True si toutes les étapes ont réussi, False sinon.
        """
        # Étape 1 : Extraction
        raw_markdown = self.extract_markdown(pdf_path)
        if not raw_markdown:
            return False

        # Étape 2 : Nettoyage
        cleaned_markdown = self.clean_text(raw_markdown)
        if not cleaned_markdown:
            logger.warning(f"Le document {pdf_path} est vide après nettoyage.")
            return False

        # Étape 3 : Découpage sémantique (Chunking)
        chunks = self.chunk_text(cleaned_markdown)
        if not chunks:
            logger.warning(f"Aucun chunk généré pour {pdf_path}.")
            return False

        # Étape 4 : Sauvegarde sur disque
        try:
            self.save_chunks(chunks, pdf_path)
            return True
        except Exception:
            return False

    def run(self) -> None:
        """
        Lance la routine de traitement automatisé sur tous les PDF du répertoire d'entrée,
        en utilisant le multi-threading pour accélérer la conversion parallèle.
        """
        search_pattern = os.path.join(self.input_dir, "*.pdf")
        pdf_files = glob.glob(search_pattern)

        if not pdf_files:
            logger.warning(f"Aucun fichier PDF n'a été trouvé dans le répertoire: {self.input_dir}")
            return

        logger.info(f"Démarrage du traitement de {len(pdf_files)} fichiers PDF avec {os.cpu_count() or 4} workers...")
        
        success_count = 0
        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = executor.map(self.process_file, pdf_files)
            for success in results:
                if success:
                    success_count += 1

        logger.info(
            f"Pré-traitement terminé. Fichiers traités avec succès : {success_count}/{len(pdf_files)}."
        )


if __name__ == "__main__":
    # Exécution autonome du script
    processor = PDFPreprocessor()
    processor.run()
