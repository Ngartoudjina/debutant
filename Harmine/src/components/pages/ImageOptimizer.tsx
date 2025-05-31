import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

class ImageOptimizer {
    private inputDir: string;

    constructor(inputDir: string) {
        this.inputDir = inputDir;
    }

    async optimizeImages(formats: string[] = ['webp'], quality: number = 80): Promise<void> {
        try {
            const files = await fs.readdir(this.inputDir);

            for (const file of files) {
                if (/\.(jpg|jpeg|png|gif)$/i.test(file)) {
                    const filePath = path.join(this.inputDir, file);

                    for (const format of formats) {
                        const newFileName = `${path.parse(file).name}.${format}`;
                        const newFilePath = path.join(this.inputDir, newFileName);

                        await sharp(filePath)
                            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
                            .toFormat(format as any, { quality }) // `sharp` nécessite un type spécifique pour le format
                            .toFile(newFilePath);

                        if (format !== path.extname(file).slice(1)) {
                            await fs.unlink(filePath);
                        }

                        console.log(`Converti: ${file} -> ${newFileName}`);
                    }
                }
            }
        } catch (error) {
            console.error('Erreur lors de l\'optimisation des images : ', error);
        }
    }
}

// Exemple d'utilisation
//const optimizer = new ImageOptimizer('./images');
//optimizer.optimizeImages(['webp', 'jpg'], 85);