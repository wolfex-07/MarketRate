class TemplateGenerator {
    constructor() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.backgroundImage = null;
        this.tableData = [];
        
        this.initializeEventListeners();
        this.setupDefaultTemplate();
    }

    initializeEventListeners() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date-input').value = today;
        
        // Form controls
        document.getElementById('image-upload').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('background-opacity').addEventListener('input', (e) => {
            document.getElementById('opacity-value').textContent = e.target.value;
            this.generateTemplate();
        });
        document.getElementById('date-input').addEventListener('change', () => this.generateTemplate());
        document.getElementById('table-data').addEventListener('input', () => this.generateTemplate());
        document.getElementById('text-color').addEventListener('change', () => this.generateTemplate());
        
        // Buttons
        document.getElementById('download-btn').addEventListener('click', () => this.downloadImage());
        document.getElementById('share-btn').addEventListener('click', () => this.shareImage());
    }

    setupDefaultTemplate() {
        // Create a default background with gradient
        this.createDefaultBackground();
        this.generateTemplate();
    }

    createDefaultBackground() {
        const canvas = document.createElement('canvas');
        canvas.width = 595;  // A4 width in pixels (at 72 DPI)
        canvas.height = 842; // A4 height in pixels (at 72 DPI)
        const ctx = canvas.getContext('2d');
        
        // Create a beautiful gradient background
        const gradient = ctx.createLinearGradient(0, 0, 595, 842);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 595, 842);
        
        // Add some decorative elements
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * 595, Math.random() * 842, Math.random() * 50 + 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Convert canvas to image
        this.backgroundImage = new Image();
        this.backgroundImage.src = canvas.toDataURL();
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.backgroundImage = new Image();
                this.backgroundImage.onload = () => {
                    this.generateTemplate();
                };
                this.backgroundImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    // Function to fit image to A4 size while filling the entire frame
    fitImageToA4(image, canvasWidth, canvasHeight) {
        const imageAspectRatio = image.width / image.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imageAspectRatio > canvasAspectRatio) {
            // Image is wider than canvas - fit to height and crop width
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imageAspectRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller than canvas - fit to width and crop height
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imageAspectRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        }
        
        return { drawWidth, drawHeight, offsetX, offsetY };
    }

    generateTemplate() {
        if (!this.backgroundImage) return;

        const opacity = parseFloat(document.getElementById('background-opacity').value);
        const tableData = document.getElementById('table-data').value.split('\n').filter(line => line.trim());
        const textColor = document.getElementById('text-color').value;
        const selectedDate = document.getElementById('date-input').value;

        // Calculate rows automatically (always 2 columns)
        const cols = 2;
        const rows = Math.ceil(tableData.length / cols);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background image with opacity, fitted to A4 size
        this.ctx.globalAlpha = opacity;
        const imageFit = this.fitImageToA4(this.backgroundImage, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
            this.backgroundImage, 
            imageFit.offsetX, 
            imageFit.offsetY, 
            imageFit.drawWidth, 
            imageFit.drawHeight
        );
        this.ctx.globalAlpha = 1;

        // Draw table (centered automatically)
        this.drawTable(rows, cols, tableData, 'Rates', textColor, selectedDate);

        // Enable download and share buttons
        document.getElementById('download-btn').disabled = false;
        document.getElementById('share-btn').disabled = false;
    }

    drawTable(rows, cols, tableData, tableTitle, textColor, selectedDate) {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Fixed font size
        const fontSize = 18;
        
        // Calculate table dimensions based on content
        const baseTableWidth = 400;
        const baseCellHeight = 30; // Height per row
        const baseTableHeight = (rows * baseCellHeight) + 40; // Dynamic height + title space
        
        const tableWidth = baseTableWidth;
        const tableHeight = baseTableHeight;
        
        // Calculate cell dimensions
        const cellWidth = tableWidth / cols;
        const cellHeight = (tableHeight - 40) / rows; // Subtract title space
        
        // Center the table on canvas
        const tableX = (canvasWidth - tableWidth) / 2;
        const tableY = (canvasHeight - tableHeight) / 2;
        
        // Draw date at top right
        this.ctx.fillStyle = textColor;
        this.ctx.font = `bold ${fontSize + 4}px Arial`;
        this.ctx.textAlign = 'right';
        this.ctx.fillText(selectedDate, tableX + tableWidth - 10, tableY - 15);
        
        // Draw title
        this.ctx.fillStyle = textColor;
        this.ctx.font = `bold ${fontSize + 8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(tableTitle, tableX + tableWidth/2, tableY - 15);

        // Draw only outer table border (no inner lines)
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(tableX, tableY, tableWidth, tableHeight - 20); // Adjust for title

        // Draw only vertical divider line (no horizontal lines)
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(tableX + cellWidth, tableY);
        this.ctx.lineTo(tableX + cellWidth, tableY + tableHeight - 20);
        this.ctx.stroke();

        // Draw cells and content with bold text
        this.ctx.font = `bold ${fontSize}px Arial`;
        this.ctx.fillStyle = textColor;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = tableX + (col * cellWidth);
                const y = tableY + 20 + (row * cellHeight); // Add title offset
                
                // Draw cell content
                const cellIndex = (row * cols) + col;
                const cellText = tableData[cellIndex] || '';
                
                // Handle long text by wrapping with minimal padding
                this.drawWrappedText(cellText, x + cellWidth/2, y + cellHeight/2, cellWidth - 5, cellHeight - 5, fontSize);
            }
        }
    }

    drawWrappedText(text, x, y, maxWidth, maxHeight, fontSize) {
        const words = text.split(' ');
        let line = '';
        let lines = [];
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        
        // Draw lines with bold font
        this.ctx.font = `bold ${fontSize}px Arial`;
        const lineHeight = fontSize + 4;
        const startY = y - (lines.length * lineHeight) / 2;
        
        for (let i = 0; i < lines.length; i++) {
            this.ctx.fillText(lines[i], x, startY + (i * lineHeight));
        }
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = 'template-generated.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }

    shareImage() {
        // Convert canvas to blob
        this.canvas.toBlob((blob) => {
            if (navigator.share && navigator.canShare) {
                // Use native share API if available
                const file = new File([blob], 'rate-template.png', { type: 'image/png' });
                navigator.share({
                    title: 'Rate Template',
                    text: 'Check out this rate template!',
                    files: [file]
                }).catch((error) => {
                    console.log('Error sharing:', error);
                    this.fallbackShare(blob);
                });
            } else {
                // Fallback for browsers that don't support native sharing
                this.fallbackShare(blob);
            }
        }, 'image/png');
    }

    fallbackShare(blob) {
        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Try to open WhatsApp Web with the image
        const whatsappUrl = `https://web.whatsapp.com/send?text=Check out this rate template!`;
        
        // Create a temporary link to download the image
        const link = document.createElement('a');
        link.href = url;
        link.download = 'rate-template.png';
        link.click();
        
        // Clean up the URL
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // Show a message to the user
        alert('Image downloaded! You can now share it via WhatsApp or any other app.');
    }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TemplateGenerator();
});
