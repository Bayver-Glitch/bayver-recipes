// Cloudflare R2 Upload Module
// Handles file uploads to R2 storage

const { S3Client, PutObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

// Load environment variables
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && match[1] && match[2]) {
        process.env[match[1]] = match[2];
    }
});

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY
    }
});

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
const PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

/**
 * Test R2 connection
 * @returns {Promise<boolean>} - True if connected
 */
async function testConnection() {
    try {
        await r2Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
        console.log(`✅ Connected to R2 bucket: ${BUCKET_NAME}`);
        return true;
    } catch (error) {
        console.error('❌ R2 connection failed:', error.message);
        throw new Error(`R2 connection failed: ${error.message}`);
    }
}

/**
 * Upload file to R2
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Destination filename
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadToR2(fileBuffer, filename, contentType = 'image/webp') {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `recipes/${filename}`,
            Body: fileBuffer,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000' // Cache for 1 year
        });

        await r2Client.send(command);
        const publicUrl = `${PUBLIC_URL}/recipes/${filename}`;

        console.log(`✅ Uploaded: ${filename} (${Math.round(fileBuffer.length / 1024)}KB)`);
        return publicUrl;

    } catch (error) {
        console.error(`❌ Upload failed for ${filename}:`, error.message);
        throw new Error(`Upload failed: ${error.message}`);
    }
}

/**
 * Upload all optimized image versions
 * @param {Object} optimizedImages - Object from imageOptimizer.optimizeImage()
 * @returns {Promise<Object>} - URLs for all versions
 */
async function uploadOptimizedImages(optimizedImages) {
    console.log('📤 Uploading optimized images to R2...');

    try {
        const [thumbnailUrl, displayUrl, fullUrl] = await Promise.all([
            uploadToR2(optimizedImages.thumbnail.buffer, optimizedImages.thumbnail.filename),
            uploadToR2(optimizedImages.display.buffer, optimizedImages.display.filename),
            uploadToR2(optimizedImages.full.buffer, optimizedImages.full.filename)
        ]);

        console.log('✅ All images uploaded successfully!');

        return {
            thumbnail: thumbnailUrl,
            display: displayUrl,
            full: fullUrl,
            metadata: optimizedImages.metadata
        };

    } catch (error) {
        console.error('❌ Failed to upload images:', error.message);
        throw error;
    }
}

module.exports = {
    testConnection,
    uploadToR2,
    uploadOptimizedImages,
    r2Client
};
