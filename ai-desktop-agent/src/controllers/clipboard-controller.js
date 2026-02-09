const { clipboard } = require('electron');

class ClipboardController {
    constructor() {
        // Initialize clipboard controller
    }

    async read() {
        try {
            const text = clipboard.readText();
            return text;
        } catch (error) {
            throw new Error(`Failed to read clipboard: ${error.message}`);
        }
    }

    async write(text) {
        try {
            clipboard.writeText(text);
            return true;
        } catch (error) {
            throw new Error(`Failed to write to clipboard: ${error.message}`);
        }
    }

    async clear() {
        try {
            clipboard.clear();
            return true;
        } catch (error) {
            throw new Error(`Failed to clear clipboard: ${error.message}`);
        }
    }

    // Additional Electron clipboard methods
    readHTML() {
        try {
            return clipboard.readHTML();
        } catch (error) {
            throw new Error(`Failed to read HTML from clipboard: ${error.message}`);
        }
    }

    writeHTML(html) {
        try {
            clipboard.writeHTML(html);
            return true;
        } catch (error) {
            throw new Error(`Failed to write HTML to clipboard: ${error.message}`);
        }
    }

    readImage() {
        try {
            return clipboard.readImage();
        } catch (error) {
            throw new Error(`Failed to read image from clipboard: ${error.message}`);
        }
    }

    writeImage(image) {
        try {
            clipboard.writeImage(image);
            return true;
        } catch (error) {
            throw new Error(`Failed to write image to clipboard: ${error.message}`);
        }
    }
}

module.exports = ClipboardController;
