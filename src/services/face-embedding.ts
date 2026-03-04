import { NativeModules } from 'react-native';

const { FaceEmbeddingModule } = NativeModules;

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Cosine similarity threshold for face match.
 * Values above this are considered a match.
 */
export const SIMILARITY_THRESHOLD = 0.6;

/**
 * Get a 128-dimensional face embedding from an image URI with optional cropping box.
 */
export async function getEmbedding(imageUri: string, faceRect?: Rect): Promise<number[]> {
    if (!FaceEmbeddingModule) {
        throw new Error('FaceEmbeddingModule is not available');
    }
    return FaceEmbeddingModule.getEmbedding(imageUri, faceRect || null);
}

/**
 * Compare two face images (with optional bounding boxes) and return similarity (0.0–1.0).
 */
export async function compareFaces(
    uri1: string,
    rect1: Rect | null,
    uri2: string,
    rect2: Rect | null,
): Promise<number> {
    if (!FaceEmbeddingModule) {
        throw new Error('FaceEmbeddingModule is not available');
    }
    return FaceEmbeddingModule.compareFaces(uri1, rect1, uri2, rect2);
}

/**
 * Check if a similarity score indicates a face match.
 */
export function isFaceMatch(similarity: number): boolean {
    return similarity >= SIMILARITY_THRESHOLD;
}
