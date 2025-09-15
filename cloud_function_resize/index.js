const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp'); // Image processing library

const storage = new Storage();

// Define target sizes (width in pixels)
const SIZES = {
    thumbnail: 56, // For comparison slots
    medium: 200,   // For bike list
    large: 800     // For detail page
};

/**
 * Resizes an image uploaded to Cloud Storage.
 *
 * @param {object} event The Cloud Storage event.
 * @param {string} event.name The name of the file.
 * @param {string} event.bucket The name of the bucket.
 */
exports.resizeImage = async (event) => {
    const file = event;
    const bucketName = file.bucket;
    const fileName = file.name;
    const contentType = file.contentType;

    // Exit if this is not an image or if it's already a resized image
    // We'll use a naming convention like 'original_filename_thumbnail.png'
    // to avoid infinite loops if the function is triggered by its own output.
    if (!contentType.startsWith('image/') || fileName.includes('_thumbnail.') || fileName.includes('_medium.') || fileName.includes('_large.')) {
        console.log(`Skipping file ${fileName} (not an image or already resized).`);
        return;
    }

    const bucket = storage.bucket(bucketName);
    const fileRef = bucket.file(fileName);

    console.log(`Processing image: ${fileName} from bucket: ${bucketName}`);

    try {
        const [data] = await fileRef.download();
        console.log(`Downloaded ${fileName}`);

        for (const sizeName in SIZES) {
            const size = SIZES[sizeName];
            const newFileName = `${fileName.split('.')[0]}_${sizeName}.${fileName.split('.').pop()}`;
            const newFileRef = bucket.file(newFileName);

            console.log(`Resizing ${fileName} to ${size}px (${sizeName})...`);
            const resizedBuffer = await sharp(data)
                .resize(size, size, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();

            await newFileRef.save(resizedBuffer, {
                contentType: contentType,
                metadata: {
                    'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
                }
            });
            console.log(`Uploaded resized image: ${newFileName}`);
        }

        console.log(`Finished processing ${fileName}.`);
    } catch (err) {
        console.error(`Failed to resize image ${fileName}:`, err);
        throw err;
    }
};