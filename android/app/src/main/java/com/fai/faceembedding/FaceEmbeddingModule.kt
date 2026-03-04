package com.fai.faceembedding

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.view.View
import android.util.Log
import com.facebook.react.bridge.*
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.sqrt

class FaceEmbeddingModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val MODEL_FILE = "facenet.tflite"
        private const val INPUT_SIZE = 160
    }

    private var interpreter: Interpreter? = null
    private var embeddingDim: Int = 128 // Default, will update dynamically

    override fun getName(): String = "FaceEmbeddingModule"

    /**
     * Lazily load the TFLite interpreter from assets.
     */
    private fun getInterpreter(): Interpreter {
        if (interpreter == null) {
            Log.d("FaceEmbeddingModule", "Initializing TFLite interpreter with model: $MODEL_FILE")
            val model = loadModelFile()
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(model, options)
            
            // Dynamically determine embedding dimension from the model's output tensor
            try {
                val outputShape = interpreter!!.getOutputTensor(0).shape()
                if (outputShape.isNotEmpty()) {
                    embeddingDim = outputShape[outputShape.size - 1]
                    Log.d("FaceEmbeddingModule", "Determined output embedding dimension: $embeddingDim")
                }
            } catch (e: Exception) {
                Log.e("FaceEmbeddingModule", "Failed to determine embedding dim, using default 128", e)
            }
        }
        return interpreter!!
    }

    private fun loadModelFile(): MappedByteBuffer {
        val assetManager = reactContext.assets
        val fileDescriptor = assetManager.openFd(MODEL_FILE)
        val inputStream = FileInputStream(fileDescriptor.fileDescriptor)
        val fileChannel = inputStream.channel
        val startOffset = fileDescriptor.startOffset
        val declaredLength = fileDescriptor.declaredLength
        return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
    }

    /**
     * Load image, crop if rect is provided, and resize.
     */
    private fun loadAndResizeBitmap(imageUri: String, cropRect: ReadableMap?): Bitmap {
        Log.d("FaceEmbeddingModule", "Loading bitmap from URI: $imageUri")
        val uri = Uri.parse(imageUri)
        val inputStream = reactContext.contentResolver.openInputStream(uri)
            ?: throw Exception("Cannot open image at $imageUri")

        var bitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()

        if (bitmap == null) {
            throw Exception("Failed to decode image at $imageUri")
        }

        // Apply crop if provided
        if (cropRect != null) {
            try {
                val x = cropRect.getInt("x")
                val y = cropRect.getInt("y")
                val width = cropRect.getInt("width")
                val height = cropRect.getInt("height")

                // Ensure crop is within bounds
                val safeX = x.coerceIn(0, bitmap.width - 1)
                val safeY = y.coerceIn(0, bitmap.height - 1)
                val safeWidth = width.coerceAtMost(bitmap.width - safeX)
                val safeHeight = height.coerceAtMost(bitmap.height - safeY)

                if (safeWidth > 0 && safeHeight > 0) {
                    Log.d("FaceEmbeddingModule", "Cropping bitmap to: x=$safeX, y=$safeY, w=$safeWidth, h=$safeHeight")
                    bitmap = Bitmap.createBitmap(bitmap, safeX, safeY, safeWidth, safeHeight)
                }
            } catch (e: Exception) {
                Log.e("FaceEmbeddingModule", "Crop failed: ${e.message}")
                // Fallback to full image if crop fails
            }
        }

        Log.d("FaceEmbeddingModule", "Resizing bitmap to $INPUT_SIZE x $INPUT_SIZE")
        return Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)
    }

    /**
     * Convert a bitmap to a ByteBuffer suitable for TFLite inference.
     * Normalizes pixel values to [-1, 1] range.
     * Format: [1, INPUT_SIZE, INPUT_SIZE, 3] float32
     */
    private fun bitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        val byteBuffer = ByteBuffer.allocateDirect(4 * INPUT_SIZE * INPUT_SIZE * 3)
        byteBuffer.order(ByteOrder.nativeOrder())

        val pixels = IntArray(INPUT_SIZE * INPUT_SIZE)
        bitmap.getPixels(pixels, 0, INPUT_SIZE, 0, 0, INPUT_SIZE, INPUT_SIZE)

        for (pixel in pixels) {
            // Extract RGB channels and normalize to [-1, 1]
            val r = ((pixel shr 16) and 0xFF) / 127.5f - 1.0f
            val g = ((pixel shr 8) and 0xFF) / 127.5f - 1.0f
            val b = (pixel and 0xFF) / 127.5f - 1.0f
            byteBuffer.putFloat(r)
            byteBuffer.putFloat(g)
            byteBuffer.putFloat(b)
        }

        byteBuffer.rewind()
        return byteBuffer
    }

    /**
     * Run TFLite inference on an image (with optional crop) and return an embedding.
     */
    private fun runInference(imageUri: String, cropRect: ReadableMap?): FloatArray {
        val bitmap = loadAndResizeBitmap(imageUri, cropRect)
        val inputBuffer = bitmapToByteBuffer(bitmap)

        Log.d("FaceEmbeddingModule", "Running TFLite inference. Expected embedding size: $embeddingDim")
        // Output: [1][embeddingDim]
        val output = Array(1) { FloatArray(embeddingDim) }
        getInterpreter().run(inputBuffer, output)
        Log.d("FaceEmbeddingModule", "Inference complete.")

        // L2-normalize the embedding
        val embedding = output[0]
        val norm = sqrt(embedding.map { it * it }.sum())
        if (norm > 0) {
            for (i in embedding.indices) {
                embedding[i] /= norm
            }
        }

        return embedding
    }

    /**
     * Compute cosine similarity between two L2-normalized embeddings.
     */
    private fun cosineSimilarity(emb1: FloatArray, emb2: FloatArray): Double {
        var dotProduct = 0.0
        for (i in emb1.indices) {
            dotProduct += emb1[i] * emb2[i]
        }
        return dotProduct
    }

    /**
     * JS-exposed: Get embedding for an image URI.
     * Returns a WritableArray of 128 floats.
     */
    @ReactMethod
    fun getEmbedding(imageUri: String, cropRect: ReadableMap?, promise: Promise) {
        try {
            val embedding = runInference(imageUri, cropRect)
            val result = Arguments.createArray()
            for (value in embedding) {
                result.pushDouble(value.toDouble())
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("EMBEDDING_ERROR", "Failed to get embedding: ${e.message}", e)
        }
    }

    /**
     * JS-exposed: Compare two face images and return cosine similarity (0.0–1.0).
     */
    @ReactMethod
    fun compareFaces(
        uri1: String,
        cropRect1: ReadableMap?,
        uri2: String,
        cropRect2: ReadableMap?,
        promise: Promise
    ) {
        try {
            val emb1 = runInference(uri1, cropRect1)
            val emb2 = runInference(uri2, cropRect2)
            val similarity = cosineSimilarity(emb1, emb2)
            promise.resolve(similarity)
        } catch (e: Exception) {
            promise.reject("COMPARE_ERROR", "Failed to compare faces: ${e.message}", e)
        }
    }
}
