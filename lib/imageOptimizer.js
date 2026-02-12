// Image Optimization Module
// Handles image resizing, format conversion, and optimization

const sharp = require('sharp');

/**
 * Optimize and resize an image to multiple sizes
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} filename - Original filename (used for naming)
 * @returns {Promise<Object>} - Object containing optimized image buffers
 */
async function optimizeImage(imageBuffer, filename) {
    const baseFilename = filename.replace(/\.[^/.]+$/, ''); // Remove extension
    const timestamp = Date.now();

    try {
        // Get original image metadata
        const metadata = await sharp(imageBuffer).metadata();
        console.log(`📸 Original image: ${metadata.width}x${metadata.height}, ${metadata.format}, ${Math.round(imageBuffer.length / 1024)}KB`);

        // Generate three optimized versions
        const [thumbnail, display, full] = await Promise.all([
            // Thumbnail (200px) - for recipe cards
            sharp(imageBuffer)
                .resize(200, 200, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 80 })
                .toBuffer(),

            // Display (800px) - for recipe detail view
            sharp(imageBuffer)
                .resize(800, 800, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 85 })
                .toBuffer(),

            // Full (1200px) - high resolution backup
            sharp(imageBuffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 90 })
                .toBuffer()
        ]);

        // Calculate size savings
        const originalSize = imageBuffer.length;
        const thumbnailSize = thumbnail.length;
        const displaySize = display.length;
        const fullSize = full.length;
        const totalOptimizedSize = thumbnailSize + displaySize + fullSize;
        const savings = Math.round(((originalSize - totalOptimizedSize) / originalSize) * 100);

        console.log(`✅ Optimization complete:`);
        console.log(`   Thumbnail: ${Math.round(thumbnailSize / 1024)}KB`);
        console.log(`   Display: ${Math.round(displaySize / 1024)}KB`);
        console.log(`   Full: ${Math.round(fullSize / 1024)}KB`);
        console.log(`   Total savings: ${savings}% (${Math.round((originalSize - totalOptimizedSize) / 1024)}KB saved)`);

        return {
            thumbnail: {
                buffer: thumbnail,
                filename: `${baseFilename}-thumb-${timestamp}.webp`,
                size: thumbnailSize
            },
            display: {
                buffer: display,
                filename: `${baseFilename}-display-${timestamp}.webp`,
                size: displaySize
            },
            full: {
                buffer: full,
                filename: `${baseFilename}-full-${timestamp}.webp`,
                size: fullSize
            },
            metadata: {
                originalWidth: metadata.width,
                originalHeight: metadata.height,
                originalFormat: metadata.format,
                originalSize: originalSize,
                optimizedSize: totalOptimizedSize,
                savings: savings
            }
        };

    } catch (error) {
        console.error('❌ Image optimization failed:', error.message);
        throw new Error(`Image optimization failed: ${error.message}`);
    }
}

/**
 * Validate image file
 * @param {Buffer} buffer - Image buffer
 * @param {string} mimetype - MIME type
 * @returns {Promise<boolean>} - True if valid
 */
async function validateImage(buffer, mimetype) {
    // Check MIME type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(mimetype)) {
        throw new Error('Invalid image type. Only JPEG, PNG, WebP, and GIF are supported.');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (buffer.length > maxSize) {
        throw new Error('Image too large. Maximum size is 10MB.');
    }

    // Verify it's actually an image
    try {
        const metadata = await sharp(buffer).metadata();
        if (!metadata.width || !metadata.height) {
            throw new Error('Invalid image file.');
        }
        return true;
    } catch (error) {
        throw new Error('File is not a valid image.');
    }
}

module.exports = {
    optimizeImage,
    validateImage
};
